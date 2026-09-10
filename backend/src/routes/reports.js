const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { classifyImage, applyTrustScoreChange } = require('../services/trustScore');

module.exports = (prisma, io) => {
  const router = express.Router();

  const createSchema = z.object({
    type: z.enum(['WATERLOGGING', 'BLOCKAGE', 'RALLY', 'ACCIDENT']),
    description: z.string().min(5).max(500),
    imageBase64: z.string().optional(),
    lat: z.number(),
    lng: z.number()
  });

  // Create report
  router.post('/', auth(['DRIVER', 'CITIZEN']), validate(createSchema), async (req, res) => {
    const { type, description, imageBase64, lat, lng } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

    // AI pre-check
    const aiConfidence = classifyImage(imageBase64);
    let status = 'PENDING';
    if (user.trustScore >= 70 && aiConfidence >= 60) status = 'VERIFIED';
    if (user.trustScore < 20) status = 'PENDING'; // always requires review

    // Find nearest zone (simple: choose zone whose center is closest)
    const zones = await prisma.zone.findMany();
    let nearestZone = null, bestDist = Infinity;
    for (const z of zones) {
      try {
        const b = JSON.parse(z.boundary);
        const cx = (b[0][0] + b[2][0]) / 2;
        const cy = (b[0][1] + b[2][1]) / 2;
        const d = Math.hypot(cx - lat, cy - lng);
        if (d < bestDist) { bestDist = d; nearestZone = z; }
      } catch {}
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        zoneId: nearestZone?.id,
        type, description,
        imageUrl: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
        lat, lng, status,
        aiConfidence
      },
      include: { reporter: { select: { name: true, trustScore: true } }, zone: true }
    });

    if (status === 'VERIFIED') {
      await applyTrustScoreChange(prisma, user.id, +10);
      if (nearestZone) await prisma.zone.update({ where: { id: nearestZone.id }, data: { currentStatus: type } });
    }

    // Broadcast
    io.of('/police').emit('hazard:reported', report);
    io.of('/driver').emit('hazard:reported', report);
    io.of('/citizen').emit('hazard:reported', report);

    res.json(report);
  });

  // List reports
  router.get('/', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { zoneId, status } = req.query;
    const where = {};
    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;

    // Police only see their assigned zones
    if (req.user.role === 'POLICE') {
      const assignments = await prisma.zoneAssignment.findMany({
        where: { officerId: req.user.sub, status: 'ACTIVE' }
      });
      const zoneIds = assignments.map(a => a.zoneId);
      if (zoneIds.length) where.zoneId = { in: zoneIds };
    }

    const reports = await prisma.report.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 200,
      include: { reporter: { select: { name: true, trustScore: true } }, zone: true }
    });
    res.json(reports);
  });

  // Nearby (driver app)
  router.get('/nearby', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radius || 2);
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat/lng required' });

    const reports = await prisma.report.findMany({
      where: { status: { in: ['PENDING', 'VERIFIED'] } },
      orderBy: { createdAt: 'desc' }, take: 200,
      include: { reporter: { select: { name: true, trustScore: true } }, zone: true }
    });

    const nearby = reports.filter(r => haversine(lat, lng, r.lat, r.lng) <= radiusKm);
    res.json(nearby);
  });

  // Verify / Reject
  router.patch('/:id/verify', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { action } = req.body; // 'VERIFY' | 'REJECT'
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: 'Not found' });

    const status = action === 'REJECT' ? 'REJECTED' : 'VERIFIED';
    const updated = await prisma.report.update({
      where: { id: report.id },
      data: { status, verifiedByOfficerId: req.user.sub },
      include: { reporter: true, zone: true }
    });

    if (status === 'VERIFIED') {
      await applyTrustScoreChange(prisma, report.reporterId, +10);
      if (report.zoneId) {
        await prisma.zone.update({ where: { id: report.zoneId }, data: { currentStatus: report.type } });
      }
    } else {
      await applyTrustScoreChange(prisma, report.reporterId, -15);
    }

    io.of('/driver').emit('hazard:verified', updated);
    io.of('/citizen').emit('hazard:verified', updated);
    io.of('/police').emit('hazard:verified', updated);

    res.json(updated);
  });

  return router;
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
