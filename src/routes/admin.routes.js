const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const analyticsService = require('../services/analytics.service');
const requestService = require('../services/request.service');
const slaEscalationService = require('../services/slaEscalation.service');

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/analytics', async (_req, res, next) => {
  try {
    res.json(await analyticsService.getAnalytics());
  } catch (err) {
    next(err);
  }
});

router.get('/requests', async (_req, res, next) => {
  try {
    res.json(await requestService.getAllRequests());
  } catch (err) {
    next(err);
  }
});

router.post('/trigger-sla-check', async (_req, res, next) => {
  try {
    await slaEscalationService.checkAndEscalateRequests();
    res.json({ message: 'SLA escalation check triggered' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
