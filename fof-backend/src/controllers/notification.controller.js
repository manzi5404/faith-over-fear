const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const notificationService = require('../services/notification.service');

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400 || statusCode === 403) {
    return res.status(statusCode).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

async function getNotifications(req, res) {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const notifications = await notificationService.getUserNotifications(req.user.id, limit, offset);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return res.status(200).json({ success: true, count });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function markAllRead(req, res) {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function markRead(req, res) {
  try {
    const success = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    return res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
};
