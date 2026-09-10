const express = require('express');
const { auth } = require('../middleware/auth');

module.exports = (prisma) => {
  const router = express.Router();

  router.get('/stats', async (req, res) => {
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const [totalReportsToday, activeZones, ambulanceActive, pendingReports] = await Promise.all([
      prisma.report.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.zone.count({ where: { currentStatus: { not: 'NORMAL' } } }),
      prisma.trafficSignal.count({ where: { isAmbulanceMode: true } }),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);
    const avgCongestion = await computeAvgCongestion(prisma);
    res.json({ totalReportsToday, activeZones, avgCongestion, ambulanceActive, pendingReports });
  });

  router.get('/heatmap', async (req, res) => {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const reports = await prisma.report.findMany({ where: { createdAt: { gte: since } } });
    res.json(reports.map(r => ({ lat: r.lat, lng: r.lng, intensity: r.status === 'VERIFIED' ? 1 : 0.5 })));
  });

  router.get('/signals', async (req, res) => {
    const signals = await prisma.trafficSignal.findMany();
    res.json(signals.map(s => ({
      ...s,
      health: s.isAmbulanceMode ? 'CRITICAL' :
              (s.vehicleCount > 100 ? 'BUSY' : 'OK')
    })));
  });

  return router;
};

async function computeAvgCongestion(prisma) {
  const signals = await prisma.trafficSignal.findMany();
  if (!signals.length) return 0;
  const avg = signals.reduce((s, x) => s + x.vehicleCount + x.bikeCount, 0) / signals.length;
  return Math.round(avg);
}
