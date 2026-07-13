const orderRepo = require('../repositories/order.repository');
const variantRepo = require('../repositories/variant.repository');
const productRepo = require('../repositories/product.repository');
const dropService = require('./drop.service');
const cartRepo = require('../repositories/cart.repository');
const { events } = require('../events');
const { AppError, ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');

const TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

function canTransition(from, to) {
  return TRANSITIONS[from] && TRANSITIONS[from].includes(to);
}

async function createFromCart(userId, customerData, sessionId = null) {
  const cart = await cartRepo.findOrCreate(userId, sessionId);
  const cartItems = await cartRepo.getCartWithItems(cart.id);

  if (cartItems.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  const activeDrop = await dropService.getActiveDrop();
  if (!activeDrop) {
    throw new ValidationError('Store is not currently active');
  }

  const enrichedItems = [];
  const invalidItems = [];
  const seenDropIds = new Set();

  for (const item of cartItems) {
    const v = item.product_variants;
    const p = item.products;

    if (!v || !p) {
      invalidItems.push({ cartItemId: item.id, error: 'Variant or product no longer exists' });
      continue;
    }

    if (v.stock < item.quantity) {
      invalidItems.push({
        cartItemId: item.id,
        variantId: v.id,
        error: `Insufficient stock for ${v.color}/${v.size}. Available: ${v.stock}, in cart: ${item.quantity}`,
      });
      continue;
    }

    seenDropIds.add(p.drop_id);

    const unitPrice = v.price_override || p.base_price;
    enrichedItems.push({
      variantId: v.id,
      productName: p.name,
      size: v.size,
      color: v.color,
      unitPrice: Number(unitPrice),
      quantity: item.quantity,
      subtotal: Number((unitPrice * item.quantity).toFixed(2)),
    });
  }

  if (invalidItems.length > 0) {
    throw new ValidationError(JSON.stringify({ message: 'Cart contains invalid items', issues: invalidItems }));
  }

  for (const dropId of seenDropIds) {
    const dropValid = await dropService.validateDropWindow(dropId);
    if (!dropValid) {
      throw new ValidationError('One or more products are no longer available. Please update your cart.');
    }
  }

  const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await orderRepo.create({
    user_id: userId,
    status: 'pending_payment',
    customer_name: customerData.customer_name || null,
    customer_email: customerData.customer_email || null,
    customer_phone: customerData.customer_phone || null,
    shipping_address: customerData.shipping_address || null,
    total_amount: Number(totalAmount.toFixed(2)),
    payment_method: customerData.payment_method || 'reservation',
    payment_reference: null,
  });

  const reservedVariants = [];
  try {
    for (const item of enrichedItems) {
      await variantRepo.reserveStock(item.variantId, item.quantity, order.id);
      reservedVariants.push({ variantId: item.variantId, quantity: item.quantity });
      events.emit(events.INVENTORY_RESERVED, { variantId: item.variantId, orderId: order.id, quantity: item.quantity });

      await orderRepo.createOrderItem(order.id, {
        product_variant_id: item.variantId,
        product_name: item.productName,
        size: item.size,
        color: item.color,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }
  } catch (err) {
    for (const rv of reservedVariants) {
      try {
         await variantRepo.returnStock(rv.variantId, rv.quantity, order.id);
      } catch (returnErr) {
        console.error('Failed to return stock during rollback:', returnErr);
      }
    }
    throw new ValidationError('Failed to create order due to inventory conflict. Please try again.');
  }

  await cartRepo.clearCart(cart.id);

  const fullOrder = await orderRepo.findById(order.id);
  events.emit(events.ORDER_CREATED, { order: fullOrder });

  return fullOrder;
}

async function createDirect(userId, customerData, items, sessionId = null) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one item is required', 400);
  }

  const activeDrop = await dropService.getActiveDrop();
  if (!activeDrop) {
    throw new AppError('Store is not currently active', 400);
  }

  const enrichedItems = [];
  for (const item of items) {
    const variant = await variantRepo.findById(item.variantId);
    if (!variant) {
      throw new AppError(`Variant not found: ${item.variantId}`, 404);
    }

    const product = await productRepo.findById(variant.product_id);
    if (!product) {
      throw new AppError(`Product not found for variant ${variant.id}`, 404);
    }

    if (product.drop_id !== activeDrop.id) {
      throw new AppError(`Product "${product.name}" is not from the active drop`, 400);
    }

    const qty = Number(item.quantity) || 1;
    if (qty < 1 || qty > 99) {
      throw new AppError('Quantity must be between 1 and 99', 400);
    }

    if (variant.stock < qty) {
      throw new AppError(`Insufficient stock for ${variant.color}/${variant.size}`, 400);
    }

    const unitPrice = variant.price_override || product.base_price;
    enrichedItems.push({
      variantId: variant.id,
      productName: product.name,
      size: variant.size,
      color: variant.color,
      unitPrice: Number(unitPrice),
      quantity: qty,
      subtotal: Number((unitPrice * qty).toFixed(2)),
    });
  }

  const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await orderRepo.create({
    user_id: userId,
    status: 'pending_payment',
    customer_name: customerData.customer_name || null,
    customer_email: customerData.customer_email || null,
    customer_phone: customerData.customer_phone || null,
    shipping_address: customerData.shipping_address || null,
    total_amount: Number(totalAmount.toFixed(2)),
    payment_method: customerData.payment_method || 'reservation',
    payment_reference: null,
  });

  for (const item of enrichedItems) {
    await variantRepo.reserveStock(item.variantId, item.quantity, order.id);
    await orderRepo.createOrderItem(order.id, item);
  }

  const fullOrder = await orderRepo.findById(order.id);
  events.emit(events.ORDER_CREATED, { order: fullOrder });

  return fullOrder;
}

async function transitionStatus(orderId, newStatus) {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === 'completed' || order.status === 'cancelled') {
    throw new ValidationError(`Cannot transition from terminal state: ${order.status}`);
  }

  if (!canTransition(order.status, newStatus)) {
    throw new ValidationError(`Invalid transition: ${order.status} → ${newStatus}`);
  }

  if (newStatus === 'cancelled' && ['pending_payment', 'paid'].includes(order.status)) {
    for (const item of order.order_items || []) {
      try {
        await variantRepo.returnStock(item.product_variant_id, item.quantity, orderId);
        events.emit(events.INVENTORY_RELEASED, { variantId: item.product_variant_id, orderId, quantity: item.quantity });
      } catch (err) {
        console.error('Failed to return stock on cancel:', err);
      }
    }
  }

  await orderRepo.updateStatus(orderId, newStatus);

  if (newStatus === 'cancelled') {
    events.emit(events.ORDER_CANCELLED, { orderId, status: newStatus });
  }

  return orderRepo.findById(orderId);
}

async function getOrderById(id, userId = null) {
  const order = await orderRepo.findById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (userId && order.user_id !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return order;
}

async function getMyOrders(userId, limit = 50, offset = 0) {
  return orderRepo.findByUserId(userId, limit, offset);
}

async function getAllOrders(filters) {
  return orderRepo.findAllAdmin(filters);
}

async function cancelOrder(orderId) {
  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status === 'cancelled') {
    return order;
  }

  if (order.status === 'completed') {
    throw new ValidationError('Cannot cancel a completed order');
  }

  if (['pending_payment', 'paid'].includes(order.status)) {
    for (const item of order.order_items || []) {
      try {
        await variantRepo.returnStock(item.product_variant_id, item.quantity, orderId);
        events.emit(events.INVENTORY_RELEASED, { variantId: item.product_variant_id, orderId, quantity: item.quantity });
      } catch (err) {
        console.error('Failed to return stock on cancel:', err);
      }
    }
  }

  await orderRepo.updateStatus(orderId, 'cancelled');
  events.emit(events.ORDER_CANCELLED, { orderId, status: 'cancelled' });

  return orderRepo.findById(orderId);
}

module.exports = {
  TRANSITIONS,
  canTransition,
  createFromCart,
  createDirect,
  transitionStatus,
  getOrderById,
  getMyOrders,
  getAllOrders,
  cancelOrder,
};
