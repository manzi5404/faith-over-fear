const pool = require('../db/connection');

async function addDrop(drop) {
  const { name, type, price, sizes, images, is_active } = drop;
  const [result] = await pool.query(
    'INSERT INTO drops (name, type, price, sizes, images, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [
      name,
      type || 'new-drop',
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      is_active ? 1 : 0
    ]
  );
  return result.insertId;
}

async function getDrops(activeOnly = false) {
  const sql = activeOnly
    ? 'SELECT * FROM drops WHERE is_active = 1'
    : 'SELECT * FROM drops';
  const [rows] = await pool.query(sql);
  return rows.map(row => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : (row.sizes || [])
  }));
}

async function editDrop(id, drop) {
  const { name, type, price, sizes, images, is_active } = drop;
  const [rows] = await pool.query(
    'UPDATE drops SET name = ?, type = ?, price = ?, sizes = ?, images = ?, is_active = ? WHERE id = ?',
    [
      name,
      type,
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      is_active ? 1 : 0,
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