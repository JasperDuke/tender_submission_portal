const Tender = require('../models/Tender');
const TenderSummary = require('../models/TenderSummary');

const LOG_PREFIX = '[TenderSummary]';

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function coerceCount(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, ''));
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function validateNonEmptyString(value, label) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return `${label} is required`;
  }
  return null;
}

function validateOptionalString(value, label) {
  if (value != null && typeof value !== 'string') {
    return `${label} must be a string`;
  }
  return null;
}

function validateOptionalStringArray(values, label) {
  if (values == null) return null;
  if (!Array.isArray(values)) {
    return `${label} must be an array`;
  }
  if (!values.every((item) => typeof item === 'string')) {
    return `${label} items must be strings`;
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
    if (!row || typeof row !== 'object') {
      return `${label}.scopeCoverage[${i}] must be an object`;
    }
    const metric = trimString(row.metric || row.label || row.name);
    const result = trimString(row.result ?? row.value ?? row.count);
    if (!metric && !result) {
      return `${label}.scopeCoverage[${i}] must include metric or result`;
    }
  }
  return null;
}

function validateBoqVendor(vendor, label) {
  if (!vendor || typeof vendor !== 'object') {
    return `${label} is required`;
  }

  const vendorNameError = validateNonEmptyString(vendor.vendorName, `${label}.vendorName`);
  if (vendorNameError) return vendorNameError;

  const matchStatusError = validateOptionalString(vendor.matchStatus, `${label}.matchStatus`);
  if (matchStatusError) return matchStatusError;

  const coverageSummaryError = validateOptionalString(vendor.coverageSummary, `${label}.coverageSummary`);
  if (coverageSummaryError) return coverageSummaryError;

  const scopeCoverageError = validateScopeCoverage(vendor.scopeCoverage, label);
  if (scopeCoverageError) return scopeCoverageError;

  return validateOptionalStringArray(vendor.keyDifferences, `${label}.keyDifferences`);
}

function validateHistoricalPriceRows(rows, label) {
  if (rows == null) return null;
  if (!Array.isArray(rows)) {
    return `${label} must be an array`;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || typeof row !== 'object') {
      return `${label}[${i}] must be an object`;
    }
    const fields = ['item', 'vendorPrice', 'historicalPrice', 'variance'];
    for (const field of fields) {
      const error = validateOptionalString(row[field], `${label}[${i}].${field}`);
      if (error) return error;
    }
  }
  return null;
}

function validatePricingOverview(rows, label) {
  if (rows == null) return null;
  if (!Array.isArray(rows)) {
    return `${label}.pricingOverview must be an array`;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || typeof row !== 'object') {
      return `${label}.pricingOverview[${i}] must be an object`;
    }
    const metric = trimString(row.metric || row.label || row.name);
    if (!metric) {
      return `${label}.pricingOverview[${i}] must include metric`;
    }
    const countValue = row.count ?? row.value ?? row.result;
    if (
      countValue != null &&
      typeof countValue !== 'number' &&
      typeof countValue !== 'string'
    ) {
      return `${label}.pricingOverview[${i}].count must be a number or numeric string`;
    }
    if (typeof countValue === 'string' && countValue.trim() !== '' && Number.isNaN(Number(countValue.replace(/,/g, '')))) {
      return `${label}.pricingOverview[${i}].count must be a number or numeric string`;
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

  const pricingOverviewError = validatePricingOverview(vendor.pricingOverview, label);
  if (pricingOverviewError) return pricingOverviewError;

  const aboveError = validateHistoricalPriceRows(vendor.aboveHistorical, `${label}.aboveHistorical`);
  if (aboveError) return aboveError;

  const belowError = validateHistoricalPriceRows(vendor.belowHistorical, `${label}.belowHistorical`);
  if (belowError) return belowError;

  return validateOptionalString(vendor.commercialObservation, `${label}.commercialObservation`);
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

function logUpsertPayload(reqBody) {
  console.log(`${LOG_PREFIX} POST /tender-summaries received`);
  console.log(`${LOG_PREFIX} req.body:`, JSON.stringify(reqBody, null, 2));

  const { summary } = reqBody || {};
  if (!summary) return;

  const boqVendors = summary?.boqSummary?.vendors;
  const historicalVendors = summary?.historicalSummary?.vendors;

  if (Array.isArray(boqVendors)) {
    boqVendors.forEach((vendor, index) => {
      console.log(`${LOG_PREFIX} boqSummary.vendors[${index}]:`, JSON.stringify(vendor, null, 2));
    });
  }

  if (Array.isArray(historicalVendors)) {
    historicalVendors.forEach((vendor, index) => {
      console.log(`${LOG_PREFIX} historicalSummary.vendors[${index}]:`, JSON.stringify(vendor, null, 2));
      const overview = vendor?.pricingOverview;
      console.log(`${LOG_PREFIX} historicalSummary.vendors[${index}].pricingOverview type:`, Array.isArray(overview) ? 'array' : typeof overview);
      if (Array.isArray(overview)) {
        overview.forEach((row, rowIndex) => {
          console.log(
            `${LOG_PREFIX} historicalSummary.vendors[${index}].pricingOverview[${rowIndex}]:`,
            JSON.stringify(row),
            `count typeof=${typeof row?.count}`
          );
        });
      }
    });
  }
}

function logValidationFailure(message, summary) {
  console.error(`${LOG_PREFIX} Validation failed: ${message}`);
  if (summary?.historicalSummary?.vendors?.[0]) {
    console.error(
      `${LOG_PREFIX} historicalSummary.vendors[0] snapshot:`,
      JSON.stringify(summary.historicalSummary.vendors[0], null, 2)
    );
  }
}

function normalizeScopeCoverage(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      metric: trimString(row?.metric || row?.label || row?.name),
      result: trimString(row?.result ?? row?.value ?? row?.count),
    }))
    .filter((row) => row.metric || row.result);
}

