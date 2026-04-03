const announcementModel = require('../models/announcement');

async function getLatestAnnouncement(req, res) {
    try {
        const announcement = await announcementModel.getLatestAnnouncement();

        if (!announcement) {
            return res.json({ success: true, announcement: { title: "", message: "" } });
        }

        return res.json({
            success: true,
            announcement: {
                id: announcement.id,
                title: announcement.title,
                message: announcement.message
            }
        });
    } catch (err) {
        console.error('Error fetching announcement:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function updateAnnouncement(req, res) {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Missing title or message' });
        }

        const success = await announcementModel.updateAnnouncement({ title, message });

        if (success) {
            res.json({ success: true, message: 'Announcement updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Failed to update announcement' });
        }
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = { getLatestAnnouncement, updateAnnouncement };
