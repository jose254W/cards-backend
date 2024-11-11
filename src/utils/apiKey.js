const crypto = require('crypto');
const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  name: { type: String, required: true },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

class ApiKeyManager {
  static async generateApiKey(merchantId, name, permissions, expiresInDays = 365) {
    const key = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await ApiKey.create({
      key: hashedKey,
      merchantId,
      name,
      permissions,
      expiresAt
    });

    return key;
  }

  static async validateApiKey(key) {
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await ApiKey.findOneAndUpdate(
      { 
        key: hashedKey,
        isActive: true,
        expiresAt: { $gt: new Date() }
      },
      { lastUsed: new Date() },
      { new: true }
    ).populate('merchantId');

    return apiKey;
  }

  static async revokeApiKey(key) {
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    await ApiKey.findOneAndUpdate(
      { key: hashedKey },
      { isActive: false }
    );
  }
}