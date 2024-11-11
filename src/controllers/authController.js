const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const { validationResult } = require('express-validator');
const { generateWalletAddress } = require('../utils/wallet');

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phoneNumber,idNumber } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const walletAddress = generateWalletAddress();
    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      idNumber,
      walletAddress
    });

    await user.save();

    const token = jwt.sign(
      { userId: user.id, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.registerMerchant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, businessName, businessType } = req.body;

    let merchant = await Merchant.findOne({ email });
    if (merchant) {
      return res.status(400).json({ msg: 'Merchant already exists' });
    }

    const walletAddress = generateWalletAddress();
    const hashedPassword = await bcrypt.hash(password, 10);

    merchant = new Merchant({
      email,
      password: hashedPassword,
      businessName,
      businessType,
      walletAddress
    });

    await merchant.save();

    const token = jwt.sign(
      { userId: merchant.id, type: 'merchant' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  // console.log('Received login request:', req.body); // Log incoming request data

  try {
    const { email, password } = req.body;

    // Try to find user first
    let user = await User.findOne({ email });
    let type = 'user';

    // If not found, try to find merchant
    if (!user) {
      user = await Merchant.findOne({ email });
      type = 'merchant';
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};