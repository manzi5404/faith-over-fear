const pool = require('../db/connection');

async function createOrder(customerName, phone, totalAmount) {
  const [result] = await pool.query(
    'INSERT INTO orders (customer_name, phone, total_amount, status) VALUES (?, ?, ?, ?)',
    [customerName, phone, totalAmount, 'pending']
  );
  return result.insertId;
}

module.exports = { createOrder };