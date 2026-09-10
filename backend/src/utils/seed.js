require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Wipe
  await prisma.alert.deleteMany();
  await prisma.hazardPrediction.deleteMany();
  await prisma.trafficSignal.deleteMany();
  await prisma.report.deleteMany();
  await prisma.zoneAssignment.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Admin', email: 'admin@drishti.io', phone: '+911111111111', passwordHash: hash, role: 'ADMIN', trustScore: 100 }
  });

  const officer1 = await prisma.user.create({
    data: { name: 'Officer Meera', email: 'police@drishti.io', phone: '+912222222222', passwordHash: hash, role: 'POLICE', trustScore: 100 }
  });

  const officer2 = await prisma.user.create({
    data: { name: 'Officer Vikram', email: 'police2@drishti.io', phone: '+913333333333', passwordHash: hash, role: 'POLICE', trustScore: 100 }
  });

  const driver = await prisma.user.create({
    data: { name: 'Rahul Driver', email: 'driver@drishti.io', phone: '+914444444444', passwordHash: hash, role: 'DRIVER', trustScore: 65 }
  });

  const citizen = await prisma.user.create({
    data: { name: 'Ananya Citizen', email: 'citizen@drishti.io', phone: '+915555555555', passwordHash: hash, role: 'CITIZEN', trustScore: 60 }
  });

  // Zones (Mumbai-inspired bounding boxes)
  const zoneDefs = [
    { name: 'Bandra West',    bbox: [[19.050, 72.815], [19.050, 72.845], [19.075, 72.845], [19.075, 72.815]], status: 'NORMAL',     officer: officer1.id },
    { name: 'Andheri East',   bbox: [[19.100, 72.850], [19.100, 72.885], [19.130, 72.885], [19.130, 72.850]], status: 'WATERLOGGED', officer: officer2.id },
    { name: 'Dadar',          bbox: [[19.015, 72.830], [19.015, 72.855], [19.040, 72.855], [19.040, 72.830]], status: 'NORMAL',     officer: null },
    { name: 'Colaba',         bbox: [[18.895, 72.815], [18.895, 72.835], [18.920, 72.835], [18.920, 72.815]], status: 'RALLY',      officer: null }
  ];

  const zones = [];
  for (const z of zoneDefs) {
    const zone = await prisma.zone.create({
      data: {
        name: z.name,
        boundary: JSON.stringify(z.bbox),
        currentStatus: z.status,
        assignedOfficerId: z.officer
      }
    });
    zones.push(zone);
    if (z.officer) {
      await prisma.zoneAssignment.create({
        data: { officerId: z.officer, zoneId: zone.id, status: 'ACTIVE' }
      });
    }
  }

  // Signals
  const signalDefs = [
    { zone: 0, name: 'Bandra Station Jn',   lat: 19.060, lng: 72.830 },
    { zone: 0, name: 'Linking Rd Jn',       lat: 19.065, lng: 72.835 },
    { zone: 1, name: 'Andheri Metro Jn',    lat: 19.115, lng: 72.865 },
    { zone: 1, name: 'Chakala Signal',      lat: 19.108, lng: 72.870 },
    { zone: 2, name: 'Dadar TT Circle',     lat: 19.025, lng: 72.842 },
    { zone: 3, name: 'Colaba Causeway',     lat: 18.905, lng: 72.825 }
  ];
  for (const s of signalDefs) {
    await prisma.trafficSignal.create({
      data: {
        zoneId: zones[s.zone].id,
        intersectionName: s.name,
        lat: s.lat, lng: s.lng,
        vehicleCount: 20 + Math.floor(Math.random() * 60),
        bikeCount: 30 + Math.floor(Math.random() * 80),
        greenTimeSeconds: 30
      }
    });
  }

  // Sample reports
  const now = Date.now();
  const sampleReports = [
    { reporter: citizen.id, zone: zones[1].id, type: 'WATERLOGGING', description: 'Knee-deep water near Andheri metro', lat: 19.115, lng: 72.865, status: 'VERIFIED' },
    { reporter: driver.id,  zone: zones[0].id, type: 'BLOCKAGE',     description: 'Truck broke down on Linking Rd',      lat: 19.065, lng: 72.835, status: 'VERIFIED' },
    { reporter: citizen.id, zone: zones[3].id, type: 'RALLY',        description: 'Political rally blocking Causeway',   lat: 18.905, lng: 72.825, status: 'PENDING' },
    { reporter: driver.id,  zone: zones[2].id, type: 'ACCIDENT',     description: 'Two-wheeler collision at TT Circle',  lat: 19.025, lng: 72.842, status: 'PENDING' }
  ];
  for (const r of sampleReports) {
    await prisma.report.create({
      data: {
        reporterId: r.reporter, zoneId: r.zone, type: r.type, description: r.description,
        lat: r.lat, lng: r.lng, status: r.status, aiConfidence: 78,
        createdAt: new Date(now - Math.random() * 6 * 3600 * 1000)
      }
    });
  }

  console.log('✅ Seed complete');
  console.log('\n📋 Demo credentials (password: password123)');
  console.log('   Police : police@drishti.io');
  console.log('   Admin  : admin@drishti.io');
  console.log('   Driver : driver@drishti.io');
  console.log('   Citizen: citizen@drishti.io\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
