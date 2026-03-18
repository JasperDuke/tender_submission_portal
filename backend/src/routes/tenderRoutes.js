const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const {
  getTenders,
  getTenderById,
  createTender,
  updateTender,
  deleteTender,
} = require('../controllers/tenderController');

// All tender routes require auth
router.use(protect);

// GET    /api/tenders           – all roles (vendor sees only active)
router.get('/', getTenders);

// GET    /api/tenders/:id       – all roles
router.get('/:id', getTenderById);

// POST   /api/tenders           – company users & admins only (supports PDF attachments)
router.post('/', requireRole('companyUser', 'admin'), upload.array('attachments', 10), createTender);

// PUT    /api/tenders/:id       – company users & admins (creator check in controller)
router.put('/:id', requireRole('companyUser', 'admin'), upload.array('attachments', 10), updateTender);

// DELETE /api/tenders/:id       – company users & admins (creator check in controller)
router.delete('/:id', requireRole('companyUser', 'admin'), deleteTender);

module.exports = router;
