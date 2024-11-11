const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAYMENT'],
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    required: true
  },
  senderType: {
    type: String,
    enum: ['User', 'Merchant'],
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'receiverType',
    required: true
  },
  receiverType: {
    type: String,
    enum: ['User', 'Merchant', 'Self'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: ['SMART_PAY', 'LOCAL_CURRENCY'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);