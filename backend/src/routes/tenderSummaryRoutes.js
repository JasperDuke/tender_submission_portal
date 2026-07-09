const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  upsertTenderSummary,
  getTenderSummaryByTenderId,
} = require('../controllers/tenderSummaryController');

router.use(protect);
router.use(requireRole('companyUser', 'admin'));

// POST   /api/tender-summaries
router.post('/', upsertTenderSummary);

// GET    /api/tender-summaries/tender/:tenderId
router.get('/tender/:tenderId', getTenderSummaryByTenderId);

module.exports = router;
