const jwt = require('jsonwebtoken');

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(payload.role))
        return res.status(403).json({ error: 'Forbidden' });
      req.user = payload;
      next();
    } catch { return res.status(401).json({ error: 'Invalid token' }); }
  };
}

module.exports = { auth };
