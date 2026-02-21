const pool = require('../db/connection');
const { createOrder } = require('../models/order');
const { addOrderItem } = require('../models/orderItem');
const { updateStock } = require('../models/product');

async function placeOrder(req, res) {
  const { customer_name, phone, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += item.price * item.quantity;
    });

    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_name, phone, total_amount, status) VALUES (?, ?, ?, ?)',
      [customer_name, phone, totalAmount, 'pending']
    );
    const orderId = orderResult.insertId;

    for (let item of items) {
      const stockUpdated = await updateStock(conn, item.product_id, item.quantity);

      if (!stockUpdated) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      await addOrderItem(conn, orderId, item.product_id, item.quantity, item.price);
    }

    await conn.commit();
    res.json({ success: true, message: 'Order placed', orderId });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = { placeOrder };