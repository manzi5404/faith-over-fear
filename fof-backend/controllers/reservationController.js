const reservationModel = require('../models/reservation');
const notification = require('../models/notification');
const emailUtils = require('../utils/email');
const productService = require('../models/product');
const qualityPriceService = require('../models/productQualityPrice');

function resolveImageUrls(rawImageUrls) {
    const urls = [];
    if (typeof rawImageUrls === 'string' && rawImageUrls.trim() !== '') {
        try {
            const parsed = JSON.parse(rawImageUrls);
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                return parsed;
            }
        } catch (err) {
            urls.push(rawImageUrls);
        }
    } else if (Array.isArray(rawImageUrls)) {
        return rawImageUrls;
    } else if (rawImageUrls) {
        urls.push(rawImageUrls);
    }
    return urls;
}

function normalizeReservationRow(r) {
    const imageUrls = resolveImageUrls(r.productImageUrls);
    const customerName = (r.full_name && r.full_name.trim()) || (r.userName && r.userName.trim()) ||
        (r.email ? r.email.split('@')[0] : 'Guest');

    return {
        id: r.id,
        user: {
            name: customerName,
            email: r.email || r.userEmail || "N/A",
            phone: r.phone || "N/A"
        },
        product: {
            name: r.productName || `Product #${r.product_id}`,
            image_urls: imageUrls,
            image_url: imageUrls[0] || null
        },
        quantity: r.quantity,
        size: r.size,
        color: r.color,
        quality: r.quality_level_id ? {
            id: r.quality_level_id,
            name: r.qualityName || `Quality #${r.quality_level_id}`
        } : null,
        quality_level_id: r.quality_level_id || null,
        quality_name: r.qualityName || null,
        price_at_purchase: r.price_at_purchase || Number(r.productBasePrice) || null,
        store_mode: r.store_mode,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at
    };
}

const createReservation = async (req, res) => {
    const { fullName, email: bodyEmail, phone, productId, size, color, quantity, storeMode, quality_level_id } = req.body;
    const userId = req.user ? req.user.id : null;
    const email = req.user ? req.user.email : bodyEmail;

    if (!email || !productId) {
        return res.status(400).json({ success: false, message: 'Missing email or productId' });
    }

    try {
        const resolvedFullName = fullName && fullName.trim() !== '' ? fullName :
            (bodyEmail ? bodyEmail.split('@')[0] : 'Guest');

        const product = await productService.getProductById(productId);
        if (!product) {
            return res.status(400).json({ success: false, message: 'Product not found' });
        }

        let priceAtPurchase = Number(product.price);
        if (quality_level_id) {
            const qualityPrice = await qualityPriceService.getActiveQualityPrice(productId, quality_level_id);
            if (!qualityPrice) {
                return res.status(400).json({ success: false, message: 'Invalid quality_level_id for selected product' });
            }
            priceAtPurchase = Number(qualityPrice.price);
        }

        const reservationData = {
            userId,
            fullName: resolvedFullName,
            email,
            phone: phone || 'N/A',
            productId,
            productName: product.name,
            size: size || 'M',
            color: color || 'Default',
            quantity: quantity || 1,
            qualityLevelId: quality_level_id || null,
            priceAtPurchase,
            storeMode: storeMode || 'live'
        };

        const insertedId = await reservationModel.createReservation({
            user_id: userId,
            full_name: resolvedFullName,
            email,
            phone: phone || 'N/A',
            product_id: productId,
            product_name: product.name,
            size: size || 'M',
            color: color || 'Default',
            quantity: quantity || 1,
            quality_level_id: quality_level_id || null,
            price_at_purchase: priceAtPurchase,
            store_mode: storeMode || 'live'
        });

        await notification.createNotification(
            'reservation',
            insertedId,
            `Reservation: ${reservationData.fullName}`,
            `Product: ${reservationData.productName} | Mode: ${reservationData.storeMode}`
        );

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
                id: insertedId,
                fullName: reservationData.fullName,
                email: reservationData.email,
                phone: reservationData.phone,
                productId: reservationData.productId,
                size: reservationData.size,
                color: reservationData.color,
                quantity: reservationData.quantity,
                quality_level_id: reservationData.qualityLevelId,
                price_at_purchase: reservationData.priceAtPurchase
            }
        });
    } catch (error) {
        console.error("❌ DB Reservation Error:", error);
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
        const rawRows = await reservationModel.getReservations({ status, productId, startDate, endDate });

        const structuredReservations = rawRows.map(normalizeReservationRow);

        console.log('📦 RESERVATIONS_FETCH_RESULT:', structuredReservations);
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
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation status' });
        }

        const updated = await reservationModel.updateReservationStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: `Reservation marked as ${status}` });
    } catch (error) {
        console.error('❌ UPDATE_STATUS_ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

const deleteReservation = async (req, res) => {
    const { id } = req.params;

    try {
        const removed = await reservationModel.deleteReservation(id);

        if (!removed) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        res.json({ success: true, message: 'Reservation deleted' });
    } catch (error) {
        console.error('❌ DELETE_RESERVATION_ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to delete reservation', error: error.message });
    }
};

module.exports = {
    createReservation,
    getReservations,
    updateReservationStatus,
    deleteReservation
};
