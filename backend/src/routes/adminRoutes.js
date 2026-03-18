const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

// GET    /api/admin/users           – list all users (filterable)
router.get('/users', getUsers);

// POST   /api/admin/users           – create new user
router.post('/users', createUser);

// GET    /api/admin/users/:id       – get user by ID
router.get('/users/:id', getUserById);

// PUT    /api/admin/users/:id       – update user
router.put('/users/:id', updateUser);

// PATCH  /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', deactivateUser);

// PATCH  /api/admin/users/:id/activate
router.patch('/users/:id/activate', activateUser);

module.exports = router;
