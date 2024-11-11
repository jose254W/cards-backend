const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Merchant = require('../models/Merchant');

exports.deposit = async (req, res) => {
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
};
