const pool = require('../db/connection');

/**
 * storeModeMiddleware
 * Blocks order-related POST requests if the store is in 'reserve' mode.
 */
const checkStoreMode = async (req, res, next) => {
    // We only care about blocking order placements and payments
    const restrictedPaths = ['/api/orders', '/api/momo-pay'];

    // Check if the current request is a POST to a restricted path
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
            // On error, let the request proceed to avoid blocking the site if DB is acting up
        }
    }

    next();
};

module.exports = checkStoreMode;
