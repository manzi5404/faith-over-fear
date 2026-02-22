const announcementModel = require('../models/announcement');

async function getAnnouncements(req, res) {
    try {
        const announcements = await announcementModel.getActiveAnnouncements();
        res.json({ success: true, announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function createAnnouncement(req, res) {
    try {
        const { message, expiresAt } = req.body;
        const id = await announcementModel.addAnnouncement(message, expiresAt);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function removeAnnouncement(req, res) {
    try {
        const success = await announcementModel.deleteAnnouncement(req.params.id);
        res.json({ success });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getAnnouncements, createAnnouncement, removeAnnouncement };
