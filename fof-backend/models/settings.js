const pool = require('../db/connection');

async function getSettings() {
    try {
        const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
        return rows.reduce((acc, row) => {
            // Handle boolean conversions for common setting types
            acc[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
            return acc;
        }, {});
    } catch (error) {
        console.error('❌ Database error in settingsModel.getSettings():', error.message);
        throw new Error('Database failed to fetch settings. Ensure the settings table exists.');
    }
}

async function updateSetting(key, value) {
    try {
        const [result] = await pool.query(
            'UPDATE settings SET `value` = ? WHERE `key` = ?',
            [String(value), key]
        );
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Database error in settingsModel.updateSetting():', error.message);
        throw new Error(`Database failed to update setting "${key}".`);
    }
}

module.exports = { getSettings, updateSetting };
