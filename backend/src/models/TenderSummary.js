const mongoose = require('mongoose');

const summarySectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
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
        type: summarySectionSchema,
        required: true,
      },
      historicalSummary: {
        type: summarySectionSchema,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const TenderSummary = mongoose.model('TenderSummary', tenderSummarySchema);
module.exports = TenderSummary;
