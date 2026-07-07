const Tender = require("../models/Tender");
const Proposal = require("../models/Proposal");
const { triggerAgentOnProposalAwarded } = require("../services/agentTriggerWebhook");
const { awardedCountAggregation, isAwardedStatus } = require("../utils/proposalStatus");

/**
 * POST /api/agent/whoami
 * Role: companyUser, admin
 * Body: {} (optional)
 * Returns the authenticated company user's profile. For OpenAPI/agent use.
 */
const whoAmI = async (req, res) => {
  console.log("[agent] whoami called", {
    payload: req.body || {},
    userId: req.user._id?.toString(),
  });
  const user = req.user.toObject();
  delete user.passwordHash;
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
    },
  });
  console.log("[agent] whoami success");
};

/**
 * POST /api/agent/tenders
 * Role: companyUser, admin
 * Body: {} (optional)
 * Returns tenders created by the authenticated user (createdBy = userId).
 */
const getMyTenders = async (req, res, next) => {
  console.log("[agent] tenders called", {
    payload: req.body || {},
    userId: req.user._id?.toString(),
  });
  try {
    const tenders = await Tender.find({ createdBy: req.user._id })
      .populate("createdBy", "email profile.companyName")
      .sort({ createdAt: -1 })
      .lean();

    const tenderIds = tenders.map((t) => t._id);
    const stats = await Proposal.aggregate([
      { $match: { tenderId: { $in: tenderIds } } },
      {
        $group: {
          _id: "$tenderId",
          appliedCount: { $sum: 1 },
          acceptedCount: awardedCountAggregation,
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
        },
      },
    ]);
    const statsMap = Object.fromEntries(
      stats.map((s) => [s._id.toString(), s]),
    );

    const tendersWithStats = tenders.map((t) => {
      const s = statsMap[t._id.toString()] || {
        appliedCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
      };
      return {
        ...t,
        proposalStats: {
          appliedCount: s.appliedCount,
          acceptedCount: s.acceptedCount,
          rejectedCount: s.rejectedCount,
        },
      };
    });

    res.status(200).json({
      success: true,
      tenders: tendersWithStats,
      count: tendersWithStats.length,
    });
    console.log("[agent] tenders success", { count: tendersWithStats.length });
  } catch (err) {
    console.error("[agent] tenders error:", err.message);
    next(err);
  }
};

/**
 * POST /api/agent/tender
 * Role: companyUser, admin
 * Body: { tenderId }
 * Returns tender detail. Only if the user created it (or is admin).
 */
