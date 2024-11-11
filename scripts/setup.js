const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const generateSecureKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const setupEnvironment = () => {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `
PORT=5000
MONGODB_URI=mongodb+srv://josewawe75:9C8rDvLXLw86uNhP@cluster0.ac2er.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=${generateSecureKey()}
QR_SIGNATURE_KEY=${generateSecureKey()}
ENCRYPTION_SECRET=${generateSecureKey()}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
NODE_ENV=development
    `.trim();

    fs.writeFileSync(envPath, envContent);
    console.log('Environment file created successfully');
  }
};

const createDirectories = () => {
  const dirs = [
    'src/controllers',
    'src/models',
    'src/routes',
    'src/middleware',
    'src/utils',
    'src/config',
    'logs'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

const init = () => {
  try {
    setupEnvironment();
    createDirectories();
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

init();