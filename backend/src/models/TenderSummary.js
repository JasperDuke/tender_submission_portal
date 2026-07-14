const mongoose = require('mongoose');

const scopeCoverageRowSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    result: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const boqVendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true, trim: true },
    matchStatus: { type: String, required: true, trim: true },
    scopeCoverage: { type: [scopeCoverageRowSchema], default: [] },
    coverageSummary: { type: String, required: true, trim: true },
    keyDifferences: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.every((item) => item?.trim()),
        message: 'keyDifferences must include at least one non-empty item',
      },
    },
  },
  { _id: false }
);

const boqSummarySchema = new mongoose.Schema(
  {
    vendors: {
      type: [boqVendorSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'boqSummary.vendors must include at least one vendor',
      },
    },
    overall: { type: String, required: true, trim: true },
    conclusion: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pricingOverviewRowSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, trim: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const historicalPriceRowSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    vendorPrice: { type: String, required: true, trim: true },
    historicalPrice: { type: String, required: true, trim: true },
    variance: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const historicalVendorSchema = new mongoose.Schema(
  {
    vendorName: { type: String, required: true, trim: true },
    pricingOverview: {
      type: [pricingOverviewRowSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'pricingOverview must include at least one row',
      },
    },
    aboveHistorical: { type: [historicalPriceRowSchema], default: [] },
    belowHistorical: { type: [historicalPriceRowSchema], default: [] },
    commercialObservation: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const historicalSummarySchema = new mongoose.Schema(
  {
    vendors: {
      type: [historicalVendorSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'historicalSummary.vendors must include at least one vendor',
      },
    },
    overall: { type: String, required: true, trim: true },
    conclusion: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const tenderSummarySchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: [true, 'Tender reference is required'],
      unique: true,
    },
    summary: {
      boqSummary: {
        type: boqSummarySchema,
        required: true,
      },
      historicalSummary: {
        type: historicalSummarySchema,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const TenderSummary = mongoose.model('TenderSummary', tenderSummarySchema);
module.exports = TenderSummary;
