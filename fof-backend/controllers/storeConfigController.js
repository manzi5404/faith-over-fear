const pool = require('../db/connection');

const getStoreConfig = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM store_config WHERE id = 1');
        res.json({ success: true, config: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch store config', error: error.message });
    }
};

const updateStoreConfig = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Missing request body' });
        }

        const { store_mode, announcement_message, banner_enabled } = req.body;

        await pool.query(
            'UPDATE store_config SET store_mode = ?, announcement_message = ?, banner_enabled = ? WHERE id = 1',
            [store_mode, announcement_message, banner_enabled ? 1 : 0]
        );
        res.json({ success: true, message: 'Store configuration updated successfully' });
    } catch (error) {
        console.error('Update Store Config Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update store config', error: error.message });
    }
};

module.exports = {
    getStoreConfig,
    updateStoreConfig
};
