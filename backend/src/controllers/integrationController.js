const Integration = require('../models/Integration');

/**
 * GET /api/integration/me
 * Returns the integration for the authenticated user's role.
 */
const getMine = async (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const role = req.user.role;
    const integration = await Integration.findOne({ type: role });
    if (!integration) {
      return res.status(200).json({ success: true, integration: null });
    }
    res.status(200).json({ success: true, integration });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/integration
 * Returns all integrations (admin only). One per type max.
 */
const getAll = async (req, res, next) => {
  try {
    const integrations = await Integration.find().sort({ type: 1 });
    res.status(200).json({ success: true, integrations });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/integration
 * Body: { type, script, token }
 * Add integration for a type. Fails if one already exists for that type.
 */
const create = async (req, res, next) => {
  try {
    const { type, script, token } = req.body;

    const existing = await Integration.findOne({ type });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Integration for "${type}" already exists. Remove it first, then add again.`,
      });
    }

    const integration = await Integration.create({
      type,
      script: (script || '').trim(),
      token: (token || '').trim(),
    });
    res.status(201).json({ success: true, integration });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Integration for this type already exists. Remove it first, then add again.',
      });
    }
    next(err);
  }
};

/**
 * DELETE /api/integration/:type
 * Remove integration for a type.
 */
const remove = async (req, res, next) => {
  try {
    const { type } = req.params;

    const integration = await Integration.findOneAndDelete({ type });
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: `No integration found for type "${type}"`,
      });
    }

    res.status(200).json({ success: true, message: 'Integration removed', integration });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getMine, create, remove };
