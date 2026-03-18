const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  notifyUserLogin,
  notifyUserLogout,
} = require("../services/postLoginService");

/** Generate a signed JWT for a user */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Explicitly select passwordHash (it is excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash",
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Your account has been deactivated. Contact an administrator.",
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    const userResponse = user.toJSON(); // passwordHash stripped by transform

    if (["companyUser"].includes(user.role)) {
      notifyUserLogin(user._id, token).catch(() => {});
    }

    res.status(200).json({ success: true, token, user: userResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

/**
 * PATCH /api/auth/profile
 * Body: { profile: { companyName, contactPerson, phone, address, companyDescription } }
 */
const updateProfile = async (req, res, next) => {
  try {
    const { profile } = req.body;

    if (!profile || typeof profile !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Profile data is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const allowed = [
      "displayName",
      "companyName",
      "contactPerson",
      "phone",
      "address",
      "companyDescription",
    ];
    const updates = {};
    for (const key of allowed) {
      if (profile[key] !== undefined) updates[key] = profile[key];
    }

    user.profile = { ...user.profile.toObject(), ...updates };
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "currentPassword and newPassword are required",
        });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.passwordHash = newPassword; // pre-save hook will hash it
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register
 * Body: { email, password, profile }
 * Creates a vendor account only. Company users must be created by admin.
 */
const register = async (req, res, next) => {
  try {
    const { email, password, profile } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "An account with this email already exists.",
        });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: password,
      role: "vendor",
      profile: profile || {},
    });

    const token = signToken(user._id);
    const userResponse = user.toJSON();

    res.status(201).json({ success: true, token, user: userResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Notifies external post-login service when company user logs out.
 */
const logout = async (req, res) => {
  if (["companyUser"].includes(req.user?.role)) {
    notifyUserLogout(req.user._id).catch(() => {});
  }
  res.status(200).json({ success: true, message: "Logged out" });
};

module.exports = {
  login,
  register,
  getMe,
  updateProfile,
  changePassword,
  logout,
};
