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
        const query = `
            SELECT 
                r.*, 
                p.name as productName, 
                p.image_urls as productImageUrls,
                u.name as userName,
                u.email as userEmail
            FROM reservations r 
            LEFT JOIN products p ON r.product_id = p.id 
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `;

        const [rows] = await pool.query(query);
        
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
        const validStatuses = ['pending', 'confirmed', 'fulfilled', 'cancelled'];
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
