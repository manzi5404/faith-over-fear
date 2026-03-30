const pool = require('../db/connection');
const notification = require('../models/notification');

const createReservation = async (req, res) => {
    console.log("=== INCOMING RESERVATION REQUEST ===");
    console.log("Headers:", JSON.stringify(req.headers['content-type']));
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const { fullName, email: bodyEmail, phone, productId, size, color, quantity } = req.body;
    const userId = req.user ? req.user.id : null;
    const email = req.user ? req.user.email : bodyEmail;

    // Basic validation check
    if (!email || !productId) {
        console.error("Missing required reservation fields:", { email, productId });
        return res.status(400).json({ success: false, message: 'Missing email or productId' });
    }

    try {
        console.log("Executing DB Insert for Reservation...");
        console.log("Insert values:", {
            userId: userId || null,
            fullName: fullName || 'Anonymous',
            email,
            phone: phone || 'N/A',
            productId,
            size: size || 'M',
            color: color || 'Default',
            quantity: quantity || 1
        });

        const [result] = await pool.query(
            `INSERT INTO reservations (user_id, full_name, email, phone, product_id, size, color, quantity, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, fullName || 'Anonymous', email, phone || 'N/A', productId, size || 'M', color || 'Default', quantity || 1]
        );

        console.log("✅ Reservation Insert Success ID:", result.insertId);

        // Create notification for admin
        await notification.createNotification(
            'reservation',
            result.insertId,
            `New reservation from ${fullName || 'Anonymous'}`,
            `Product ID: ${productId} | Size: ${size || 'M'} | Qty: ${quantity || 1}`
        );

        res.status(201).json({
            success: true,
            message: 'Reservation recorded successfully',
            reservationId: result.insertId
        });
    } catch (error) {
        console.error("❌ DB Reservation Error:", error);
        console.error("Error code:", error.code);
        console.error("Error sqlMessage:", error.sqlMessage);
        res.status(500).json({
            success: false,
            message: 'Failed to create reservation',
            error: error.message,
            code: error.code
        });
    }
};

const getReservations = async (req, res) => {
    // If called via the protected 'me' route, use req.user.id
    // Otherwise, fallback to query params (for admin or search)
    const userId = req.user ? req.user.id : req.query.userId;
    const email = req.user ? req.user.email : req.query.email;

    try {
        let query = `
            SELECT 
                r.*, 
                p.name as productName, 
                p.image_urls as productImageUrls
            FROM reservations r 
            LEFT JOIN products p ON r.product_id = p.id 
        `;
        const params = [];

        if (userId) {
            query += ` WHERE r.user_id = ? `;
            params.push(userId);
        } else if (email) {
            query += ` WHERE r.email = ? `;
            params.push(email);
        }

        query += ` ORDER BY r.created_at DESC `;

        const [rows] = await pool.query(query, params);
        res.json({ success: true, reservations: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reservations', error: error.message });
    }
};

const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Reservation status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

module.exports = {
    createReservation,
    getReservations,
    updateReservationStatus
};
