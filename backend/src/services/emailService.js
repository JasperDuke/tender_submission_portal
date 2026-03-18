const nodemailer = require("nodemailer");

/**
 * Email service using nodemailer.
 * Configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 * If not configured, sendEmail no-ops (logs to console in development).
 */
let transporter = null;

function initTransporter() {
  if (transporter !== null) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email notifications disabled.",
      );
    }
    transporter = false;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send an email. Returns true if sent, false if skipped (not configured).
 * Errors are logged but not thrown.
 */
async function sendEmail({ to, subject, html, text }) {
  const trans = initTransporter();
  const from = process.env.SMTP_USER;

  if (!trans) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] Would send:", { to, subject });
    }
    return false;
  }

  try {
    await trans.sendMail({
      from,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]*>/g, "") : ""),
    });
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err.message);
    return false;
  }
}

module.exports = { sendEmail, initTransporter };
