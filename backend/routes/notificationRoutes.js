const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, clearNotification } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/read', markAsRead);
router.delete('/:id', clearNotification);

module.exports = router;
