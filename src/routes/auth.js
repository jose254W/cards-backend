const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register/user',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('phoneNumber').notEmpty(),
    body('idNumber').notEmpty()

  ],
  authController.registerUser
);

router.post('/register/merchant',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('businessName').notEmpty(),
    body('businessType').notEmpty()
  ],
  authController.registerMerchant
);

router.post('/login', authController.login);

module.exports = router;  // Make sure this line is present