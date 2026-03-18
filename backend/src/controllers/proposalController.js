const path = require('path');
const fs = require('fs');
const Proposal = require('../models/Proposal');
const Tender = require('../models/Tender');
const { sendEmail } = require('../services/emailService');
const { triggerAgentOnProposalSubmit } = require('../services/agentTriggerWebhook');

/**
 * POST /api/proposals
 * Role: vendor
 * Multipart/form-data with PDF file + body: { tenderId }
 */
const submitProposal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A PDF file is required' });
    }

    const { tenderId } = req.body;
    if (!tenderId) {
      return res.status(400).json({ success: false, message: 'tenderId is required' });
    }

    const tender = await Tender.findById(tenderId);
    if (!tender) return res.status(404).json({ success: false, message: 'Tender not found' });
    if (tender.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cannot submit to a closed tender' });
    }
    if (new Date() > tender.deadline) {
      return res.status(400).json({ success: false, message: 'Submission deadline has passed' });
    }

    const proposal = await Proposal.create({
      tenderId,
      vendorId: req.user._id,
      filePath: req.file.path,
      originalFileName: req.file.originalname,
    });

    // Trigger agent webhook (fire-and-forget; does not block response)
    triggerAgentOnProposalSubmit({
      tenderId,
      vendor: req.user,
      attachmentFilePath: req.file.path,
    }).catch((err) => {
      console.error('[webhook] Agent trigger failed (proposal still saved):', err.message);
    });

    // Notify company (tender creator) of new submission – recipient is the User who created the tender
    const tenderWithCreator = await Tender.findById(tenderId).populate('createdBy', 'email profile.companyName');
    const vendorName = req.user.profile?.companyName || req.user.profile?.contactPerson || req.user.email;
    const companyEmail = tenderWithCreator?.createdBy?.email?.trim?.();
    if (companyEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[email] Notifying company (tender creator):', companyEmail);
      }
      sendEmail({
        to: companyEmail,
        subject: `New proposal for: ${tender.title}`,
        html: `
          <p>A new proposal has been submitted for the tender <strong>${tender.title}</strong>.</p>
          <p><strong>Vendor:</strong> ${vendorName}</p>
          <p>Log in to the portal to review the submission.</p>
        `,
      });
    }

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals/my
 * Role: vendor
 * Lists the authenticated vendor's own proposals.
 */
const getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ vendorId: req.user._id })
      .populate('tenderId', 'title deadline status')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals/tender/:tenderId
 * Role: companyUser, admin
 * All proposals for a given tender.
 */
const getProposalsByTender = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ tenderId: req.params.tenderId })
      .populate('vendorId', 'email profile.companyName profile.contactPerson profile.phone profile.address')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: proposals.length, proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals/:id
 */
const getProposalById = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('tenderId', 'title deadline status')
      .populate('vendorId', 'email profile.companyName profile.contactPerson');

    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    // Vendors can only see their own proposals
    if (req.user.role === 'vendor' && proposal.vendorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/proposals/:id
 * Role: vendor (own proposals only)
 * Replace the uploaded PDF.
 */
const updateProposal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A new PDF file is required' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    if (proposal.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to update this proposal' });
    }

    if (['Accepted', 'Rejected'].includes(proposal.status)) {
      return res.status(400).json({ success: false, message: 'Cannot replace a proposal that has already been evaluated' });
    }

    // Delete old file
    if (fs.existsSync(proposal.filePath)) {
      fs.unlinkSync(proposal.filePath);
    }

    proposal.filePath = req.file.path;
    proposal.originalFileName = req.file.originalname;
    proposal.status = 'Pending'; // Reset to pending after replacement
    await proposal.save();

    res.status(200).json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/proposals/:id
 * Role: vendor (own proposals only)
 */
const deleteProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    if (proposal.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this proposal' });
    }

    // Delete file from disk
    if (fs.existsSync(proposal.filePath)) {
      fs.unlinkSync(proposal.filePath);
    }

    await proposal.deleteOne();
    res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/proposals/:id/status
 * Role: companyUser, admin
 * Body: { status, remarks, score }
 */
const updateProposalStatus = async (req, res, next) => {
  try {
    const { status, remarks, score } = req.body;
    const allowedStatuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected', 'Shortlisted'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    const proposal = await Proposal.findById(req.params.id)
      .populate('vendorId', 'email profile.companyName profile.contactPerson')
      .populate('tenderId', 'title');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const previousStatus = proposal.status;
    if (status) proposal.status = status;
    if (remarks !== undefined) proposal.remarks = remarks;
    if (score !== undefined) proposal.score = score;

    await proposal.save();

    // Notify vendor when status changes to Accepted or Rejected – recipient is the User (vendor) who submitted
    const vendorEmail = proposal.vendorId?.email?.trim?.();
    if (
      status &&
      ['Accepted', 'Rejected'].includes(status) &&
      status !== previousStatus &&
      vendorEmail
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[email] Notifying vendor:', vendorEmail);
      }
      const tenderTitle = proposal.tenderId?.title || 'Tender';
      sendEmail({
        to: vendorEmail,
        subject: status === 'Accepted' ? `Proposal accepted: ${tenderTitle}` : `Proposal update: ${tenderTitle}`,
        html:
          status === 'Accepted'
            ? `
          <p>Your proposal for <strong>${tenderTitle}</strong> has been <strong>accepted</strong>.</p>
          ${proposal.remarks ? `<p><strong>Remarks:</strong> ${proposal.remarks}</p>` : ''}
          <p>Log in to the portal to view details.</p>
        `
            : `
          <p>Your proposal for <strong>${tenderTitle}</strong> was not accepted.</p>
          ${proposal.remarks ? `<p><strong>Remarks:</strong> ${proposal.remarks}</p>` : ''}
          <p>Log in to the portal to view details.</p>
        `,
      });
    }

    res.status(200).json({ success: true, proposal });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitProposal,
  getMyProposals,
  getProposalsByTender,
  getProposalById,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
};
