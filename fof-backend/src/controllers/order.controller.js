const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const orderService = require('../services/order.service');
const { handleServiceError } = require('../utils/responseHandler');

async function createOrder(req, res) {
  try {
    const customerData = {
      customer_name: req.body.customer_name,
      customer_email: req.body.customer_email,
      customer_phone: req.body.customer_phone,
      shipping_address: req.body.shipping_address,
      payment_method: req.body.payment_method || 'reservation',
    };

    let order;
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      order = await orderService.createDirect(req.user.id, customerData, req.body.items);
    } else {
      order = await orderService.createFromCart(req.user.id, customerData);
    }

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        items: (order.order_items || []).map((item) => ({
          product_name: item.product_name,
          size: item.size,
          color: item.color,
          unit_price: item.unit_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      },
    });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await orderService.getMyOrders(req.user.id);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function getOrderById(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function getAllOrders(req, res) {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const orders = await orderService.getAllOrders(filters);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await orderService.transitionStatus(req.params.id, status);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function cancelOrder(req, res) {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
