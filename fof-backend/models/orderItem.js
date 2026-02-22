const pool = require('../db/connection');

async function addOrderItem(conn, orderId, productId, quantity, price, size) {
  const db = conn || pool;
  const [result] = await db.query(
    'INSERT INTO order_items (order_id, product_id, quantity, size, price) VALUES (?, ?, ?, ?, ?)',
    [orderId, productId, quantity, size, price]
  );
  return result.insertId;
}

module.exports = { addOrderItem };