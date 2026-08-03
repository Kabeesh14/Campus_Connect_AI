const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public Auth Routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Auth Routes
router.get('/me', verifyToken, getMe);
router.get('/profile', verifyToken, getMe);

module.exports = router;
