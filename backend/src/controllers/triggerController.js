const TriggerConfig = require('../models/TriggerConfig');

const TRIGGER_TYPE_PROPOSAL = 'proposal';
const TRIGGER_TYPE_TENDER = 'tender';
const TRIGGER_TYPE_AWARDED = 'awarded';

const VALID_TYPES = [TRIGGER_TYPE_PROPOSAL, TRIGGER_TYPE_TENDER, TRIGGER_TYPE_AWARDED];

async function findConfigByType(type) {
  let config = await TriggerConfig.findOne({ type });
  if (!config && type === TRIGGER_TYPE_PROPOSAL) {
    config = await TriggerConfig.findOne({ type: { $exists: false } });
  }
  return config;
}

/**
 * GET /api/integration/trigger
 * Returns proposal, tender, and awarded trigger configs (admin only).
 */
const getTriggerConfig = async (req, res, next) => {
  try {
    const [proposalConfig, tenderConfig, awardedConfig] = await Promise.all([
      findConfigByType(TRIGGER_TYPE_PROPOSAL),
      findConfigByType(TRIGGER_TYPE_TENDER),
      findConfigByType(TRIGGER_TYPE_AWARDED),
    ]);

    res.status(200).json({
      success: true,
      triggerConfig: proposalConfig || null,
      tenderTriggerConfig: tenderConfig || null,
      awardedTriggerConfig: awardedConfig || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/integration/trigger
 * Body: { apiUrl, triggerToken, apiPublicUrl?, type?: 'proposal'|'tender'|'awarded' }
 */
const upsertTriggerConfig = async (req, res, next) => {
  try {
    const { apiUrl, triggerToken, apiPublicUrl, type = TRIGGER_TYPE_PROPOSAL } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be proposal, tender, or awarded',
      });
    }

    if (!apiUrl || !triggerToken) {
      return res.status(400).json({
        success: false,
        message: 'apiUrl and triggerToken are required',
      });
    }

    await TriggerConfig.deleteMany({ type });
    if (type === TRIGGER_TYPE_PROPOSAL) {
      await TriggerConfig.deleteMany({ type: { $exists: false } });
    }

    const config = await TriggerConfig.create({
      type,
      apiUrl: String(apiUrl).trim(),
      triggerToken: String(triggerToken).trim(),
      apiPublicUrl: (apiPublicUrl || '').trim(),
    });

    res.status(201).json({
      success: true,
      triggerConfig: type === TRIGGER_TYPE_PROPOSAL ? config : undefined,
      tenderTriggerConfig: type === TRIGGER_TYPE_TENDER ? config : undefined,
      awardedTriggerConfig: type === TRIGGER_TYPE_AWARDED ? config : undefined,
      config,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/integration/trigger?type=proposal|tender|awarded
 */
const removeTriggerConfig = async (req, res, next) => {
  try {
    const type = req.query.type || TRIGGER_TYPE_PROPOSAL;

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be proposal, tender, or awarded',
      });
    }

    const filter =
      type === TRIGGER_TYPE_PROPOSAL
        ? { $or: [{ type: TRIGGER_TYPE_PROPOSAL }, { type: { $exists: false } }] }
        : { type };

    const result = await TriggerConfig.deleteMany(filter);
    res.status(200).json({
      success: true,
      message: 'Trigger config removed',
      deleted: result.deletedCount,
      type,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTriggerConfig, upsertTriggerConfig, removeTriggerConfig };
