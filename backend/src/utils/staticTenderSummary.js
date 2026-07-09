/**
 * Static sample summary content used for initial tenderSummary seeding.
 * Replace with AI-generated data later via POST /api/tender-summaries.
 */
const STATIC_TENDER_SUMMARY = {
  boqSummary: {
    title: 'Bill of Quantities Summary',
    overall:
      'The BOQ covers structural works, MEP installations, and finishing items. Total estimated scope aligns with the published tender budget and timeline.',
    conclusion:
      'Quantities are largely consistent with tender specifications. Minor clarifications may be needed on electrical fittings and finishing schedules.',
  },
  historicalSummary: {
    title: 'Historical Performance Summary',
    overall:
      'Comparable vendors have delivered 3 similar infrastructure projects in the past 24 months, with an average on-time completion rate of 92%.',
    conclusion:
      'Strong track record in projects of similar scale and complexity. Recommended for further technical and commercial evaluation.',
  },
};

module.exports = { STATIC_TENDER_SUMMARY };
