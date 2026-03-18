const express = require('express');
const router = express.Router();
const { login, register, getMe, updateProfile, changePassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register (vendor self-registration)
router.post('/register', register);

// GET  /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/logout (notifies post-login service for company user)
router.post('/logout', protect, logout);

// PATCH /api/auth/profile
router.patch('/profile', protect, updateProfile);

// PATCH /api/auth/change-password
router.patch('/change-password', protect, changePassword);

module.exports = router;
