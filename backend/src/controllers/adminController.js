const User = require('../models/User');

/**
 * GET /api/admin/users
 * Query params: role, search (name or email)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.companyName': { $regex: search, $options: 'i' } },
        { 'profile.contactPerson': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users
 * Body: { email, password, role, profile }
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'email, password, and role are required' });
    }

    if (role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts cannot be created through this interface. There is only one administrator.',
      });
    }

    const user = await User.create({
      email,
      passwordHash: password, // pre-save hook will hash
      role,
      profile: profile || {},
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id
 * Body: { email, role, isActive, profile, newPassword }
 * Admin cannot deactivate their own account (set isActive = false).
 */
const updateUser = async (req, res, next) => {
  try {
    const { email, role, isActive, profile, newPassword } = req.body;
    const targetId = req.params.id;
    const currentUserId = req.user._id.toString();

    const user = await User.findById(targetId).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent admin from deactivating their own account
    if (targetId === currentUserId && typeof isActive === 'boolean' && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account. Ask another administrator to perform this action.',
      });
    }

    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (profile) {
      const allowed = ['displayName', 'companyName', 'contactPerson', 'phone', 'address', 'companyDescription'];
      const updates = {};
      for (const key of allowed) {
        if (profile[key] !== undefined) updates[key] = profile[key];
      }
      user.profile = { ...user.profile.toObject(), ...updates };
    }
    if (newPassword) user.passwordHash = newPassword; // pre-save hook rehashes

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/deactivate
 * Soft-deletes a user (sets isActive = false)
 * Admin cannot deactivate their own account.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account. Ask another administrator to perform this action.',
      });
    }

    const user = await User.findByIdAndUpdate(
      targetId,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deactivated', user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/activate
 */
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User activated', user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deactivateUser, activateUser };
