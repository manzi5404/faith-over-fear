const pool = require('../db/connection');

async function addDrop(drop) {
  const { name, price, sizes, image_url, is_active } = drop;
  const [result] = await pool.query(
    'INSERT INTO drops (name, price, sizes, image_url, is_active) VALUES (?, ?, ?, ?, ?)',
    [name, price, JSON.stringify(sizes), image_url, is_active ? 1 : 0]
  );
  return result.insertId;
}

async function getDrops(activeOnly = false) {
  const sql = activeOnly
    ? 'SELECT * FROM drops WHERE is_active = 1'
    : 'SELECT * FROM drops';
  const [rows] = await pool.query(sql);
  return rows;
}

async function editDrop(id, drop) {
  const { name, price, sizes, image_url, is_active } = drop;
  const [rows] = await pool.query(
    'UPDATE drops SET name = ?, price = ?, sizes = ?, image_url = ?, is_active = ? WHERE id = ?',
    [name, price, JSON.stringify(sizes), image_url, is_active ? 1 : 0, id]
  );
  return rows.affectedRows > 0;
}

async function deleteDrop(id) {
  const [rows] = await pool.query('DELETE FROM drops WHERE id = ?', [id]);
  return rows.affectedRows > 0;
}

module.exports = { addDrop, getDrops, editDrop, deleteDrop };