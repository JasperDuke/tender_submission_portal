const Tender = require('../models/Tender');
const Proposal = require('../models/Proposal');
const { triggerAgentOnTenderCreate } = require('../services/agentTriggerWebhook');

/**
 * GET /api/tenders
 * Query: status, search, category, page, limit
 * All authenticated users can list tenders.
 * Vendors only see active tenders.
 * Includes proposalStats: { appliedCount, acceptedCount } for each tender.
 * For company/admin, also includes rejectedCount. Vendors never see rejectedCount.
 */
const getTenders = async (req, res, next) => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Vendors can only view active tenders
    if (req.user.role === 'vendor') {
      filter.status = 'active';
    } else if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const total = await Tender.countDocuments(filter);
    const tenders = await Tender.find(filter)
      .populate('createdBy', 'email profile.companyName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Aggregate proposal stats per tender
    const tenderIds = tenders.map((t) => t._id);
    const stats = await Proposal.aggregate([
      { $match: { tenderId: { $in: tenderIds } } },
      {
        $group: {
          _id: '$tenderId',
          appliedCount: { $sum: 1 },
          acceptedCount: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);
    const statsMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));

    const tendersWithStats = tenders.map((t) => {
      const s = statsMap[t._id.toString()] || { appliedCount: 0, acceptedCount: 0, rejectedCount: 0 };
      const proposalStats = {
        appliedCount: s.appliedCount,
        acceptedCount: s.acceptedCount,
      };
      if (req.user.role !== 'vendor') {
        proposalStats.rejectedCount = s.rejectedCount;
      }
      return { ...t, proposalStats };
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      tenders: tendersWithStats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tenders/:id
 * Includes proposalStats: { appliedCount, acceptedCount }.
 * For company/admin, also rejectedCount.
 * For vendors who applied, includes myProposal: { status, remarks, score }.
 */
const getTenderById = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id).populate('createdBy', 'email profile.companyName').lean();
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    // Vendors cannot view inactive tenders
    if (req.user.role === 'vendor' && tender.status !== 'active') {
      return res.status(403).json({ success: false, message: 'This tender is not currently active' });
    }

    const tenderId = tender._id;
    const [stats] = await Proposal.aggregate([
      { $match: { tenderId } },
      {
        $group: {
          _id: null,
          appliedCount: { $sum: 1 },
          acceptedCount: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
          rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);
    const proposalStats = stats
      ? {
          appliedCount: stats.appliedCount,
          acceptedCount: stats.acceptedCount,
          ...(req.user.role !== 'vendor' && { rejectedCount: stats.rejectedCount }),
        }
      : { appliedCount: 0, acceptedCount: 0, ...(req.user.role !== 'vendor' && { rejectedCount: 0 }) };

    let myProposal = null;
    if (req.user.role === 'vendor') {
      const mine = await Proposal.findOne({ tenderId, vendorId: req.user._id })
        .select('status remarks score filePath originalFileName')
        .lean();
      if (mine) myProposal = {
        status: mine.status,
        remarks: mine.remarks,
        score: mine.score,
        filePath: mine.filePath,
        originalFileName: mine.originalFileName,
      };
    }

    res.status(200).json({
      success: true,
      tender: { ...tender, proposalStats, ...(myProposal && { myProposal }) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tenders
 * Role: companyUser
 * Body: multipart form with title, description, requirements, deadline, category, and optional attachments (PDFs)
 */
const createTender = async (req, res, next) => {
  try {
    const { title, description, requirements, deadline, category } = req.body;
    const attachmentPaths = (req.files || []).map((f) => f.path);

    const tender = await Tender.create({
      title,
      description,
      requirements,
      deadline: deadline ? new Date(deadline) : undefined,
      category,
      attachments: attachmentPaths,
      createdBy: req.user._id,
    });

    triggerAgentOnTenderCreate({ tender }).catch((err) => {
      console.error('[webhook] Tender create trigger failed (tender still saved):', err.message);
    });

    res.status(201).json({ success: true, tender });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/tenders/:id
 * Role: companyUser (must be creator or admin)
 * Body: multipart form. New attachment files are appended to existing attachments.
 */
const updateTender = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    // Only the creator or an admin can update
    if (req.user.role !== 'admin' && tender.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to update this tender' });
    }

    const { title, description, requirements, deadline, status, category } = req.body;
    const allowedFields = ['title', 'description', 'requirements', 'deadline', 'status', 'category'];
    if (title !== undefined) tender.title = title;
    if (description !== undefined) tender.description = description;
    if (requirements !== undefined) tender.requirements = requirements;
    if (deadline !== undefined) tender.deadline = deadline;
    if (status !== undefined) tender.status = status;
    if (category !== undefined) tender.category = category;

    const newAttachmentPaths = (req.files || []).map((f) => f.path);
    if (newAttachmentPaths.length > 0) {
      tender.attachments = [...(tender.attachments || []), ...newAttachmentPaths];
    }

    const updated = await tender.save();
    res.status(200).json({ success: true, tender: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tenders/:id
 * Role: companyUser (creator only) or admin
 */
const deleteTender = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });

    if (req.user.role !== 'admin' && tender.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this tender' });
    }

    await tender.deleteOne();
    res.status(200).json({ success: true, message: 'Tender deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTenders, getTenderById, createTender, updateTender, deleteTender };
