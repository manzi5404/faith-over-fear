const announcementModel = require('../models/announcement');

async function getLatestAnnouncement(req, res) {
    try {
        const announcement = await announcementModel.getLatestAnnouncement();

        if (!announcement || !announcement.is_enabled) {
            // Handle empty state: return No Content (204) or is_enabled: false
            return res.status(200).json({ success: true, announcement: { is_enabled: false } });
        }

        // Fix: Use "announcement" variable which is defined on line 5
        // Explicitly ensure title and message are included for frontend
        return res.json({
            success: true,
            announcement: {
                id: announcement.id,
                title: announcement.title,
                message: announcement.message,
                button_text: announcement.button_text,
                button_link: announcement.button_link,
                is_enabled: announcement.is_enabled,
                version: announcement.version
            }
        });
    } catch (err) {
        console.error('Error fetching announcement:', err);
        res.status(500).json({ success: false, message: 'Error fetching announcement' });
    }
}

async function updateAnnouncement(req, res) {
    try {
        const { title, message, is_enabled } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const success = await announcementModel.updateAnnouncement({ title, message, is_enabled });

        if (success) {
            res.json({ success: true, message: 'Announcement updated and version incremented' });
        } else {
            res.status(404).json({ success: false, message: 'Announcement not found' });
        }
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getLatestAnnouncement, updateAnnouncement };
