const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const authenticateToken = require('../middleware/auth');



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
router.post('/pay',authenticateToken, async (req, res) => {
  try {
    const { amount, currency, merchantId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const merchant = await Merchant.findById(merchantId);

    if (!user || !merchant) {
      return res.status(404).json({ msg: 'User or merchant not found' });
    }

    const userBalance = currency === 'SMART_PAY' ? user.smartPayBalance : user.localCurrencyBalance;
    if (userBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient funds' });
    }

    const transaction = new Transaction({
      transactionType: 'PAYMENT',
      sender: userId,
      senderType: 'User',
      receiver: merchantId,
      receiverType: 'Merchant',
      amount,
      currency
    });

    await transaction.save();

    if (currency === 'SMART_PAY') {
      user.smartPayBalance -= amount;
      merchant.smartPayBalance += amount;
    } else {
      user.localCurrencyBalance -= amount;
      merchant.localCurrencyBalance += amount;
    }

    await user.save();
    await merchant.save();

    res.json({ msg: 'Payment successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
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
