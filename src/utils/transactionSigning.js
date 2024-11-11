const crypto = require('crypto');
const secp256k1 = require('secp256k1');

class TransactionSigner {
  static generateKeyPair() {
    let privateKey;
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));

    const publicKey = secp256k1.publicKeyCreate(privateKey);
    
    return {
      privateKey: privateKey.toString('hex'),
      publicKey: Buffer.from(publicKey).toString('hex')
    };
  }

  static async signTransaction(transaction, privateKey) {
    const txHash = this.hashTransaction(transaction);
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    
    const signature = secp256k1.ecdsaSign(
      Buffer.from(txHash, 'hex'),
      privKeyBuffer
    );

    return {
      signature: Buffer.from(signature.signature).toString('hex'),
      recoveryId: signature.recid,
      hash: txHash
    };
  }

  static verifyTransaction(transaction, signature, publicKey) {
    try {
      const txHash = Buffer.from(this.hashTransaction(transaction), 'hex');
      const sigBuffer = Buffer.from(signature, 'hex');
      const pubKeyBuffer = Buffer.from(publicKey, 'hex');

      return secp256k1.ecdsaVerify(sigBuffer, txHash, pubKeyBuffer);
    } catch (error) {
      return false;
    }
  }

  static hashTransaction(transaction) {
    const txData = {
      ...transaction,
      timestamp: transaction.timestamp || Date.now()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(txData))
      .digest('hex');
  }
}

module.exports = { Encryption, ApiKeyManager, TransactionSigner };