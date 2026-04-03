const pool = require('../db/connection');
const notification = require('../models/notification');
const emailUtils = require('../utils/email');
const productService = require('../models/product');

const createReservation = async (req, res) => {
    console.log("=== INCOMING RESERVATION REQUEST ===");
    console.log("Headers:", JSON.stringify(req.headers['content-type']));
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const { fullName, email: bodyEmail, phone, productId, size, color, quantity, storeMode } = req.body;
    const userId = req.user ? req.user.id : null;
    const email = req.user ? req.user.email : bodyEmail;

    // Basic validation check
    if (!email || !productId) {
        console.error("Missing required reservation fields:", { email, productId });
        return res.status(400).json({ success: false, message: 'Missing email or productId' });
    }

    try {
        console.log("Executing DB Insert for Reservation...");

// Determine proper full name
const resolvedFullName = fullName && fullName.trim() !== '' ? fullName :
    (bodyEmail ? bodyEmail.split('@')[0] : 'Guest');

const reservationData = {
    userId,
    fullName: resolvedFullName,
    email,
    phone: phone || 'N/A',
    productId,
    size: size || 'M',
    color: color || 'Default',
    quantity: quantity || 1,
    storeMode: storeMode || 'live'
};

        const [result] = await pool.query(
            `INSERT INTO reservations (user_id, full_name, email, phone, product_id, size, color, quantity, store_mode, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                reservationData.userId, 
                reservationData.fullName, 
                reservationData.email, 
                reservationData.phone, 
                reservationData.productId, 
                reservationData.size, 
                reservationData.color, 
                reservationData.quantity,
                reservationData.storeMode
            ]
        );

        console.log("✅ Reservation Insert Success ID:", result.insertId);

        // Fetch product info for notification
        const product = await productService.getProductById(productId);

        // Create in-app notification for admin
        await notification.createNotification(
            'reservation',
            result.insertId,
            `Reservation: ${reservationData.fullName}`,
            `Product: ${product?.name || productId} | Mode: ${reservationData.storeMode}`
        );

        // Trigger email notification (fire and forget)
        (async () => {
            try {
                await emailUtils.notifyReservation(email, reservationData, product);
            } catch (err) {
                console.error("❌ [EMAIL_ERROR] Failed to send reservation email:", err.message);
            }
        })();

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: {
                id: result.insertId,
                fullName: fullName || 'Anonymous',
                email,
                phone: phone || 'N/A',
                productId,
                size: size || 'M',
                color: color || 'Default',
                quantity: quantity || 1
            }
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
    try {
        const { status, productId, startDate, endDate } = req.query;
        let query = `
            SELECT 
                r.*, 
                p.name as productName, 
                p.image_urls as productImageUrls,
                u.name as userName,
                u.email as userEmail
            FROM reservations r 
            LEFT JOIN products p ON r.product_id = p.id 
            LEFT JOIN users u ON r.user_id = u.id
        `;
        
        const whereClauses = [];
        const params = [];

        if (status && status !== 'all') {
            whereClauses.push('r.status = ?');
            params.push(status);
        }
        if (productId && productId !== 'all') {
            whereClauses.push('r.product_id = ?');
            params.push(productId);
        }
        if (startDate) {
            whereClauses.push('r.created_at >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('r.created_at <= ?');
            params.push(`${endDate} 23:59:59`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY r.created_at DESC`;

        const [rows] = await pool.query(query, params);
        
        // Transform into structured JSON as requested
        const structuredReservations = rows.map(r => ({
            id: r.id,
            user: {
                name: r.full_name || r.userName || "Guest",
                email: r.email || r.userEmail || "N/A",
                phone: r.phone || "N/A"
            },
            product: {
                name: r.productName || `Product #${r.product_id}`,
                image_urls: typeof r.productImageUrls === 'string' ? JSON.parse(r.productImageUrls) : (r.productImageUrls || [])
            },
            quantity: r.quantity,
            size: r.size,
            color: r.color,
            store_mode: r.store_mode,
            status: r.status,
            created_at: r.created_at,
            updated_at: r.updated_at
        }));

        res.json({ success: true, reservations: structuredReservations });
    } catch (error) {
        console.error('❌ RESERVATION_FETCH_ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reservations', error: error.message });
    }
};

const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        // Enforce valid status ENUM values
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation status' });
        }

        const [result] = await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: `Reservation marked as ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

const deleteReservation = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        res.json({ success: true, message: 'Reservation deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete reservation', error: error.message });
    }
};

module.exports = {
    createReservation,
    getReservations,
    updateReservationStatus,
    deleteReservation
};
