const pool = require('../db/connection');

async function addDrop(drop) {
  const { title, description, type, price, sizes, images, status, colors, category, collection } = drop;
  // map legacy is_active -> status if needed
  let finalStatus = status || (drop.is_active ? 'live' : 'upcoming');
  const [result] = await pool.query(
    `INSERT INTO drops (title, description, type, price, sizes, images, status, colors, category, collection, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description || null,
      type || 'new-drop',
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      finalStatus,
      JSON.stringify(colors || []),
      category || null,
      collection || null,
      finalStatus === 'live' ? 1 : 0
    ]
  );
  return result.insertId;
}

async function getDrops(statusFilter = null) {
  let sql = 'SELECT * FROM drops';
  let params = [];
  if (statusFilter) {
    if (statusFilter === 'active' || statusFilter === 'true') {
      // Legacy compat
      sql += ' WHERE is_active = 1 OR status = "live"';
    } else {
      sql += ' WHERE status = ?';
      params.push(statusFilter);
    }
  }
  
  const [rows] = await pool.query(sql, params);
  return rows.map(row => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : (row.sizes || []),
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : (row.colors || [])
  }));
}

async function editDrop(id, drop) {
  const { title, description, type, price, sizes, images, status, colors, category, collection } = drop;
  let finalStatus = status || (drop.is_active !== undefined ? (drop.is_active ? 'live' : 'upcoming') : 'upcoming');
  
  const [rows] = await pool.query(
    `UPDATE drops SET title = ?, description = ?, type = ?, price = ?, sizes = ?, images = ?, status = ?, colors = ?, category = ?, collection = ?, is_active = ?
     WHERE id = ?`,
    [
      title,
      description || null,
      type,
      price || null,
      JSON.stringify(sizes || []),
      JSON.stringify(images || []),
      finalStatus,
      JSON.stringify(colors || []),
      category || null,
      collection || null,
      finalStatus === 'live' ? 1 : 0,
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