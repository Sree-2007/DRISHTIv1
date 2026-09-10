const express = require('express');
const { auth } = require('../middleware/auth');

module.exports = (prisma, io) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const signals = await prisma.trafficSignal.findMany({ include: { zone: true } });
    res.json(signals);
  });

  router.get('/:id', async (req, res) => {
    const s = await prisma.trafficSignal.findUnique({ where: { id: req.params.id }, include: { zone: true } });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  });

  router.patch('/:id/adjust', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { greenTimeSeconds, phase } = req.body;
    const data = {};
    if (greenTimeSeconds != null) data.greenTimeSeconds = greenTimeSeconds;
    if (phase) data.currentPhase = phase;
    const s = await prisma.trafficSignal.update({ where: { id: req.params.id }, data });
    io.of('/signal').emit('signal:update', s);
    io.of('/police').emit('signal:update', s);
    res.json(s);
  });

  router.post('/:id/ambulance', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const s = await prisma.trafficSignal.update({
      where: { id: req.params.id },
      data: { isAmbulanceMode: true }
    });
    io.of('/signal').emit('ambulance:approaching', { signalId: s.id, route: [s.lat, s.lng], eta: 45 });
    io.of('/driver').emit('ambulance:approaching', { signalId: s.id, route: [s.lat, s.lng], eta: 45 });
    io.of('/police').emit('signal:update', s);

    // Auto-disable after 60s
    setTimeout(async () => {
      const updated = await prisma.trafficSignal.update({
        where: { id: req.params.id }, data: { isAmbulanceMode: false }
      });
      io.of('/signal').emit('signal:update', updated);
      io.of('/police').emit('signal:update', updated);
    }, 60000);

    res.json(s);
  });

  return router;
};
