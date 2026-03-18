/**
 * seed.js – Default user seeder
 * ─────────────────────────────
 * Creates 3 default accounts (Admin, Company User, Vendor) if they
 * do not already exist. Safe to re-run — existing accounts are skipped.
 *
 * Usage:
 *   node src/scripts/seed.js          (uses .env in repo root)
 *   npm run seed
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// ── Default accounts ──────────────────────────────────────────────────────────

const DEFAULT_USERS = [
  {
    email: "admin@demo.com",
    password: "admin123",
    role: "admin",
    profile: {
      displayName: "Admin",
      companyName: "Atenxion",
      contactPerson: "System Administrator",
      phone: "+65 6000 0001",
      address: "Singapore",
    },
  },
  {
    email: "company@demo.com",
    password: "company123",
    role: "companyUser",
    profile: {
      displayName: "Company User",
      companyName: "Syarikat Demo Sdn Bhd",
      contactPerson: "Ahmad Zulkifli",
      phone: "+60 3-1234 5678",
      address: "Petaling Jaya, Selangor, Malaysia",
      companyDescription:
        "A demo company account for testing Company User workflows.",
    },
  },
  {
    email: "vendor@demo.com",
    password: "vendor123",
    role: "vendor",
    profile: {
      displayName: "Vendor",
      companyName: "Vendor Utama Enterprise",
      contactPerson: "Siti Nurul Ain",
      phone: "+60 12-345 6789",
      address: "George Town, Pulau Pinang, Malaysia",
      companyDescription:
        "A demo vendor account for testing proposal submission workflows.",
    },
  },
];

// ── Seed logic ────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  MongoDB connected\n");

    for (const userData of DEFAULT_USERS) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        console.log(
          `⏭️   Skipped  → ${userData.email}  (already exists, role: ${existing.role})`,
        );
        continue;
      }

      const user = new User({
        email: userData.email,
        passwordHash: userData.password, // pre-save hook will hash this
        role: userData.role,
        isActive: true,
        profile: userData.profile,
      });

      await user.save();
      console.log(
        `✅  Created  → ${userData.email}  (role: ${userData.role})  password: ${userData.password}`,
      );
    }

    console.log("\n─────────────────────────────────────────────\n");
    console.log("Seeding complete. You can now log in with:\n");
    DEFAULT_USERS.forEach((u) => {
      console.log(`  [${u.role.padEnd(11)}]  ${u.email}  /  ${u.password}`);
    });
    console.log("");
  } catch (err) {
    console.error("❌  Seed error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌  MongoDB disconnected");
  }
};

seed();
