const pool = require('../db/connection');

async function getLatestAnnouncement() {
    // Return the specific announcement with ID 1 as requested, 
    // or the latest enabled one if we want flexibility. 
    // The prompt says "Returns the latest enabled announcement (ID: 1)".
    const [rows] = await pool.query(
        'SELECT * FROM announcements WHERE is_enabled = 1 AND id = 1 LIMIT 1'
    );
    return rows[0] || null;
}

async function updateAnnouncement(data) {
    const { title, message, is_enabled } = data;
    // Increment version number on every update
    const [result] = await pool.query(
        'UPDATE announcements SET title = ?, message = ?, is_enabled = ?, version = version + 1 WHERE id = 1',
        [title, message, is_enabled]
    );
    return result.affectedRows > 0;
}

module.exports = { getLatestAnnouncement, updateAnnouncement };
