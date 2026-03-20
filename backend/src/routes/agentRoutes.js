const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  whoAmI,
  getMyTenders,
  getMyTenderById,
  getVendorsByTenderId,
  updateVendorStatus,
} = require('../controllers/agentController');

router.use(protect);
router.use(requireRole('companyUser', 'admin'));

router.post('/whoami', whoAmI);
router.post('/tenders', getMyTenders);
router.post('/tender', getMyTenderById);
router.post('/vendors', getVendorsByTenderId);
router.post('/vendor/status', updateVendorStatus);

module.exports = router;
