const pool = require('../db/connection');

async function createProduct(product) {
  const { drop_id, name, description, price, sizes, colors, image_urls, is_active } = product;
  const [result] = await pool.query(
    'INSERT INTO products (drop_id, name, description, price, sizes, colors, image_urls, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      drop_id,
      name,
      description,
      price,
      JSON.stringify(sizes || []),
      JSON.stringify(colors || []),
      JSON.stringify(image_urls || []),
      is_active ? 1 : 0
    ]
  );
  return result.insertId;
}

async function getProductsByDropId(dropId) {
  const [rows] = await pool.query('SELECT * FROM products WHERE drop_id = ?', [dropId]);
  return rows.map(row => ({
    ...row,
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
    image_urls: typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls
  }));
}

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
    image_urls: typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls
  };
}

async function getAllProducts() {
  const [rows] = await pool.query('SELECT * FROM products');
  return rows.map(row => ({
    ...row,
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes,
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
    image_urls: typeof row.image_urls === 'string' ? JSON.parse(row.image_urls) : row.image_urls
  }));
}

async function updateProduct(id, product) {
  const { name, description, price, sizes, colors, image_urls, is_active } = product;
  const [result] = await pool.query(
    'UPDATE products SET name = ?, description = ?, price = ?, sizes = ?, colors = ?, image_urls = ?, is_active = ? WHERE id = ?',
    [
      name,
      description,
      price,
      JSON.stringify(sizes || []),
      JSON.stringify(colors || []),
      JSON.stringify(image_urls || []),
      is_active ? 1 : 0,
      id
    ]
  );
  return result.affectedRows > 0;
}

async function deleteProduct(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  createProduct,
  getProductsByDropId,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct
};