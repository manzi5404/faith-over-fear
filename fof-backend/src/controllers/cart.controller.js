const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const cartService = require('../services/cart.service');

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

async function getCart(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || null;
    const cart = await cartService.getCart(req.user.id, sessionId);
    return res.status(200).json({ success: true, ...cart });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function addItem(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || null;
    const { variantId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user.id, sessionId, variantId, quantity);
    return res.status(200).json({ success: true, ...cart });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function updateItem(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || null;
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user.id, sessionId, req.params.variantId, quantity);
    return res.status(200).json({ success: true, ...cart });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function removeItem(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || null;
    const cart = await cartService.removeCartItem(req.user.id, sessionId, req.params.variantId);
    return res.status(200).json({ success: true, ...cart });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function clearCartItems(req, res) {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || null;
    const result = await cartService.clearCart(req.user.id, sessionId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCartItems,
};
