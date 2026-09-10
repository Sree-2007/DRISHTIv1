const express = require('express');
const { auth } = require('../middleware/auth');

module.exports = (prisma, io) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const zones = await prisma.zone.findMany({
      include: {
        assignments: { where: { status: 'ACTIVE' }, include: { officer: { select: { id: true, name: true } } } },
        _count: { select: { reports: true, signals: true } }
      }
    });
    res.json(zones.map(z => ({
      ...z,
      boundary: JSON.parse(z.boundary),
      activeOfficer: z.assignments[0]?.officer || null
    })));
  });

  router.get('/:id', async (req, res) => {
    const zone = await prisma.zone.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: { where: { status: 'ACTIVE' }, include: { officer: true } },
        reports: { orderBy: { createdAt: 'desc' }, take: 50, include: { reporter: { select: { name: true, trustScore: true } } } },
        signals: true
      }
    });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json({ ...zone, boundary: JSON.parse(zone.boundary) });
  });

  router.post('/:id/assign', auth(['ADMIN']), async (req, res) => {
    const { officerId } = req.body;
    await prisma.zoneAssignment.updateMany({
      where: { zoneId: req.params.id, status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });
    const assignment = await prisma.zoneAssignment.create({
      data: { officerId, zoneId: req.params.id }
    });
    await prisma.zone.update({ where: { id: req.params.id }, data: { assignedOfficerId: officerId } });
    res.json(assignment);
  });

  router.patch('/:id/status', auth(['POLICE', 'ADMIN']), async (req, res) => {
    const { status } = req.body;
    const zone = await prisma.zone.update({
      where: { id: req.params.id },
      data: { currentStatus: status }
    });
    io.of('/police').emit('zone:status', zone);
    io.of('/driver').emit('zone:status', zone);
    res.json(zone);
  });

  router.get('/:id/officers', async (req, res) => {
    const list = await prisma.zoneAssignment.findMany({
      where: { zoneId: req.params.id },
      include: { officer: { select: { id: true, name: true, email: true } } }
    });
    res.json(list);
  });

  return router;
};
