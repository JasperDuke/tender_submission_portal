const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const TriggerConfig = require("../models/TriggerConfig");

/**
 * Trigger the Atenxion agent webhook when a vendor submits a proposal.
 * Only sends if TriggerConfig exists with both apiUrl and triggerToken.
 *
 * @param {Object} params
 * @param {string} params.tenderId - Tender _id
 * @param {Object} params.vendor - Vendor user (with profile)
 * @param {string} params.attachmentFilePath - File path from multer (e.g. uploads/xyz.pdf)
 */
async function triggerAgentOnProposalSubmit({
  tenderId,
  vendor,
  attachmentFilePath,
}) {
  const config = await TriggerConfig.findOne();
  if (!config || !config.apiUrl || !config.triggerToken) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[webhook] Trigger config missing or incomplete – skipping agent trigger",
      );
    }
    return;
  }

  const eventId = `tender_proposal_event_${crypto.randomUUID()}`;

  const baseUrl = (process.env.API_PUBLIC_URL || "").replace(/\/$/, "");
  const filename = attachmentFilePath
    ? path.basename(attachmentFilePath)
    : null;
  const attachmentUrl =
    baseUrl && filename ? `${baseUrl}/uploads/${filename}` : null;

  const attachments = attachmentUrl ? [attachmentUrl] : [];

  const payload = {
    event_id: eventId,
    tenderId: String(tenderId),
    vendor: {
      id: vendor?._id?.toString(),
      email: vendor?.email,
      companyName: vendor?.profile?.companyName,
      contactPerson: vendor?.profile?.contactPerson,
      phone: vendor?.profile?.phone,
      address: vendor?.profile?.address,
      companyDescription: vendor?.profile?.companyDescription,
    },
    attachments,
    message:
      "What is this file about? Please analyze the data and provide a detailed report of this vendor proposal.",
  };

  try {
    const response = await axios.post(config.apiUrl, payload, {
      headers: {
        Authorization: config.triggerToken,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[webhook] Agent triggered successfully:",
        eventId,
        response.data,
      );
    }
    return response.data;
  } catch (err) {
    console.error(
      "[webhook] Failed to trigger agent:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

module.exports = { triggerAgentOnProposalSubmit };
