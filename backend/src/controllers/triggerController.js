const TriggerConfig = require('../models/TriggerConfig');

/**
 * GET /api/integration/trigger
 * Returns the trigger config (admin only). Only one config exists.
 */
const getTriggerConfig = async (req, res, next) => {
  try {
    const config = await TriggerConfig.findOne();
    res.status(200).json({ success: true, triggerConfig: config || null });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/integration/trigger
 * Body: { apiUrl, triggerToken, apiPublicUrl? }
 * Upsert: remove existing, create new (only one allowed).
 */
const upsertTriggerConfig = async (req, res, next) => {
  try {
    const { apiUrl, triggerToken, apiPublicUrl } = req.body;

    if (!apiUrl || !triggerToken) {
      return res.status(400).json({
        success: false,
        message: 'apiUrl and triggerToken are required',
      });
    }

    await TriggerConfig.deleteMany({});
    const config = await TriggerConfig.create({
      apiUrl: String(apiUrl).trim(),
      triggerToken: String(triggerToken).trim(),
      apiPublicUrl: (apiPublicUrl || '').trim(),
    });

    res.status(201).json({ success: true, triggerConfig: config });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/integration/trigger
 * Remove the trigger config.
 */
const removeTriggerConfig = async (req, res, next) => {
  try {
    const result = await TriggerConfig.deleteMany({});
    res.status(200).json({
      success: true,
      message: 'Trigger config removed',
      deleted: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTriggerConfig, upsertTriggerConfig, removeTriggerConfig };
