const pool = require('../db/connection');

async function getLatestAnnouncement() {
    // Exact schema matching: id, title, message
    const [rows] = await pool.query(
        'SELECT * FROM announcements WHERE id = 1 LIMIT 1'
    );
    return rows[0] || null;
}

async function updateAnnouncement(data) {
    const { title, message } = data;
    // Matching exact schema for updates
    const [result] = await pool.query(
        'UPDATE announcements SET title = ?, message = ? WHERE id = 1',
        [title, message]
    );
    
    // If we didn't update anything, try to insert a new one for id=1
    if (result.affectedRows === 0) {
        await pool.query(
            'INSERT INTO announcements (id, title, message) VALUES (1, ?, ?)',
            [title, message]
        );
        return true;
    }
    
    return result.affectedRows > 0;
}

module.exports = { getLatestAnnouncement, updateAnnouncement };
