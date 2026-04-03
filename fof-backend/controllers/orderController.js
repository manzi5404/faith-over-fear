const orderModel = require('../models/order');
const notification = require('../models/notification');

const createOrder = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const {
        product_id, drop_id, product_name, size, color,
        quantity, total_price, payment_method,
        customer_name, customer_email, phone_number
    } = req.body;

    if (!product_id) {
        return res.status(400).json({ success: false, message: 'product_id is required' });
    }
    if (total_price === undefined || total_price === null) {
        return res.status(400).json({ success: false, message: 'total_price is required' });
    }

    try {
        const orderId = await orderModel.createOrder({
            user_id: userId,
            product_id,
            drop_id: drop_id || null,
            product_name: product_name || null,
            size: size || null,
            color: color || null,
            quantity: quantity || 1,
            total_price,
            payment_method: payment_method || 'reservation',
            customer_name: customer_name || (req.user ? req.user.name : null),
            customer_email: customer_email || (req.user ? req.user.email : null),
            phone_number: phone_number || null
        });

        await notification.createNotification(
            payment_method === 'momo' ? 'payment' : 'reservation',
            orderId,
            `New ${payment_method === 'momo' ? 'MoMo payment' : 'reservation'} from ${customer_name || (req.user ? req.user.name : 'Customer')}`,
            `Product: ${product_name || 'ID ' + product_id} | Qty: ${quantity || 1} | Total: ${total_price} FRW`
        );

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId
        });
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await orderModel.getOrdersByUser(userId);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('❌ Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const { status, productId, startDate, endDate } = req.query;
        const orders = await orderModel.getAllOrders({ status, productId, startDate, endDate });
        res.json({ success: true, orders });
    } catch (error) {
        console.error('❌ Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }

    try {
        const updated = await orderModel.updateOrderStatus(id, status);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error) {
        console.error('❌ Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateStatus
};
