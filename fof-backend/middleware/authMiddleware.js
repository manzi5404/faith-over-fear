const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fof_secret');
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

        if (!adminEmails.includes(decoded.email.toLowerCase())) {
            // Immediately destroy session if email not on whitelist
            res.clearCookie('auth_token');
            return res.status(403).json({ success: false, message: 'Unauthorized. Non-admin account.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired' });
        }
        res.clearCookie('auth_token');
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = { verifyAdmin };
