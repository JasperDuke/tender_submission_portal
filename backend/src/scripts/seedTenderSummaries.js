/**
 * seedTenderSummaries.js – Seed static tender summaries for existing tenders
 *
 * Usage:
 *   node src/scripts/seedTenderSummaries.js
 *   npm run seed:summaries
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tender = require('../models/Tender');
const TenderSummary = require('../models/TenderSummary');
const { STATIC_TENDER_SUMMARY } = require('../utils/staticTenderSummary');

const seedTenderSummaries = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected\n');

    const tenders = await Tender.find().select('_id title');
    if (tenders.length === 0) {
      console.log('⏭️   No tenders found – nothing to seed.');
      return;
    }

    for (const tender of tenders) {
      const existing = await TenderSummary.findOne({ tenderId: tender._id });
      if (existing) {
        console.log(`⏭️   Skipped  → ${tender.title} (summary already exists)`);
        continue;
      }

      await TenderSummary.create({
        tenderId: tender._id,
        summary: STATIC_TENDER_SUMMARY,
      });
      console.log(`✅  Created  → ${tender.title}`);
    }

    console.log('\nTender summary seeding complete.\n');
  } catch (err) {
    console.error('❌  Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  MongoDB disconnected');
  }
};

seedTenderSummaries();
