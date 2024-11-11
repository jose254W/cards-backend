// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ msg: 'Invalid or expired token' });
      }

      // Ensure _id is set from token payload (assuming `userId` holds the user identifier in token)
      req.user = { _id: decoded.userId };

      // Optional: Log the decoded token payload for debugging
      // console.log("Decoded token payload:", decoded);

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = authenticateToken;
