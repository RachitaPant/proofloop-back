const jwt = require('jsonwebtoken');

const EXPIRATION_MS = Number(process.env.JWT_EXPIRATION_MS || 86400000);

// Mirrors com.proofloop.util.JwtUtil — subject = email, "role" claim, HS256.
function generateToken(email, role) {
  return jwt.sign({ role }, process.env.JWT_SECRET, {
    subject: email,
    expiresIn: Math.floor(EXPIRATION_MS / 1000),
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
