const express = require('express');
const priceCategoryController = require('../controllers/price-category.controller');

const router = express.Router();

router.get('/', priceCategoryController.getPriceCategories);
router.get('/active', priceCategoryController.getActivePriceCategories);
router.get('/:id', priceCategoryController.getPriceCategory);

module.exports = router;
