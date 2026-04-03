const pool = require('../db/connection');

const getStoreConfig = async (req, res) => {
    try {
        let [rows] = await pool.query('SELECT * FROM store_config WHERE id = 1');
        
        if (rows.length === 0) {
            // Auto-initialize if missing
            await pool.query('INSERT INTO store_config (id, store_mode, announcement) VALUES (1, "closed", "Welcome to Faith Over Fear")');
            [rows] = await pool.query('SELECT * FROM store_config WHERE id = 1');
        }
        
        res.json({ success: true, config: rows[0] });
    } catch (error) {
        console.error('Fetch Store Config Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch store config', error: "Internal Server Error" });
    }
};

const updateStoreConfig = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Missing request body' });
        }

        const { store_mode, announcement } = req.body;
        
        // Validate store_mode against user-defined strategy
        const validModes = ['live', 'reserve', 'closed'];
        if (store_mode && !validModes.includes(store_mode)) {
            return res.status(400).json({ success: false, message: `Invalid store mode. Allowed: ${validModes.join(', ')}` });
        }

        await pool.query(
            'UPDATE store_config SET store_mode = ?, announcement = ? WHERE id = 1',
            [store_mode || 'closed', announcement || '']
        );
        res.json({ success: true, message: 'Store configuration updated successfully' });
    } catch (error) {
        console.error('Update Store Config Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update store config', error: "Internal Server Error" });
    }
};

module.exports = {
    getStoreConfig,
    updateStoreConfig
};
