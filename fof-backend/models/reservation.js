const { pool } = require('../db/connection');

async function createReservation(data) {
  const {
    user_id,
    full_name,
    email,
    phone,
    product_id,
    product_name,
    size,
    color,
    quantity,
    quality_level_id,
    price_at_purchase,
    store_mode
  } = data;

  const result = await pool.query(
    `INSERT INTO reservations (
        user_id, full_name, email, phone, product_id, product_name,
        size, color, quantity, quality_level_id, price_at_purchase,
        store_mode, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
     RETURNING id`,
    [
      user_id || null,
      full_name,
      email,
      phone,
      product_id,
      product_name,
      size,
      color,
      quantity,
      quality_level_id || null,
      price_at_purchase,
      store_mode || 'live'
    ]
  );
  return result.rows[0].id;
}

async function getReservations(filters = {}) {
  let query = `
    SELECT 
        r.*,
        p.name AS productName,
        p.image_urls AS productImageUrls,
        p.price AS productBasePrice,
        u.name AS userName,
        u.email AS userEmail,
        ql.name AS qualityName
    FROM reservations r
    LEFT JOIN products p ON r.product_id = p.id
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN quality_levels ql ON r.quality_level_id = ql.id
  `;

  const whereClauses = [];
  const params = [];
  let paramIndex = 1;

  if (filters.status && filters.status !== 'all') {
    whereClauses.push(`r.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.productId && filters.productId !== 'all') {
    whereClauses.push(`r.product_id = $${paramIndex}`);
    params.push(filters.productId);
    paramIndex++;
  }
  if (filters.startDate) {
    whereClauses.push(`r.created_at >= $${paramIndex}`);
    params.push(`${filters.startDate}T00:00:00`);
    paramIndex++;
  }
  if (filters.endDate) {
    whereClauses.push(`r.created_at <= $${paramIndex}`);
    params.push(`${filters.endDate}T23:59:59`);
    paramIndex++;
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  query += ` ORDER BY r.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function updateReservationStatus(id, status) {
  const result = await pool.query(
    'UPDATE reservations SET status = $1 WHERE id = $2',
    [status, id]
  );
  return result.rowCount > 0;
}

async function deleteReservation(id) {
  const result = await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  createReservation,
  getReservations,
  updateReservationStatus,
  deleteReservation
};
