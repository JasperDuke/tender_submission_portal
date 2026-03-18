const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getAll, getMine, create, remove } = require('../controllers/integrationController');

router.get('/me', protect, getMine);
router.get('/', protect, requireRole('admin'), getAll);
router.post('/', protect, requireRole('admin'), create);
router.delete('/:type', protect, requireRole('admin'), remove);

module.exports = router;
