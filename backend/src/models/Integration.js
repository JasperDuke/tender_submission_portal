const mongoose = require('mongoose');

const TYPES = ['admin', 'companyUser', 'vendor'];

const integrationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: { values: TYPES, message: 'Type must be admin, companyUser, or vendor' },
      required: true,
      unique: true,
    },
    script: {
      type: String,
      default: '',
      trim: true,
    },
    token: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

const Integration = mongoose.model('Integration', integrationSchema);
module.exports = Integration;
