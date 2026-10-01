const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

// Mirrors JwtAuthenticationFilter + UserDetailsServiceImpl: validates the
// bearer token, loads the user fresh from the DB, attaches it to req.user.
// Stateless — no session, auth is re-derived from the token on every request.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'Invalid or expired token',
    });
  }

  const user = await User.findOne({ email: payload.sub });
  if (!user) {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'User not found',
    });
  }

  req.user = user;
  next();
}

// Mirrors `.requestMatchers("/api/admin/**").hasRole("ADMIN")`.
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      timestamp: new Date().toISOString(),
      status: 403,
      error: 'Forbidden',
      message: 'Access denied',
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
