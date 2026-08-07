const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const priceCategoryController = require('../controllers/price-category.controller');

const router = express.Router();

router.post('/', requireAuth, requireAdmin, priceCategoryController.createPriceCategory);
router.put('/:id', requireAuth, requireAdmin, priceCategoryController.updatePriceCategory);
router.delete('/:id', requireAuth, requireAdmin, priceCategoryController.deletePriceCategory);

module.exports = router;
