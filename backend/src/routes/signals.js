const express = require('express');
const { auth } = require('../middleware/auth');

module.exports = (prisma, io) => {
  const router = express.Router();

  const broadcast = (signal) => {
    io.of('/signal').emit('signal:update', signal);
    io.of('/police').emit('signal:update', signal);
    io.of('/driver').emit('signal:update', signal);
  };

  router.get('/', async (req, res) => {
    const signals = await prisma.trafficSignal.findMany({ include: { zone: true } });
    res.json(signals);
  });

  router.get('/:id', async (req, res) => {
    const s = await prisma.trafficSignal.findUnique({ where: { id: req.params.id }, include: { zone: true } });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  });

  // Manual adjust (extended)
  router.patch('/:id/adjust', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { greenTimeSeconds, phase, isManualMode } = req.body;
    const data = {};
    if (greenTimeSeconds != null) data.greenTimeSeconds = Math.max(5, Math.min(120, greenTimeSeconds));
    if (phase) data.currentPhase = phase;
    if (typeof isManualMode === 'boolean') {
      data.isManualMode = isManualMode;
      data.manualOverrideBy = isManualMode ? req.user.sub : null;
    }
    const s = await prisma.trafficSignal.update({ where: { id: req.params.id }, data });
    broadcast(s);
    res.json(s);
  });

  // NEW: Manual mode toggle endpoint
  router.post('/:id/manual', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { enabled } = req.body;
    const s = await prisma.trafficSignal.update({
      where: { id: req.params.id },
      data: {
        isManualMode: !!enabled,
        manualOverrideBy: enabled ? req.user.sub : null
      }
    });
    broadcast(s);
    res.json(s);
  });

  // NEW: Force all-red (emergency stop)
  router.post('/:id/force-red', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const s = await prisma.trafficSignal.update({
      where: { id: req.params.id },
      data: {
        currentPhase: 'ALL_RED',
        greenTimeSeconds: 0,
        isManualMode: true,
        manualOverrideBy: req.user.sub
      }
    });
    broadcast(s);
    res.json(s);
  });

  // NEW: Reset to adaptive auto mode
  router.post('/:id/reset', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const signal = await prisma.trafficSignal.findUnique({ where: { id: req.params.id } });
    if (!signal) return res.status(404).json({ error: 'Not found' });

    // Recompute green time using adaptive formula
    let base = 30 + signal.vehicleCount * 0.5 + signal.bikeCount * 0.3;
    if (signal.bikeCount > signal.vehicleCount * 1.5) base += 15;
    const greenTime = Math.min(120, Math.round(base));

    const s = await prisma.trafficSignal.update({
      where: { id: req.params.id },
      data: {
        isManualMode: false,
        manualOverrideBy: null,
        isAmbulanceMode: false,
        greenTimeSeconds: greenTime,
        currentPhase: 'NORTH'
      }
    });
    broadcast(s);
    res.json(s);
  });

  // Ambulance mode
  router.post('/:id/ambulance', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const s = await prisma.trafficSignal.update({
      where: { id: req.params.id },
      data: { isAmbulanceMode: true, isManualMode: true, manualOverrideBy: req.user.sub }
    });
    io.of('/signal').emit('ambulance:approaching', { signalId: s.id, route: [s.lat, s.lng], eta: 45 });
    io.of('/driver').emit('ambulance:approaching', { signalId: s.id, route: [s.lat, s.lng], eta: 45 });
    broadcast(s);

    setTimeout(async () => {
      const updated = await prisma.trafficSignal.update({
        where: { id: req.params.id },
        data: { isAmbulanceMode: false }
      });
      broadcast(updated);
    }, 60000);

    res.json(s);
  });

  return router;
};
