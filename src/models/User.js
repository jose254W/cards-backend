const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  idNumber: { type: String, required: true },
  walletAddress: { type: String, unique: true },
  smartPayBalance: { type: Number, default: 0 },
  localCurrencyBalance: { type: Number, default: 0 },
  kycVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
