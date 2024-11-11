const crypto = require('crypto');
const { promisify } = require('util');

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const keyLength = 32;
const pbkdf2Iterations = 100000;

const pbkdf2Promise = promisify(crypto.pbkdf2);

class Encryption {
  static async generateKey(password, salt) {
    return pbkdf2Promise(password, salt, pbkdf2Iterations, keyLength, 'sha512');
  }

  static async encrypt(data, secretKey) {
    try {
      const salt = crypto.randomBytes(saltLength);
      const iv = crypto.randomBytes(ivLength);
      const key = await this.generateKey(secretKey, salt);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  static async decrypt(encryptedData, secretKey) {
    try {
      const { encrypted, iv, salt, tag } = encryptedData;
      
      const key = await this.generateKey(secretKey, Buffer.from(salt, 'base64'));
      const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}