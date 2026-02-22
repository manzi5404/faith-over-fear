const { addDrop, getDrops, editDrop, deleteDrop } = require('../models/drop');
const userModel = require('../models/user');
const emailUtils = require('../utils/email');

async function createDrop(req, res) {
  try {
    const dropId = await addDrop(req.body);

    // Trigger notifications asynchronously
    userModel.getAllUserEmails().then(emails => {
      if (emails.length > 0) {
        emailUtils.notifyNewDrop(emails, req.body);
      }
    }).catch(err => console.error('Failed to fetch user emails for notification:', err));

    res.json({ success: true, dropId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function listDrops(req, res) {
  try {
    const drops = await getDrops(req.query.active === 'true');

    // ✅ Force images array for frontend compatibility
    drops.forEach(drop => {
      if (!drop.images || drop.images.length === 0) {
        drop.images = drop.image_url ? [drop.image_url] : [];
      }
    });

    res.json({ success: true, drops });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateDrop(req, res) {
  try {
    const updated = await editDrop(req.params.id, req.body);
    res.json({ success: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function removeDrop(req, res) {
  try {
    const removed = await deleteDrop(req.params.id);
    res.json({ success: removed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { createDrop, listDrops, updateDrop, removeDrop };