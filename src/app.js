const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const workflowRoutes = require('./routes/workflow.routes');
const requestRoutes = require('./routes/request.routes');
const adminRoutes = require('./routes/admin.routes');
const slaEscalationService = require('./services/slaEscalation.service');

const app = express();

// Mirrors SecurityConfig's CorsConfigurationSource.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
    credentials: true,
  }),
);

app.use(express.json());

// Every request needs a live DB connection; connectDB() is cached, so this
// is a no-op after the first (warm) invocation on serverless platforms.
app.use((req, res, next) => {
  connectDB().then(() => next(), next);
});

// /api/auth/** is public; everything else requires a valid JWT (enforced
// per-router below), and /api/admin/** additionally requires ADMIN.
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Unauthenticated-but-secret-gated hook for Vercel Cron (which can only send
// scheduled GET requests, not a user's JWT). Set CRON_SECRET and point a
// Vercel Cron Job at this path on an hourly schedule — see vercel.json.
// On Render/local, the in-process setInterval scheduler covers this instead.
app.get('/api/cron/sla-escalation', async (req, res, next) => {
  const expected = process.env.CRON_SECRET;
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || provided !== expected) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const escalatedCount = await slaEscalationService.checkAndEscalateRequests();
    res.json({ message: 'SLA escalation check triggered', escalatedCount });
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

module.exports = app;
