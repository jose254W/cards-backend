// File: src/utils/wallet.js
const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const bs58 = require('bs58');
// console.log(bs58);  // Check for the presence of encode/decode functions

class WalletUtils {
  static generateWalletAddress() {
    // Generate a private key
    let privateKey;
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));

    // Generate public key from private key
    const publicKey = secp256k1.publicKeyCreate(privateKey);

    // Generate address from public key (similar to Bitcoin/Ethereum style)
    const sha256Hash = crypto.createHash('sha256').update(publicKey).digest();
    const ripemd160Hash = crypto.createHash('ripemd160').update(sha256Hash).digest();

    // Add version byte in front (0x00 for mainnet)
    const versionByte = Buffer.from([0x00]);
    const versionedHash = Buffer.concat([versionByte, ripemd160Hash]);

    // Create checksum
    const checksum = crypto
      .createHash('sha256')
      .update(
        crypto.createHash('sha256').update(versionedHash).digest()
      )
      .digest()
      .slice(0, 4);

    // Add checksum to versioned hash
    const binaryAddress = Buffer.concat([versionedHash, checksum]);

    // Encode to base58
    const walletAddress = 'SP' + bs58.encode(Buffer.from(binaryAddress));

    return walletAddress;
  }

  static validateWalletAddress(address) {
    try {
      // Check prefix
      if (!address.startsWith('SP')) {
        return false;
      }

      // Decode from base58
      const decoded = bs58.decode(address.slice(2));
      console.log(bs58);

      // Check length
      if (decoded.length !== 25) {
        return false;
      }

      // Verify checksum
      const versionedHash = decoded.slice(0, 21);
      const checksum = decoded.slice(21);
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(
          crypto.createHash('sha256').update(versionedHash).digest()
        )
        .digest()
        .slice(0, 4);

      return Buffer.compare(checksum, calculatedChecksum) === 0;
    } catch (error) {
      return false;
    }
  }

  static generateWalletKeyPair() {
    let privateKey;
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));

    const publicKey = secp256k1.publicKeyCreate(privateKey);
    const address = this.generateWalletAddress();

    return {
      privateKey: privateKey.toString('hex'),
      publicKey: Buffer.from(publicKey).toString('hex'),
      address
    };
  }
}

module.exports = {
  generateWalletAddress: WalletUtils.generateWalletAddress,
  validateWalletAddress: WalletUtils.validateWalletAddress,
  generateWalletKeyPair: WalletUtils.generateWalletKeyPair
};