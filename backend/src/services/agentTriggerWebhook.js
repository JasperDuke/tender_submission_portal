const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const TriggerConfig = require("../models/TriggerConfig");
const User = require("../models/User");

const TRIGGER_TYPE_PROPOSAL = "proposal";
const TRIGGER_TYPE_TENDER = "tender";
const TRIGGER_TYPE_AWARDED = "awarded";

async function getConfigForType(type) {
  let config = await TriggerConfig.findOne({ type });
  // Backward compat: legacy docs without type field are treated as proposal
  if (!config && type === TRIGGER_TYPE_PROPOSAL) {
    config = await TriggerConfig.findOne({ type: { $exists: false } });
  }
  return config;
}

function getPublicBaseUrl(config) {
  const raw = (config?.apiPublicUrl || process.env.API_PUBLIC_URL || "").trim();
  if (!raw) return "";
  // Normalize: strip trailing slash and accidental /api suffix
  return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function buildAttachmentUrls(filePaths, baseUrl) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return [];
  if (!baseUrl) return [];

  return filePaths
    .map((filePath) => {
      if (!filePath) return null;
      const filename = path.basename(String(filePath).replace(/\\/g, "/"));
      return filename
        ? `${baseUrl}/uploads/${encodeURIComponent(filename)}`
        : null;
    })
    .filter(Boolean);
}

function resolveAttachments(filePaths, config, label) {
  const baseUrl = getPublicBaseUrl(config);
  const attachments = buildAttachmentUrls(filePaths, baseUrl);

  if (filePaths?.length && !baseUrl) {
    console.warn(
      `[webhook] ${label}: files present but apiPublicUrl/API_PUBLIC_URL not set – attachments will be empty`,
    );
  } else if (filePaths?.length && attachments.length === 0) {
    console.warn(
      `[webhook] ${label}: could not build public URLs from file paths`,
      { filePaths },
    );
  } else if (attachments.length > 0) {
    console.log(`[webhook] ${label} public attachment URLs:`, attachments);
  }

  return attachments;
}

async function sendWebhook({ config, payload, label }) {
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : [];

  console.log(`[webhook] calling ${label}`, {
    event_id: payload.event_id,
    tenderId: payload.tenderId,
    attachments,
  });

  try {
    const response = await axios.post(config.apiUrl, payload, {
      headers: {
        Authorization: config.triggerToken,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    console.log(`[webhook] ${label} success`, {
      event_id: payload.event_id,
      status: response.status,
    });
    return response.data;
  } catch (err) {
    console.error(`[webhook] ${label} failed`, {
      event_id: payload.event_id,
      status: err.response?.status,
      data: err.response?.data || err.message,
    });
    throw err;
  }
}

/**
 * Trigger the Atenxion agent webhook when a vendor submits a proposal.
 * Only sends if proposal TriggerConfig exists with both apiUrl and triggerToken.
 */
async function triggerAgentOnProposalSubmit({
  tenderId,
  vendor,
  attachmentFilePath,
}) {
  const config = await getConfigForType(TRIGGER_TYPE_PROPOSAL);
  if (!config || !config.apiUrl || !config.triggerToken) {
    console.log(
      "[webhook] Proposal trigger config missing or incomplete – skipping",
    );
    return;
  }

  const eventId = `tender_proposal_event_${crypto.randomUUID()}`;
  const attachments = resolveAttachments(
    attachmentFilePath ? [attachmentFilePath] : [],
    config,
    "proposal trigger",
  );

  const payload = {
    event_id: eventId,
    triggerType: TRIGGER_TYPE_PROPOSAL,
    tenderId: String(tenderId),
    vendorId: vendor?._id?.toString(),
    vendorEmail: vendor?.email,
    vendorCompanyName: vendor?.profile?.companyName,
    vendorContactPerson: vendor?.profile?.contactPerson,
    vendorPhone: vendor?.profile?.phone,
    vendorAddress: vendor?.profile?.address,
    vendorCompanyDescription: vendor?.profile?.companyDescription,
    attachments: attachments,
    message:
      "What is this file about? Please analyze the data and provide a detailed report of this vendor proposal.",
  };

  return sendWebhook({ config, payload, label: "proposal trigger" });
}

/**
 * Trigger the Atenxion agent webhook when a company user creates a new tender.
 * Only sends if tender TriggerConfig exists with both apiUrl and triggerToken.
 */
async function triggerAgentOnTenderCreate({ tender }) {
  const config = await getConfigForType(TRIGGER_TYPE_TENDER);
  if (!config || !config.apiUrl || !config.triggerToken) {
    console.log(
      "[webhook] Tender trigger config missing or incomplete – skipping",
    );
    return;
  }

  const creatorId = tender.createdBy?._id || tender.createdBy;
  const createdBy = creatorId
    ? await User.findById(creatorId).select("email role profile").lean()
    : null;

  const eventId = `tender_create_event_${crypto.randomUUID()}`;
  const attachments = resolveAttachments(
    tender?.attachments || [],
    config,
    "tender create trigger",
  );

  const payload = {
    event_id: eventId,
    triggerType: TRIGGER_TYPE_TENDER,
    tenderId: String(tender._id),
    title: tender.title,
    category: tender.category,
    submissionDeadline: tender.deadline
      ? new Date(tender.deadline).toISOString()
      : null,
    description: tender.description,
    requirements: tender.requirements,
    attachments,
    companyUserId: createdBy?._id?.toString(),
    companyUserEmail: createdBy?.email,
    companyName: createdBy?.profile?.companyName,
    companyContactPerson: createdBy?.profile?.contactPerson,
    companyPhone: createdBy?.profile?.phone,
    companyAddress: createdBy?.profile?.address,
    companyDescription: createdBy?.profile?.companyDescription,
    message:
      "A new tender has been published. Please review the tender details and attached documents.",
  };

  return sendWebhook({ config, payload, label: "tender create trigger" });
}

/**
 * Trigger the Atenxion agent webhook when a proposal is awarded.
 * Uses the dedicated awarded trigger config (URL + token).
 * Payload: event_id, tenderId, vendorId, triggerType.
 */
async function triggerAgentOnProposalAwarded({ tenderId, vendorId }) {
  const config = await getConfigForType(TRIGGER_TYPE_AWARDED);
  if (!config || !config.apiUrl || !config.triggerToken) {
    console.log(
      "[webhook] Awarded trigger config missing or incomplete – skipping",
    );
    return;
  }

  const payload = {
    event_id: `tender_awarded_event_${crypto.randomUUID()}`,
    triggerType: TRIGGER_TYPE_AWARDED,
    tenderId: String(tenderId),
    vendorId: String(vendorId),
  };

  return sendWebhook({ config, payload, label: "awarded trigger" });
}

module.exports = {
  triggerAgentOnProposalSubmit,
  triggerAgentOnTenderCreate,
  triggerAgentOnProposalAwarded,
  TRIGGER_TYPE_PROPOSAL,
  TRIGGER_TYPE_TENDER,
  TRIGGER_TYPE_AWARDED,
};
