const QRCode = require('qrcode');
const crypto = require('crypto');

class QRCodeGenerator {
  static async generatePaymentQR(merchantData) {
    try {
      const payload = this.createPayloadData(merchantData);
      const signature = this.signPayload(payload);
      
      const qrData = {
        ...payload,
        sig: signature
      };

      const qrCodeOptions = {
        errorCorrectionLevel: 'H',
        type: 'svg',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      };

      const qrCode = await QRCode.toString(JSON.stringify(qrData), qrCodeOptions);
      return qrCode;
    } catch (error) {
      throw new Error('QR code generation failed');
    }
  }

  static createPayloadData(merchantData) {
    const { merchantId, amount, currency, merchantName } = merchantData;
    
    return {
      v: 1, // version
      t: Date.now(), // timestamp
      m: merchantId,
      n: merchantName,
      a: amount,
      c: currency,
      r: crypto.randomBytes(8).toString('hex') // nonce
    };
  }

  static signPayload(payload) {
    const signatureKey = process.env.QR_SIGNATURE_KEY;
    return crypto
      .createHmac('sha256', signatureKey)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  static verifyQRCode(qrData) {
    try {
      const { sig, ...payload } = JSON.parse(qrData);
      const calculatedSignature = this.signPayload(payload);
      
      if (sig !== calculatedSignature) {
        throw new Error('Invalid QR code signature');
      }

      // Check if QR code has expired (15 minutes)
      const timestamp = payload.t;
      const now = Date.now();
      if (now - timestamp > 15 * 60 * 1000) {
        throw new Error('QR code has expired');
      }

      return payload;
    } catch (error) {
      throw new Error('QR code verification failed');
    }
  }
}