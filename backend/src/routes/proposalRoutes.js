const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const {
  submitProposal,
  getMyProposals,
  getProposalsByTender,
  getProposalById,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
} = require('../controllers/proposalController');

router.use(protect);

// GET    /api/proposals/my               – vendor: my proposals
router.get('/my', requireRole('vendor'), getMyProposals);

// GET    /api/proposals/tender/:tenderId – company/admin: proposals per tender
router.get('/tender/:tenderId', requireRole('companyUser', 'admin'), getProposalsByTender);

// GET    /api/proposals/:id              – authenticated (controller enforces ownership for vendors)
router.get('/:id', getProposalById);

// POST   /api/proposals                  – vendor: submit new proposal (PDF)
router.post('/', requireRole('vendor'), upload.single('proposalFile'), submitProposal);

// PUT    /api/proposals/:id              – vendor: replace PDF
router.put('/:id', requireRole('vendor'), upload.single('proposalFile'), updateProposal);

// DELETE /api/proposals/:id              – vendor: delete own proposal
router.delete('/:id', requireRole('vendor'), deleteProposal);

// PATCH  /api/proposals/:id/status       – companyUser/admin: update status, remarks, score
router.patch('/:id/status', requireRole('companyUser', 'admin'), updateProposalStatus);

module.exports = router;
