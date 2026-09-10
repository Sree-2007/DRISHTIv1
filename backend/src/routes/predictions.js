const express = require('express');
const { auth } = require('../middleware/auth');
const { runPrediction } = require('../services/prediction');

module.exports = (prisma, io) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const preds = await prisma.hazardPrediction.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { zone: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(preds);
  });

  router.post('/generate', auth(['ADMIN', 'POLICE']), async (req, res) => {
    const created = await runPrediction(prisma, io);
    res.json(created);
  });

  return router;
};
