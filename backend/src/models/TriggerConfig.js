const mongoose = require('mongoose');

const triggerConfigSchema = new mongoose.Schema(
  {
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

const TriggerConfig = mongoose.model('TriggerConfig', triggerConfigSchema);
module.exports = TriggerConfig;
