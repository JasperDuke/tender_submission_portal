const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tender title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    requirements: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Submission deadline is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Optional: array of attachment URLs (future enhancement)
    attachments: [{ type: String }],
    category: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ── Index for efficient searches ──────────────────────────────────────────────
tenderSchema.index({ status: 1, deadline: 1 });
tenderSchema.index({ title: 'text', description: 'text', category: 'text' });

const Tender = mongoose.model('Tender', tenderSchema);
module.exports = Tender;
