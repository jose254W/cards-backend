const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const authenticateToken = require('../middleware/auth');
const { body, validationResult } = require('express-validator');



// Deposit route
router.post('/deposit',authenticateToken, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const transaction = new Transaction({
      transactionType: 'DEPOSIT',
      sender: userId,
      senderType: 'User',
      receiver: userId,
      receiverType: 'User',
      amount,
      currency
    });

    await transaction.save();

    if (currency === 'SMART_PAY') {
      user.smartPayBalance += amount;
    } else {
      user.localCurrencyBalance += amount;
    }

    await user.save();

    res.json({
      msg: 'Deposit successful',
      balance: currency === 'SMART_PAY' ? user.smartPayBalance : user.localCurrencyBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Withdraw route
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentBalance = currency === 'SMART_PAY' ? user.smartPayBalance : user.localCurrencyBalance;
    if (currentBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    const transaction = new Transaction({
      transactionType: 'WITHDRAW',
      sender: userId,
      senderType: 'User',
      receiver: userId,  
      receiverType: 'Self', 
      amount: -amount,
      currency
    });
    

    await transaction.save();

    if (currency === 'SMART_PAY') {
      user.smartPayBalance -= amount;
    } else {
      user.localCurrencyBalance -= amount;
    }

    await user.save();

    res.json({
      msg: 'Withdrawal successful',
      balance: currency === 'SMART_PAY' ? user.smartPayBalance : user.localCurrencyBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Transfer route
router.post('/transfer',authenticateToken, async (req, res) => {
  try {
    const { amount, currency, recipientId } = req.body;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const senderBalance = currency === 'SMART_PAY' ? sender.smartPayBalance : sender.localCurrencyBalance;
    if (senderBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    const transaction = new Transaction({
      transactionType: 'TRANSFER',
      sender: senderId,
      senderType: 'User',
      receiver: recipientId,
      receiverType: 'User',
      amount,
      currency
    });

    await transaction.save();

    if (currency === 'SMART_PAY') {
      sender.smartPayBalance -= amount;
      recipient.smartPayBalance += amount;
    } else {
      sender.localCurrencyBalance -= amount;
      recipient.localCurrencyBalance += amount;
    }

    await sender.save();
    await recipient.save();

    res.json({ msg: 'Transfer successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Payment route

const validatePaymentRequest = [
  body('merchantId').notEmpty().isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('currency').isIn(['SMART_PAY', 'LOCAL'])
];

router.post('/pay', 
  authenticateToken,
  validatePaymentRequest,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Invalid input',
        errors: errors.array() 
      });
    }

    // Start a transaction session
    const session = await startSession();
    session.startTransaction();

    try {
      const { amount, currency, merchantId } = req.body;
      const userId = req.user._id;

      // Fetch user and merchant in parallel
      const [user, merchant] = await Promise.all([
        User.findById(userId).session(session),
        Merchant.findById(merchantId).session(session)
      ]);

      if (!user) {
        throw new Error('User not found');
      }
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Determine which balance to use
      const balanceField = currency === 'SMART_PAY' ? 'smartPayBalance' : 'localCurrencyBalance';
      
      if (user[balanceField] < amount) {
        throw new Error('Insufficient funds');
      }

      // Create transaction record
      const transaction = new Transaction({
        transactionType: 'PAYMENT',
        sender: userId,
        senderType: 'User',
        receiver: merchantId,
        receiverType: 'Merchant',
        amount,
        currency,
        status: 'COMPLETED',
        timestamp: new Date()
      });

      // Update balances
      user[balanceField] -= amount;
      merchant[balanceField] += amount;

      // Save all changes in parallel
      await Promise.all([
        transaction.save({ session }),
        user.save(),
        merchant.save()
      ]);

      // Commit the transaction
      await session.commitTransaction();

      // Send success response
      res.json({ 
        msg: 'Payment successful',
        transactionId: transaction._id,
        newBalance: user[balanceField]
      });

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();

      // Handle specific errors
      if (error.message === 'Insufficient funds') {
        return res.status(400).json({ msg: error.message });
      }
      if (error.message === 'User not found' || error.message === 'Merchant not found') {
        return res.status(404).json({ msg: error.message });
      }

      // Log unexpected errors
      console.error('Payment error:', error);
      res.status(500).json({ msg: 'Server error' });
    } finally {
      session.endSession();
    }
});
// Get balance route
router.get('/balance',authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      smartPayBalance: user.smartPayBalance,
      localCurrencyBalance: user.localCurrencyBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get transactions route
router.get('/transactions',authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ date: -1 });

    res.json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
