const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, unique: true },
  businessType: { type: String, required: true },
  kybVerified: { type: Boolean, default: false },
  smartPayBalance: { type: Number, default: 0 },
  localCurrencyBalance: { type: Number, default: 0 },
  documents: [{
    type: { type: String },
    url: { type: String },
    verified: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Merchant', merchantSchema);
