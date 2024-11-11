const Merchant = require('../models/Merchant');

// Helper function for KYB verification
const startKYBVerification = async (merchantId) => {
  try {
    // Your KYB verification logic here
    // This could involve calling a third-party KYB service
    console.log(`Starting KYB verification for merchant: ${merchantId}`);
  } catch (error) {
    console.error('KYB Verification Error:', error);
  }
};

exports.submitKYB = async (req, res) => {
  try {
    const { documents } = req.body;
    const merchantId = req.user.id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ msg: 'Merchant not found' });
    }

    merchant.documents = documents;
    await merchant.save();

    // Trigger KYB verification process (async)
    startKYBVerification(merchantId);

    res.json({ msg: 'KYB documents submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.registerPOS = async (req, res) => {
  try {
    const { posId, location } = req.body;
    const merchantId = req.user.id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ msg: 'Merchant not found' });
    }

    // Add POS device to merchant's devices array
    merchant.posDevices.push({ posId, location });
    await merchant.save();

    res.json({ msg: 'POS device registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.generateQR = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const merchantId = req.user.id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ msg: 'Merchant not found' });
    }

    // Generate a unique QR code with payment information
    const qrData = {
      merchantId,
      amount,
      description,
      timestamp: Date.now(),
      // Add any other necessary payment information
    };

    // You might want to add a QR code generation library here
    // For now, just returning the data that would be encoded
    res.json({ 
      msg: 'QR code generated successfully',
      qrData 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { merchantId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getDailySales = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { 
      merchantId,
      status: 'completed' // Assuming you have a status field
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dailySales = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({ dailySales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};