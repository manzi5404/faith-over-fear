const { pool } = require('../db/connection');
const productService = require('./product');

async function addDrop(drop) {
  const { title, description, image_url, release_date, status, collection_id } = drop;
  const [result] = await pool.query(
    `INSERT INTO drops (title, description, image_url, release_date, status, collection_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      title,
      description || null,
      image_url || null,
      release_date || null,
      status || 'upcoming',
      collection_id || null
    ]
  );
  return result.insertId;
}

async function getDrops(statusFilter = null, includeProducts = false) {
  let sql = 'SELECT * FROM drops';
  let params = [];
  
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active' || statusFilter === 'true') {
      sql += ' WHERE status = "live" OR status = "reservation"';
    } else {
      sql += ' WHERE status = ?';
      params.push(statusFilter);
    }
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const [rows] = await pool.query(sql, params);

  if (includeProducts && rows.length > 0) {
    const productsByDrop = await Promise.all(rows.map(row => productService.getProductsByDropId(row.id)));
    rows.forEach((row, index) => {
      row.products = productsByDrop[index] || [];
    });
  }

  return rows;
}

async function editDrop(id, drop) {
  const { title, description, image_url, release_date, status, collection_id } = drop;
  
  const [rows] = await pool.query(
    `UPDATE drops SET title = ?, description = ?, image_url = ?, release_date = ?, status = ?, collection_id = ?
     WHERE id = ?`,
    [
      title,
      description || null,
      image_url || null,
      release_date || null,
      status || 'upcoming',
      collection_id || null,
      id
    ]
  );
  return rows.affectedRows > 0;
}

async function deleteDrop(id) {
  const [rows] = await pool.query('DELETE FROM drops WHERE id = ?', [id]);
  return rows.affectedRows > 0;
}

module.exports = { addDrop, getDrops, editDrop, deleteDrop };