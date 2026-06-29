const waitlistService = require('../services/waitlist.service');

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

async function addToWaitlist(req, res) {
  try {
    const entry = await waitlistService.addToWaitlist(req.body);
    return res.status(201).json({
      success: true,
      message: 'Added to waitlist successfully',
      entry,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getAllForAdmin(req, res) {
  try {
    const entries = await waitlistService.getAllForAdmin();
    return res.status(200).json({ success: true, entries });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  addToWaitlist,
  getAllForAdmin,
};
