require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedData = require('./config/seed');
const errorHandler = require('./middleware/errorHandler');
const slaEscalationService = require('./services/slaEscalation.service');

const authRoutes = require('./routes/auth.routes');
const workflowRoutes = require('./routes/workflow.routes');
const requestRoutes = require('./routes/request.routes');
const adminRoutes = require('./routes/admin.routes');

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

// /api/auth/** is public; everything else requires a valid JWT (enforced
// per-router below), and /api/admin/** additionally requires ADMIN.
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 8080;

connectDB()
  .then(seedData)
  .then(() => {
    slaEscalationService.startScheduler();
    app.listen(PORT, () => console.log(`ProofLoop Express backend listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
