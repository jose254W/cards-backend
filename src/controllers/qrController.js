const QRCodeGenerator = require('../utils/qrCode');
const Merchant = require('../models/Merchant');

exports.generatePaymentQR = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const merchantId = req.user.id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ msg: 'Merchant not found' });
    }

    const merchantData = {
      merchantId,
      merchantName: merchant.businessName,
      amount,
      currency
    };

    const qrCode = await QRCodeGenerator.generatePaymentQR(merchantData);
    
    res.json({
      qrCode,
      expiresIn: '15 minutes'
    });
  } catch (error) {
    console.error('QR Generation Error:', error);
    res.status(500).json({ msg: 'Failed to generate QR code' });
  }
};

exports.verifyPaymentQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    const payloadData = await QRCodeGenerator.verifyQRCode(qrData);
    
    res.json({
      verified: true,
      paymentData: payloadData
    });
  } catch (error) {
    res.status(400).json({
      verified: false,
      error: error.message
    });
  }
};

module.exports = { QRCodeGenerator };