const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.use(checkoutLimiter);

router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
