const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const agentRoutes = require("./routes/agentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const tenderRoutes = require("./routes/tenderRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const integrationRoutes = require("./routes/integrationRoutes");
const triggerRoutes = require("./routes/triggerRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000"
).split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads (public, no auth) ───────────────────────────────────────────
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(
    path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads"),
    {
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=3600");
      },
    },
  ),
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "demosourcing-api" }),
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/integration/trigger", triggerRoutes);
app.use("/api/integration", integrationRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
