const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, removeAnnouncement } = require('../controllers/announcementController');

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', removeAnnouncement);

module.exports = router;
