const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authService = require('../services/auth.service');

const router = Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['USER', 'REVIEWER', 'ADMIN']).withMessage('Role is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
