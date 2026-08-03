const { query } = require('../config/db');

/**
 * Get User Notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await query(
      'SELECT id, type, title, body, time, read_status as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );

    const unreadRows = await query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND read_status = 0',
      [userId]
    );

    const unreadCount = (unreadRows && unreadRows[0] && unreadRows[0].unreadCount) ? Number(unreadRows[0].unreadCount) : 0;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications: (notifications || []).map((n) => ({
        ...n,
        isRead: Boolean(n.isRead),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Notification(s) as Read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;

    if (id === 'all' || !id) {
      await query('UPDATE notifications SET read_status = 1 WHERE user_id = ?', [userId]);
    } else {
      await query('UPDATE notifications SET read_status = 1 WHERE user_id = ? AND id = ?', [userId, id]);
    }

    return res.status(200).json({ success: true, message: 'Notification(s) marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear/Delete Notification
 */
const clearNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (id === 'all') {
      await query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    } else {
      await query('DELETE FROM notifications WHERE user_id = ? AND id = ?', [userId, id]);
    }

    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  clearNotification,
};
