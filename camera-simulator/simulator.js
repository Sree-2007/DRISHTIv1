const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:5000';
const INTERSECTIONS = [
  'Bandra Station Jn', 'Linking Rd Jn', 'Andheri Metro Jn',
  'Chakala Signal', 'Dadar TT Circle', 'Colaba Causeway'
];

function rand(min, max) { return Math.floor(min + Math.random() * (max - min)); }

async function tick() {
  for (const name of INTERSECTIONS) {
    const isRush = Math.random() < 0.3;
    const vehicleCount = rand(isRush ? 80 : 20, isRush ? 150 : 80);
    const bikeCount = rand(isRush ? 120 : 30, isRush ? 200 : 120);
    try {
      await axios.post(`${API}/api/simulator/camera`, { intersectionName: name, vehicleCount, bikeCount });
      console.log(`📡 ${name} → v:${vehicleCount} b:${bikeCount}`);
    } catch (e) {
      console.error(`✗ ${name}: ${e.message}`);
    }
  }
}

console.log('🎥 DRISHTI Camera Simulator started. Sending data every 30s.\n');
tick();
setInterval(tick, 30_000);
