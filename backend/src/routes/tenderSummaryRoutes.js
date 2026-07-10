const express = require('express');
const router = express.Router();
const {
  upsertTenderSummary,
  getTenderSummaryByTenderId,
} = require('../controllers/tenderSummaryController');

// POST   /api/tender-summaries
router.post('/', upsertTenderSummary);

// GET    /api/tender-summaries/tender/:tenderId
router.get('/tender/:tenderId', getTenderSummaryByTenderId);

module.exports = router;
