const { check, validationResult } = require('express-validator');

const validateAuth = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateAuth
};