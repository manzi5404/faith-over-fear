const pool = require('../db/connection');

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
}

async function getAllProducts() {
  const [rows] = await pool.query('SELECT * FROM products');
  return rows;
}

module.exports = { getProductById, getAllProducts };