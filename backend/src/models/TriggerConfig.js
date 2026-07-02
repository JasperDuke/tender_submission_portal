const mongoose = require('mongoose');

const TRIGGER_TYPES = ['proposal', 'tender'];

const triggerConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: TRIGGER_TYPES,
      default: 'proposal',
      required: true,
    },
    apiUrl: {
      type: String,
      required: true,
      trim: true,
    },
    triggerToken: {
      type: String,
      required: true,
      trim: true,
    },
    /** Base URL of this API for building attachment URLs (e.g. https://api-demosourcing.atenxion.ai) */
    apiPublicUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

triggerConfigSchema.index({ type: 1 }, { unique: true });

const TriggerConfig = mongoose.model('TriggerConfig', triggerConfigSchema);
module.exports = TriggerConfig;
module.exports.TRIGGER_TYPES = TRIGGER_TYPES;
