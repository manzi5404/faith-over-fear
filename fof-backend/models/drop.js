const pool = require('../db/connection');

async function addDrop(drop) {
  // Use title instead of name, and include new columns
  const { title, type, price, sizes, images, is_active, colors, category, collection } = drop;
  const [result] = await pool.query(
    `INSERT INTO drops (title, type, price, sizes, images, is_active, colors, category, collection)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      type || 'new-drop',
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      is_active ? 1 : 0,
      JSON.stringify(colors || []),   // colors is a JSON array
      category || null,
      collection || null
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
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : (row.sizes || []),
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || [])
  }));
}

async function editDrop(id, drop) {
  // Use title instead of name, and include new columns
  const { title, type, price, sizes, images, is_active, colors, category, collection } = drop;
  const [rows] = await pool.query(
    `UPDATE drops SET title = ?, type = ?, price = ?, sizes = ?, images = ?, is_active = ?, colors = ?, category = ?, collection = ?
     WHERE id = ?`,
    [
      title,
      type,
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      is_active ? 1 : 0,
      JSON.stringify(colors || []),
      category || null,
      collection || null,
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