const mongoose = require('mongoose');

/**
 * Establishes a Mongoose connection to MongoDB.
 * Exits the process on failure so the container/PM2 can restart cleanly.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These are the recommended options for Mongoose 8+
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // Optional cleanup: migrate legacy Accepted → Awarded (runtime also treats Accepted as Awarded)
    const Proposal = require('../models/Proposal');
    const result = await Proposal.updateMany(
      { status: 'Accepted' },
      { $set: { status: 'Awarded' } },
    );
    if (result.modifiedCount > 0) {
      console.log(`✅  Migrated ${result.modifiedCount} proposal(s) from Accepted to Awarded`);
    }
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
