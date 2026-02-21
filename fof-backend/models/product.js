const pool = require('../db/connection');

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
}

async function getAllProducts() {
  const [rows] = await pool.query('SELECT * FROM products');
  return rows;
}

async function updateStock(conn, productId, quantity) {
  const [result] = await conn.query(
    `UPDATE drops 
     SET stock = stock - ? 
     WHERE id = ? AND stock >= ?`,
    [quantity, productId, quantity]
  );

  return result.affectedRows > 0;
}

module.exports = { getProductById, getAllProducts, updateStock };