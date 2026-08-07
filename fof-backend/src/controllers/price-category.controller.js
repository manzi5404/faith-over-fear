const priceCategoryService = require('../services/price-category.service');
const { handleServiceError } = require('../utils/responseHandler');

async function getPriceCategories(req, res) {
  try {
    const categories = await priceCategoryService.getAllPriceCategories();
    return res.status(200).json({ success: true, priceCategories: categories });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function getActivePriceCategories(req, res) {
  try {
    const categories = await priceCategoryService.getActivePriceCategories();
    return res.status(200).json({ success: true, priceCategories: categories });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function getPriceCategory(req, res) {
  try {
    const category = await priceCategoryService.getPriceCategoryById(req.params.id);
    return res.status(200).json({ success: true, priceCategory: category });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function createPriceCategory(req, res) {
  try {
    const category = await priceCategoryService.createPriceCategory(req.body);
    return res.status(201).json({ success: true, priceCategory: category });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function updatePriceCategory(req, res) {
  try {
    const category = await priceCategoryService.updatePriceCategory(req.params.id, req.body);
    return res.status(200).json({ success: true, priceCategory: category });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function deletePriceCategory(req, res) {
  try {
    await priceCategoryService.deletePriceCategory(req.params.id);
    return res.status(200).json({ success: true, message: 'Price category deleted' });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

module.exports = {
  getPriceCategories,
  getActivePriceCategories,
  getPriceCategory,
  createPriceCategory,
  updatePriceCategory,
  deletePriceCategory,
};
