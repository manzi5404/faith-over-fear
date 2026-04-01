const pool = require('../db/connection');

async function createOrder(orderData) {
    const {
        user_id, product_id, drop_id, product_name, size, color,
        quantity, total_price, payment_method, customer_name,
        customer_email, customer_phone
    } = orderData;

    const [result] = await pool.query(
        `INSERT INTO orders (user_id, product_id, drop_id, product_name, size, color, quantity, total_price, status, payment_method, customer_name, customer_email, customer_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
            user_id || null,
            product_id,
            drop_id || null,
            product_name || null,
            size || null,
            color || null,
            quantity || 1,
            total_price,
            payment_method || 'reservation',
            customer_name || null,
            customer_email || null,
            customer_phone || null
        ]
    );
    return result.insertId;
}

async function getOrderById(id) {
    const [rows] = await pool.query(
        `SELECT o.*, p.name as product_name_from_products, p.image_urls as product_image_urls
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.id = ?`,
        [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    if (!row.product_name && row.product_name_from_products) {
        row.product_name = row.product_name_from_products;
    }
    return row;
}

async function getOrdersByUser(userId) {
    const [rows] = await pool.query(
        `SELECT o.*, p.name as product_name_from_products, p.image_urls as product_image_urls
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC`,
        [userId]
    );
    return rows.map(row => {
        if (!row.product_name && row.product_name_from_products) {
            row.product_name = row.product_name_from_products;
        }
        return row;
    });
}

async function getAllOrders() {
    const [rows] = await pool.query(
        `SELECT o.*, 
                p.name as product_name_from_products, 
                p.image_urls as product_image_urls,
                u.name as user_display_name,
                u.email as user_display_email
         FROM orders o
         LEFT JOIN products p ON o.product_id = p.id
         LEFT JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC`
    );
    return rows.map(row => {
        if (!row.product_name && row.product_name_from_products) {
            row.product_name = row.product_name_from_products;
        }
        return row;
    });
}

async function updateOrderStatus(orderId, newStatus) {
    const [result] = await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [newStatus, orderId]
    );
    return result.affectedRows > 0;
}

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUser,
    getAllOrders,
    updateOrderStatus
};
