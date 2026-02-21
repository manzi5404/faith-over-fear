const pool = require('../db/connection');

async function addOrderItem(orderId, productId, quantity, price) {
  const [result] = await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
    [orderId, productId, quantity, price]
  );
  return result.insertId;
}

module.exports = { addOrderItem };