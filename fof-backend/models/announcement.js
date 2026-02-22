const pool = require('../db/connection');

async function getActiveAnnouncements() {
    const [rows] = await pool.query(
        'SELECT * FROM announcements WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())'
    );
    return rows;
}

async function addAnnouncement(message, expiresAt = null) {
    const [result] = await pool.query(
        'INSERT INTO announcements (message, expires_at) VALUES (?, ?)',
        [message, expiresAt]
    );
    return result.insertId;
}

async function deleteAnnouncement(id) {
    const [result] = await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

module.exports = { getActiveAnnouncements, addAnnouncement, deleteAnnouncement };
