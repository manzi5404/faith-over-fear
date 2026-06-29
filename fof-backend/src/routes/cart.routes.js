const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

router.use(apiLimiter);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:variantId', cartController.updateItem);
router.delete('/items/:variantId', cartController.removeItem);
router.delete('/', cartController.clearCartItems);

module.exports = router;
