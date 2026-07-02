const TriggerConfig = require('../models/TriggerConfig');

const TRIGGER_TYPE_PROPOSAL = 'proposal';
const TRIGGER_TYPE_TENDER = 'tender';

async function findConfigByType(type) {
  let config = await TriggerConfig.findOne({ type });
  if (!config && type === TRIGGER_TYPE_PROPOSAL) {
    config = await TriggerConfig.findOne({ type: { $exists: false } });
  }
  return config;
}

/**
 * GET /api/integration/trigger
 * Returns proposal and tender trigger configs (admin only).
 */
const getTriggerConfig = async (req, res, next) => {
  try {
    const [proposalConfig, tenderConfig] = await Promise.all([
      findConfigByType(TRIGGER_TYPE_PROPOSAL),
      findConfigByType(TRIGGER_TYPE_TENDER),
    ]);

    res.status(200).json({
      success: true,
      triggerConfig: proposalConfig || null,
      tenderTriggerConfig: tenderConfig || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/integration/trigger
 * Body: { apiUrl, triggerToken, apiPublicUrl?, type?: 'proposal'|'tender' }
 * Upsert one config per type. Defaults to proposal for backward compatibility.
 */
const upsertTriggerConfig = async (req, res, next) => {
  try {
    const { apiUrl, triggerToken, apiPublicUrl, type = TRIGGER_TYPE_PROPOSAL } = req.body;

    if (![TRIGGER_TYPE_PROPOSAL, TRIGGER_TYPE_TENDER].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be proposal or tender',
      });
    }

    if (!apiUrl || !triggerToken) {
      return res.status(400).json({
        success: false,
        message: 'apiUrl and triggerToken are required',
      });
    }

    await TriggerConfig.deleteMany({ type });
    // Remove legacy proposal doc without type field when upserting proposal
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
      config,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/integration/trigger?type=proposal|tender
 * Remove trigger config for the given type (defaults to proposal).
 */
const removeTriggerConfig = async (req, res, next) => {
  try {
    const type = req.query.type || TRIGGER_TYPE_PROPOSAL;

    if (![TRIGGER_TYPE_PROPOSAL, TRIGGER_TYPE_TENDER].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be proposal or tender',
      });
    }

    const filter =
      type === TRIGGER_TYPE_PROPOSAL
        ? { $or: [{ type: TRIGGER_TYPE_PROPOSAL }, { type: { $exists: false } }] }
        : { type: TRIGGER_TYPE_TENDER };

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