const getMyTenderById = async (req, res, next) => {
  console.log("[agent] tender called", {
    payload: req.body || {},
    userId: req.user._id?.toString(),
  });
  try {
    const { tenderId } = req.body;
    if (!tenderId) {
      console.log("[agent] tender 400 – tenderId required");
      return res
        .status(400)
        .json({ success: false, message: "tenderId is required in body" });
    }
    const tender = await Tender.findById(tenderId)
      .populate(
        "createdBy",
        "email profile.companyName profile.contactPerson profile.phone",
      )
      .lean();

    if (!tender) {
      console.log("[agent] tender 404 – not found", { tenderId });
      return res
        .status(404)
        .json({ success: false, message: "Tender not found" });
    }

    const creatorId =
      tender.createdBy?._id?.toString?.() || tender.createdBy?.toString?.();
    if (
      req.user.role === "companyUser" &&
      creatorId !== req.user._id.toString()
    ) {
      console.log("[agent] tender 403 – not authorised", { tenderId });
      return res.status(403).json({
        success: false,
        message: "Not authorised to view this tender",
      });
    }

    const [stats] = await Proposal.aggregate([
      { $match: { tenderId: tender._id } },
      {
        $group: {
          _id: null,
          appliedCount: { $sum: 1 },
          acceptedCount: awardedCountAggregation,
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    const proposalStats = stats
      ? {
          appliedCount: stats.appliedCount,
          acceptedCount: stats.acceptedCount,
          rejectedCount: stats.rejectedCount,
        }
      : { appliedCount: 0, acceptedCount: 0, rejectedCount: 0 };

    res.status(200).json({
      success: true,
      tender: { ...tender, proposalStats },
    });
    console.log("[agent] tender success", { tenderId });
  } catch (err) {
    console.error("[agent] tender error:", err.message);
    next(err);
  }
};

/**
 * POST /api/agent/vendors
 * Role: companyUser, admin
 * Body: { tenderId }
 * Returns vendors who applied to this tender. Excludes attachment/filePath.
 * Only if the user created the tender (or is admin).
 */
const getVendorsByTenderId = async (req, res, next) => {
  console.log("[agent] vendors called", {
    payload: req.body || {},
    userId: req.user._id?.toString(),
  });
  try {
    const { tenderId } = req.body;
    if (!tenderId) {
      console.log("[agent] vendors 400 – tenderId required");
      return res
        .status(400)
        .json({ success: false, message: "tenderId is required in body" });
    }
    const tender = await Tender.findById(tenderId).lean();
    if (!tender) {
      return res
        .status(404)
        .json({ success: false, message: "Tender not found" });
    }

    if (
      req.user.role === "companyUser" &&
      tender.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to view vendors for this tender",
      });
    }

    const proposals = await Proposal.find({ tenderId })
      .select("-filePath -originalFileName")
      .populate(
        "vendorId",
        "email profile.companyName profile.contactPerson profile.phone profile.address profile.companyDescription",
      )
      .sort({ submittedAt: -1 })
      .lean();

    const vendors = proposals.map((p) => ({
      proposalId: p._id,
      status: p.status,
      remarks: p.remarks,
      score: p.score,
      submittedAt: p.submittedAt,
      vendor: p.vendorId,
    }));

    res.status(200).json({
      success: true,
      tenderId,
      count: vendors.length,
      vendors,
    });
    console.log("[agent] vendors success", { tenderId, count: vendors.length });
  } catch (err) {
    console.error("[agent] vendors error:", err.message);
    next(err);
  }
};

/**
 * POST /api/agent/vendor/status
 * Role: companyUser, admin
 * Body: { tenderId, vendorId, status }
 * Updates the proposal status for a vendor on a specific tender.
 * Only if the user created the tender (or is admin).
 */
const updateVendorStatus = async (req, res, next) => {
  console.log("[agent] updateVendorStatus called", {
    payload: req.body || {},
    userId: req.user._id?.toString(),
  });
  try {
    const { tenderId, vendorId, status: updateStatus } = req.body;
    if (!tenderId || !vendorId || !updateStatus) {
      console.log("[agent] updateVendorStatus 400 – missing params");
      return res.status(400).json({
        success: false,
        message: "tenderId, vendorId, and status are required in body",
      });
    }

    const validStatuses = [
      "Pending",
      "Reviewed",
      "Awarded",
      "Accepted", // legacy – treated as Awarded
      "Rejected",
      "Shortlisted",
    ];
    if (!validStatuses.includes(updateStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status provided" });
    }

    const tender = await Tender.findById(tenderId).lean();
    if (!tender) {
      return res
        .status(404)
        .json({ success: false, message: "Tender not found" });
    }

    if (
      req.user.role === "companyUser" &&
      tender.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to update vendors for this tender",
      });
    }

    const proposal = await Proposal.findOne({ tenderId, vendorId });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found for this vendor and tender",
      });
    }

    const previousStatus = proposal.status;
    proposal.status = updateStatus === 'Accepted' ? 'Awarded' : updateStatus;
    await proposal.save();

    const newStatus = proposal.status;
    if (isAwardedStatus(newStatus) && !isAwardedStatus(previousStatus)) {
      triggerAgentOnProposalAwarded({ tenderId, vendorId }).catch((err) => {
        console.error("[webhook] Proposal awarded trigger failed:", err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor status updated successfully",
      status: proposal.status,
    });
    console.log("[agent] updateVendorStatus success", {
      tenderId,
      vendorId,
      status: proposal.status,
    });
  } catch (err) {
    console.error("[agent] updateVendorStatus error:", err.message);
    next(err);
  }
};

module.exports = {
  whoAmI,
  getMyTenders,
  getMyTenderById,
  getVendorsByTenderId,
  updateVendorStatus,
};
