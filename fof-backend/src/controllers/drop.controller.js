const dropService = require('../services/drop.service');

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400 || statusCode === 409) {
    return res.status(statusCode).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

async function getActiveDrop(req, res) {
  try {
    const drop = await dropService.getActiveDrop();
    return res.status(200).json({ success: true, drop: drop || null });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getAllDrops(req, res) {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const drops = await dropService.getAllDrops(isAdmin);
    return res.status(200).json({ success: true, drops });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getDropBySlug(req, res) {
  try {
    const drop = await dropService.getDropBySlug(req.params.slug);
    return res.status(200).json({ success: true, drop });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function createDrop(req, res) {
  try {
    const drop = await dropService.createDrop(req.body);
    return res.status(201).json({ success: true, drop });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function updateDrop(req, res) {
  try {
    const drop = await dropService.updateDrop(req.params.id, req.body);
    return res.status(200).json({ success: true, drop });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function activateDrop(req, res) {
  try {
    const drop = await dropService.activateDrop(req.params.id);
    return res.status(200).json({ success: true, drop });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  getActiveDrop,
  getAllDrops,
  getDropBySlug,
  createDrop,
  updateDrop,
  activateDrop,
};
