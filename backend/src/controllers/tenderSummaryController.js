const Tender = require('../models/Tender');
const TenderSummary = require('../models/TenderSummary');

function validateSummarySection(section, label) {
  if (!section || typeof section !== 'object') {
    return `${label} is required`;
  }
  const { title, overall, conclusion } = section;
  if (!title?.trim() || !overall?.trim() || !conclusion?.trim()) {
    return `${label} must include title, overall, and conclusion`;
  }
  return null;
}

function normalizeSummary(summary) {
  return {
    boqSummary: {
      title: summary.boqSummary.title.trim(),
      overall: summary.boqSummary.overall.trim(),
      conclusion: summary.boqSummary.conclusion.trim(),
    },
    historicalSummary: {
      title: summary.historicalSummary.title.trim(),
      overall: summary.historicalSummary.overall.trim(),
      conclusion: summary.historicalSummary.conclusion.trim(),
    },
  };
}

/**
 * POST /api/tender-summaries
 * Public – no auth required (agent integration).
 * Body: { tenderId, summary: { boqSummary, historicalSummary } }
 */
const upsertTenderSummary = async (req, res, next) => {
  try {
    const { tenderId, summary } = req.body;

    if (!tenderId) {
      return res.status(400).json({ success: false, message: 'tenderId is required' });
    }
    if (!summary) {
      return res.status(400).json({ success: false, message: 'summary is required' });
    }

    const boqError = validateSummarySection(summary?.boqSummary, 'boqSummary');
    if (boqError) {
      return res.status(400).json({ success: false, message: boqError });
    }

    const historicalError = validateSummarySection(summary?.historicalSummary, 'historicalSummary');
    if (historicalError) {
      return res.status(400).json({ success: false, message: historicalError });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const tenderSummary = await TenderSummary.findOneAndUpdate(
      { tenderId },
      { tenderId, summary: normalizeSummary(summary) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, tenderSummary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tender-summaries/tender/:tenderId
 * Public – no auth required (agent integration).
 */
const getTenderSummaryByTenderId = async (req, res, next) => {
  try {
    const { tenderId } = req.params;

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const tenderSummary = await TenderSummary.findOne({ tenderId });
    if (!tenderSummary) {
      return res.status(404).json({ success: false, message: 'Tender summary not found' });
    }

    res.status(200).json({ success: true, tenderSummary });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upsertTenderSummary,
  getTenderSummaryByTenderId,
};
