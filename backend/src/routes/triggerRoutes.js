const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { getTriggerConfig, upsertTriggerConfig, removeTriggerConfig } = require('../controllers/triggerController');

router.get('/', protect, requireRole('admin'), getTriggerConfig);
router.post('/', protect, requireRole('admin'), upsertTriggerConfig);
router.delete('/', protect, requireRole('admin'), removeTriggerConfig);

module.exports = router;
