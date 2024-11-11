// src/routes/merchant.js
const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const authenticateToken = require('../middleware/auth');


// console.log(merchantController); // This should display each method as a function
// console.log(authenticateToken);
// Routes
router.post('/kyb/submit', authenticateToken, merchantController.submitKYB);
router.post('/pos/register', authenticateToken, merchantController.registerPOS);
router.post('/qr/generate', authenticateToken, merchantController.generateQR);
router.get('/transactions', authenticateToken, merchantController.getTransactions);
router.get('/daily-sales', authenticateToken, merchantController.getDailySales);

module.exports = router;