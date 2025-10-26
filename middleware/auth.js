const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET;

async function authMiddleware(req, res, next){
  const auth = req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'invalid token' });
    req.user = user;
    next();
  } catch(err){
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { authMiddleware };
