const mongoose = require('mongoose');

const PROPOSAL_STATUSES = ['Pending', 'Reviewed', 'Awarded', 'Accepted', 'Rejected', 'Shortlisted'];

const proposalSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: [true, 'Tender reference is required'],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor reference is required'],
    },
    /** Relative path from the server root, e.g. uploads/abc-1234.pdf */
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    originalFileName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: { values: PROPOSAL_STATUSES, message: 'Invalid proposal status' },
      default: 'Pending',
    },
    remarks: {
      type: String,
      trim: true,
    },
    /** Optional numeric score (0–10) set by Company User */
    score: {
      type: Number,
      min: 0,
      max: 10,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── One proposal per vendor per tender ───────────────────────────────────────
proposalSchema.index({ tenderId: 1, vendorId: 1 }, { unique: true });

const Proposal = mongoose.model('Proposal', proposalSchema);
module.exports = Proposal;
