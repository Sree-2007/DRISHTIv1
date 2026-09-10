const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { v4: uuid } = require('uuid');
const { validate } = require('../middleware/validate');
const redis = require('../config/redis');

module.exports = (prisma) => {
  const router = express.Router();

  const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    role: z.enum(['DRIVER', 'CITIZEN', 'POLICE', 'ADMIN']).default('CITIZEN')
  });

  router.post('/register', validate(registerSchema), async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role, trustScore: role === 'CITIZEN' || role === 'DRIVER' ? 50 : 100 }
    });
    const tokens = issueTokens(user);
    res.json({ ...tokens, user: publicUser(user) });
  });

  router.post('/login', validate(z.object({ email: z.string().email(), password: z.string() })), async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const tokens = issueTokens(user);
    res.json({ ...tokens, user: publicUser(user) });
  });

  router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing token' });
    const stored = redis.get(`refresh:${refreshToken}`);
    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return res.status(401).json({ error: 'User gone' });
      redis.del(`refresh:${refreshToken}`);
      res.json(issueTokens(user));
    } catch { res.status(401).json({ error: 'Expired' }); }
  });

  router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) redis.del(`refresh:${refreshToken}`);
    res.json({ ok: true });
  });

  function issueTokens(user) {
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = uuid();
    redis.set(`refresh:${refreshToken}`, user.id, 7 * 24 * 3600);
    return { accessToken, refreshToken };
  }

  function publicUser(u) {
    return { id: u.id, name: u.name, email: u.email, role: u.role, trustScore: u.trustScore };
  }

  return router;
};
