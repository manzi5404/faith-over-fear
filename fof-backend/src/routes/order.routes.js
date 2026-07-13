const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.use(checkoutLimiter);

router.post('/', optionalAuth, orderController.createOrder);
router.get('/my', requireAuth, orderController.getMyOrders);
router.get('/:id', optionalAuth, orderController.getOrderById);

module.exports = router;
