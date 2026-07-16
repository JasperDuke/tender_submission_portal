/**
 * Static sample summary content used for initial tenderSummary seeding.
 * Replace with AI-generated data later via POST /api/tender-summaries.
 */
const STATIC_TENDER_SUMMARY = {
  boqSummary: {
    vendors: [
      {
        vendorName: 'Allied',
        matchStatus: 'Mostly Matched',
        scopeCoverage: [
          { metric: 'Matched Items', result: '23' },
          { metric: 'Missing Items', result: '0' },
          { metric: 'Additional Items', result: '0' },
          { metric: 'Quantity Differences', result: '2' },
        ],
        coverageSummary:
          'The proposal covers the complete core Tender BOQ scope including Site Office works, Guard House works, lighting, earthing, socket outlets and distribution boards.',
        keyDifferences: [
          'Several BOQ descriptions are abbreviated compared with the Tender BOQ.',
          'Some BOQ numbering is duplicated or split across multiple entries.',
          'BOQ presentation is less detailed than the Tender schedule.',
        ],
      },
      {
        vendorName: 'YUSEN',
        matchStatus: 'Fully Matched',
        scopeCoverage: [
          { metric: 'Matched Items', result: '25' },
          { metric: 'Missing Items', result: '0' },
          { metric: 'Additional Items', result: '1' },
          { metric: 'Quantity Differences', result: '0' },
        ],
        coverageSummary:
          'YUSEN submitted a comprehensive BOQ aligned closely with the tender schedule, including all primary MEP and civil scope items with consistent numbering.',
        keyDifferences: [
          'One additional optional item included under finishing works.',
          'Descriptions follow tender wording with minimal abbreviation.',
        ],
      },
    ],
    overall:
      'Both vendors cover the core tender scope. Allied shows minor presentation gaps and two quantity variances, while YUSEN demonstrates stronger alignment with tender BOQ structure and completeness.',
    conclusion:
      'From a BOQ coverage perspective, YUSEN is technically stronger on completeness and schedule alignment. Allied remains acceptable but may require clarification on abbreviated descriptions and quantity differences before award.',
  },
  historicalSummary: {
    vendors: [
      {
        vendorName: 'Allied',
        pricingOverview: [
          { metric: 'Compared Items', count: 23 },
          { metric: 'Above Historical', count: 3 },
          { metric: 'Comparable', count: 18 },
          { metric: 'Below Historical', count: 2 },
          { metric: 'No Historical Rate', count: 0 },
        ],
        aboveHistorical: [
          {
            item: 'A17',
            vendorPrice: 'RM1,064.00',
            historicalPrice: 'RM984.00',
            variance: '+8.13%',
          },
        ],
        comparableHistorical: [
          {
            item: 'A10',
            vendorPrice: 'RM120.00',
            historicalPrice: 'RM118.00',
            variance: '+1.69%',
          },
          {
            item: 'A2',
            vendorPrice: 'RM85.00',
            historicalPrice: 'RM84.50',
            variance: '+0.59%',
          },
          {
            item: 'A1',
            vendorPrice: 'RM65.00',
            historicalPrice: 'RM65.00',
            variance: '0.00%',
          },
        ],
        noHistoricalRate: [
          {
            item: 'Custom DB Label',
            vendorPrice: 'RM45.00',
            historicalPrice: '—',
            variance: '—',
          },
        ],
        belowHistorical: [
          {
            item: 'Neutral Link Box',
            vendorPrice: 'RM11.20',
            historicalPrice: 'RM14.20',
            variance: '-21.13%',
          },
          {
            item: 'Cable DB Office - DB1',
            vendorPrice: 'RM495.00',
            historicalPrice: 'RM550.00',
            variance: '-10.00%',
          },
        ],
        commercialObservation:
          'Most pricing aligns closely with historical benchmark. Only a small number of items exceed historical rates, concentrated in electrical fittings and cabling.',
      },
      {
        vendorName: 'YUSEN',
        pricingOverview: [
          { metric: 'Compared Items', count: 25 },
          { metric: 'Above Historical', count: 1 },
          { metric: 'Comparable', count: 21 },
          { metric: 'Below Historical', count: 3 },
          { metric: 'No Historical Rate', count: 0 },
        ],
        aboveHistorical: [
          {
            item: 'Guard House Lighting',
            vendorPrice: 'RM2,450.00',
            historicalPrice: 'RM2,280.00',
            variance: '+7.46%',
          },
        ],
        comparableHistorical: [
          {
            item: 'B2',
            vendorPrice: 'RM210.00',
            historicalPrice: 'RM209.00',
            variance: '+0.48%',
          },
          {
            item: 'B1',
            vendorPrice: 'RM180.00',
            historicalPrice: 'RM179.50',
            variance: '+0.28%',
          },
        ],
        noHistoricalRate: [],
        belowHistorical: [
          {
            item: 'Site Office Earthing',
            vendorPrice: 'RM3,800.00',
            historicalPrice: 'RM4,150.00',
            variance: '-8.43%',
          },
          {
            item: 'Socket Outlet - Office',
            vendorPrice: 'RM68.00',
            historicalPrice: 'RM75.00',
            variance: '-9.33%',
          },
        ],
        commercialObservation:
          'YUSEN pricing is predominantly at or below historical benchmark, with only one minor item above historical rate.',
      },
    ],
    overall:
      'Across both vendors, the majority of line items are commercially comparable to historical rates. Allied has slightly more items above benchmark, while YUSEN shows a more favourable overall pricing profile.',
    conclusion:
      'Commercially, YUSEN presents the stronger value proposition with fewer above-benchmark items and broader below-historical pricing. Allied remains competitive but warrants review on the elevated electrical and cabling rates before final award.',
  },
};

module.exports = { STATIC_TENDER_SUMMARY };
