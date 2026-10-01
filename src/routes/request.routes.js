const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const requestService = require('../services/request.service');

const router = Router();
router.use(requireAuth);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('workflowId').notEmpty().withMessage('Workflow ID is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      res.json(await requestService.createRequest(req.user, req.body));
    } catch (err) {
      next(err);
    }
  },
);

router.get('/mine', async (req, res, next) => {
  try {
    res.json(await requestService.getMyRequests(req.user));
  } catch (err) {
    next(err);
  }
});

router.get('/pending', async (req, res, next) => {
  try {
    res.json(await requestService.getPendingRequests(req.user));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await requestService.getRequestById(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    res.json(await requestService.approveRequest(req.user, req.params.id, req.body?.comment));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    res.json(await requestService.rejectRequest(req.user, req.params.id, req.body?.comment));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
