const express = require('express');
const { computeGreenTime } = require('../services/signalEngine');

module.exports = (prisma, io) => {
  const router = express.Router();

  router.post('/camera', async (req, res) => {
    const { intersectionName, vehicleCount, bikeCount } = req.body;
    if (!intersectionName) return res.status(400).json({ error: 'intersectionName required' });

    const signal = await prisma.trafficSignal.findFirst({ where: { intersectionName } });
    if (!signal) return res.status(404).json({ error: 'Signal not found' });

    const greenTime = computeGreenTime(vehicleCount, bikeCount);
    const updated = await prisma.trafficSignal.update({
      where: { id: signal.id },
      data: {
        vehicleCount, bikeCount, greenTimeSeconds: greenTime,
        lastUpdated: new Date()
      }
    });

    io.of('/signal').emit('signal:update', updated);
    io.of('/police').emit('signal:update', updated);
    io.of('/driver').emit('signal:update', updated);

    res.json(updated);
  });

  return router;
};
