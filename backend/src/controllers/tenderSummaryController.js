const Tender = require('../models/Tender');
const TenderSummary = require('../models/TenderSummary');

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateNonEmptyString(value, label) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return `${label} is required`;
  }
  return null;
}

function validateStringArray(values, label) {
  if (!Array.isArray(values) || values.length === 0) {
    return `${label} must include at least one item`;
  }
  if (!values.every((item) => typeof item === 'string' && item.trim())) {
    return `${label} items must be non-empty strings`;
  }
  return null;
}

function validateScopeCoverage(rows, label) {
  if (rows == null) return null;
  if (!Array.isArray(rows)) {
    return `${label}.scopeCoverage must be an array`;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const metricError = validateNonEmptyString(row?.metric, `${label}.scopeCoverage[${i}].metric`);
    if (metricError) return metricError;
    const resultError = validateNonEmptyString(row?.result, `${label}.scopeCoverage[${i}].result`);
    if (resultError) return resultError;
  }
  return null;
}

function validateBoqVendor(vendor, label) {
  if (!vendor || typeof vendor !== 'object') {
    return `${label} is required`;
  }

  const vendorNameError = validateNonEmptyString(vendor.vendorName, `${label}.vendorName`);
  if (vendorNameError) return vendorNameError;

  const matchStatusError = validateNonEmptyString(vendor.matchStatus, `${label}.matchStatus`);
  if (matchStatusError) return matchStatusError;

  const scopeCoverageError = validateScopeCoverage(vendor.scopeCoverage, label);
  if (scopeCoverageError) return scopeCoverageError;

  const coverageSummaryError = validateNonEmptyString(vendor.coverageSummary, `${label}.coverageSummary`);
  if (coverageSummaryError) return coverageSummaryError;

  return validateStringArray(vendor.keyDifferences, `${label}.keyDifferences`);
}

function validateHistoricalPriceRows(rows, label, required = false) {
  if (rows == null) {
    return required ? `${label} is required` : null;
  }
  if (!Array.isArray(rows)) {
    return `${label} must be an array`;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const fields = ['item', 'vendorPrice', 'historicalPrice', 'variance'];
    for (const field of fields) {
      const error = validateNonEmptyString(row?.[field], `${label}[${i}].${field}`);
      if (error) return error;
    }
  }
  return null;
}

function validatePricingOverview(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return `${label}.pricingOverview must include at least one row`;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const metricError = validateNonEmptyString(row?.metric, `${label}.pricingOverview[${i}].metric`);
    if (metricError) return metricError;
    if (typeof row?.count !== 'number' || Number.isNaN(row.count)) {
      return `${label}.pricingOverview[${i}].count must be a number`;
    }
  }
  return null;
}

function validateHistoricalVendor(vendor, label) {
  if (!vendor || typeof vendor !== 'object') {
    return `${label} is required`;
  }

  const vendorNameError = validateNonEmptyString(vendor.vendorName, `${label}.vendorName`);
  if (vendorNameError) return vendorNameError;

  const pricingOverviewError = validatePricingOverview(vendor, label);
  if (pricingOverviewError) return pricingOverviewError;

  const aboveError = validateHistoricalPriceRows(vendor.aboveHistorical, `${label}.aboveHistorical`);
  if (aboveError) return aboveError;

  const belowError = validateHistoricalPriceRows(vendor.belowHistorical, `${label}.belowHistorical`);
  if (belowError) return belowError;

  if (vendor.commercialObservation != null && typeof vendor.commercialObservation !== 'string') {
    return `${label}.commercialObservation must be a string`;
  }

  return null;
}

function validateVendorSection(section, label, validateVendor) {
  if (!section || typeof section !== 'object') {
    return `${label} is required`;
  }

  if (!Array.isArray(section.vendors) || section.vendors.length === 0) {
    return `${label}.vendors must include at least one vendor`;
  }

  for (let i = 0; i < section.vendors.length; i += 1) {
    const vendorError = validateVendor(section.vendors[i], `${label}.vendors[${i}]`);
    if (vendorError) return vendorError;
  }

  const overallError = validateNonEmptyString(section.overall, `${label}.overall`);
  if (overallError) return overallError;

  return validateNonEmptyString(section.conclusion, `${label}.conclusion`);
}

