const pool = require('../db/connection');

const checkStoreMode = async (req, res, next) => {
    const restrictedPaths = ['/api/momo-pay'];

    const isRestrictedPath = restrictedPaths.some(path => req.originalUrl.startsWith(path));
    const isPostMethod = req.method === 'POST';

    if (isRestrictedPath && isPostMethod) {
        try {
            const [rows] = await pool.query('SELECT store_mode FROM store_config WHERE id = 1');
            const config = rows[0];

            if (config && config.store_mode === 'reserve') {
                return res.status(403).json({
                    success: false,
                    message: 'Restricted Status: The store is currently in Reserve Mode. Standard checkouts are disabled.',
                    mode: 'reserve'
                });
            }
        } catch (error) {
            console.error('Store Mode Middleware Error:', error);
        }
    }

    next();
};

module.exports = checkStoreMode;
