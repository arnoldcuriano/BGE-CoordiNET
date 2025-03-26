const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const checkRole = (roles) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};



module.exports = checkRole;