const express = require('express');
const router = express.Router();
const { getLatestAnnouncement, updateAnnouncement } = require('../controllers/announcementController');

router.get('/', getLatestAnnouncement);
router.put('/', updateAnnouncement);

module.exports = router;