function normalizeScopeCoverage(rows = []) {
  return rows.map((row) => ({
    metric: trimString(row.metric),
    result: trimString(row.result),
  }));
}

function normalizeBoqVendor(vendor) {
  return {
    vendorName: trimString(vendor.vendorName),
    matchStatus: trimString(vendor.matchStatus),
    scopeCoverage: normalizeScopeCoverage(vendor.scopeCoverage || []),
    coverageSummary: trimString(vendor.coverageSummary),
    keyDifferences: vendor.keyDifferences.map((item) => trimString(item)),
  };
}

function normalizeHistoricalPriceRows(rows = []) {
  return rows.map((row) => ({
    item: trimString(row.item),
    vendorPrice: trimString(row.vendorPrice),
    historicalPrice: trimString(row.historicalPrice),
    variance: trimString(row.variance),
  }));
}

function normalizeHistoricalVendor(vendor) {
  return {
    vendorName: trimString(vendor.vendorName),
    pricingOverview: vendor.pricingOverview.map((row) => ({
      metric: trimString(row.metric),
      count: row.count,
    })),
    aboveHistorical: normalizeHistoricalPriceRows(vendor.aboveHistorical || []),
    belowHistorical: normalizeHistoricalPriceRows(vendor.belowHistorical || []),
    commercialObservation: trimString(vendor.commercialObservation || ''),
  };
}

function normalizeSummary(summary) {
  return {
    boqSummary: {
      vendors: summary.boqSummary.vendors.map(normalizeBoqVendor),
      overall: trimString(summary.boqSummary.overall),
      conclusion: trimString(summary.boqSummary.conclusion),
    },
    historicalSummary: {
      vendors: summary.historicalSummary.vendors.map(normalizeHistoricalVendor),
      overall: trimString(summary.historicalSummary.overall),
      conclusion: trimString(summary.historicalSummary.conclusion),
    },
  };
}

function coerceSummaryForResponse(summary) {
  if (!summary || typeof summary !== 'object') {
    return {
      boqSummary: { vendors: [], overall: '', conclusion: '' },
      historicalSummary: { vendors: [], overall: '', conclusion: '' },
    };
  }

  try {
    return normalizeSummary({
      boqSummary: summary.boqSummary || {},
      historicalSummary: summary.historicalSummary || {},
    });
  } catch {
    const legacyBoq = summary.boqSummary && typeof summary.boqSummary === 'object' ? summary.boqSummary : {};
    const legacyHistorical =
      summary.historicalSummary && typeof summary.historicalSummary === 'object'
        ? summary.historicalSummary
        : {};

    return {
      boqSummary: {
        vendors: Array.isArray(legacyBoq.vendors) ? legacyBoq.vendors : [],
        overall: trimString(legacyBoq.overall || legacyBoq.title || ''),
        conclusion: trimString(legacyBoq.conclusion || ''),
      },
      historicalSummary: {
        vendors: Array.isArray(legacyHistorical.vendors) ? legacyHistorical.vendors : [],
        overall: trimString(legacyHistorical.overall || legacyHistorical.title || ''),
        conclusion: trimString(legacyHistorical.conclusion || ''),
      },
    };
  }
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

    const boqError = validateVendorSection(summary?.boqSummary, 'boqSummary', validateBoqVendor);
    if (boqError) {
      return res.status(400).json({ success: false, message: boqError });
    }

    const historicalError = validateVendorSection(
      summary?.historicalSummary,
      'historicalSummary',
      validateHistoricalVendor
    );
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

    const tenderSummary = await TenderSummary.findOne({ tenderId }).lean();
    if (!tenderSummary) {
      return res.status(404).json({ success: false, message: 'Tender summary not found' });
    }

    res.status(200).json({
      success: true,
      tenderSummary: {
        ...tenderSummary,
        summary: coerceSummaryForResponse(tenderSummary.summary),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upsertTenderSummary,
  getTenderSummaryByTenderId,
};
