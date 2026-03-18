const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'companyUser', 'vendor'];

// ── Vendor / Company profile (optional fields) ────────────────────────────────
const profileSchema = new mongoose.Schema(
  {
    displayName: { type: String, trim: true },  // Your name (used for all roles including admin)
    companyName: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    companyDescription: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be admin, companyUser, or vendor' },
      required: [true, 'Role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profile: {
      type: profileSchema,
      default: {},
    },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// ── Hash password before save ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ── Instance method: compare passwords ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ── Transform: remove passwordHash from JSON output ──────────────────────────
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