function normalizeStringList(values) {
  if (!Array.isArray(values)) return [];
  return values.map((item) => trimString(item)).filter(Boolean);
}

function normalizeBoqVendor(vendor) {
  return {
    vendorName: trimString(vendor.vendorName),
    matchStatus: trimString(vendor.matchStatus),
    scopeCoverage: normalizeScopeCoverage(vendor.scopeCoverage),
    coverageSummary: trimString(vendor.coverageSummary),
    keyDifferences: normalizeStringList(vendor.keyDifferences),
  };
}

function normalizeHistoricalPriceRows(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      item: trimString(row?.item),
      vendorPrice: trimString(row?.vendorPrice),
      historicalPrice: trimString(row?.historicalPrice),
      variance: trimString(row?.variance),
    }))
    .filter((row) => row.item || row.vendorPrice || row.historicalPrice || row.variance);
}

function normalizePricingOverview(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      metric: trimString(row?.metric || row?.label || row?.name),
      count: coerceCount(row?.count ?? row?.value ?? row?.result),
    }))
    .filter((row) => row.metric);
}

function normalizeHistoricalVendor(vendor) {
  return {
    vendorName: trimString(vendor.vendorName),
    pricingOverview: normalizePricingOverview(vendor.pricingOverview),
    aboveHistorical: normalizeHistoricalPriceRows(vendor.aboveHistorical),
    belowHistorical: normalizeHistoricalPriceRows(vendor.belowHistorical),
    commercialObservation: trimString(vendor.commercialObservation),
  };
}

function normalizeSummary(summary) {
  return {
    boqSummary: {
      vendors: (summary.boqSummary?.vendors || []).map(normalizeBoqVendor),
      overall: trimString(summary.boqSummary?.overall),
      conclusion: trimString(summary.boqSummary?.conclusion),
    },
    historicalSummary: {
      vendors: (summary.historicalSummary?.vendors || []).map(normalizeHistoricalVendor),
      overall: trimString(summary.historicalSummary?.overall),
      conclusion: trimString(summary.historicalSummary?.conclusion),
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
    logUpsertPayload(req.body);

    const { tenderId, summary } = req.body;

    if (!tenderId) {
      console.error(`${LOG_PREFIX} Missing tenderId`);
      return res.status(400).json({ success: false, message: 'tenderId is required' });
    }
    if (!summary) {
      console.error(`${LOG_PREFIX} Missing summary`);
      return res.status(400).json({ success: false, message: 'summary is required' });
    }

    const boqError = validateVendorSection(summary?.boqSummary, 'boqSummary', validateBoqVendor);
    if (boqError) {
      logValidationFailure(boqError, summary);
      return res.status(400).json({ success: false, message: boqError });
    }

    const historicalError = validateVendorSection(
      summary?.historicalSummary,
      'historicalSummary',
      validateHistoricalVendor
    );
    if (historicalError) {
      logValidationFailure(historicalError, summary);
      return res.status(400).json({ success: false, message: historicalError });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) {
      console.error(`${LOG_PREFIX} Tender not found: ${tenderId}`);
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const normalizedSummary = normalizeSummary(summary);
    console.log(`${LOG_PREFIX} Normalized summary:`, JSON.stringify(normalizedSummary, null, 2));

    const tenderSummary = await TenderSummary.findOneAndUpdate(
      { tenderId },
      { tenderId, summary: normalizedSummary },
      { new: true, upsert: true, runValidators: true }
    );

    console.log(`${LOG_PREFIX} Upsert successful for tenderId=${tenderId}`);
    res.status(200).json({ success: true, tenderSummary });
  } catch (err) {
    console.error(`${LOG_PREFIX} Upsert error:`, err);
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
