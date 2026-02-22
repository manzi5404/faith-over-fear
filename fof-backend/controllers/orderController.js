const pool = require('../db/connection');
const { addOrderItem } = require('../models/orderItem');
// Removed updateStock import because we don't need stock for made-to-order
// const { updateStock } = require('../models/product');

async function placeOrder(req, res) {
  const { customer_name, phone, items, totalAmount: clientTotal } = req.body;

  // Validate numeric fields
  items.forEach(item => {
    item.quantity = Number(item.quantity);
    item.price = Number(item.price);

    if (isNaN(item.quantity) || item.quantity <= 0)
      throw new Error(`Invalid quantity for product ${item.product_id}`);
    if (isNaN(item.price) || item.price < 0)
      throw new Error(`Invalid price for product ${item.product_id}`);
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate total
    let calculatedTotal = 0;
    items.forEach(item => {
      calculatedTotal += item.price * item.quantity;
    });
    const totalAmount = clientTotal || calculatedTotal;

    // Insert main order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_name, phone, total_amount, status) VALUES (?, ?, ?, ?)',
      [customer_name, phone, totalAmount, 'pending']
    );
    const orderId = orderResult.insertId;

    // Add order items (skip stock logic)
    for (let item of items) {
      await addOrderItem(conn, orderId, item.product_id, item.quantity, item.price, item.size);
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