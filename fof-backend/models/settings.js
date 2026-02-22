const pool = require('../db/connection');

async function getSettings() {
    const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
    return rows.reduce((acc, row) => {
        // Handle boolean conversions for common setting types
        acc[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
        return acc;
    }, {});
}

async function updateSetting(key, value) {
    const [result] = await pool.query(
        'UPDATE settings SET `value` = ? WHERE `key` = ?',
        [String(value), key]
    );
    return result.affectedRows > 0;
}

module.exports = { getSettings, updateSetting };
