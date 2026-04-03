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

        // Validation for the actual payload required for the announcement
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'A valid title is required for the announcement' });
        }
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'A valid message content is required' });
        }

        const announcement = await announcementModel.updateAnnouncement({ title, message });

        if (announcement) {
            res.json({ success: true, message: 'Announcement updated successfully', announcement });
        } else {
            // Not found? Let's check why
            res.status(404).json({ success: false, message: 'Announcement record with ID: 1 not found for update' });
        }
    } catch (err) {
        console.error('❌ ANNOUNCEMENT_UPDATE_ERROR:', err);
        // Senior Refinement: return the actual SQL error message for easier Railway debugging
        res.status(500).json({ 
            success: false, 
            message: 'Database update failed',
            error: err.message,
            sqlState: err.sqlState
        });
    }
}

module.exports = { getLatestAnnouncement, updateAnnouncement };
