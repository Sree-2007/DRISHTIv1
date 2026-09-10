const axios = require('axios');

// Simplified: uses deterministic mock weather (no API key required)
// Set OPENWEATHER_API_KEY in .env to use live data
async function fetchWeather(lat, lng) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (key) {
    try {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric`
      );
      const rainNext2h = data.list.slice(0, 2).reduce((sum, e) => sum + (e.rain?.['3h'] || 0) / 3, 0);
      return { rainNext2h, raw: data };
    } catch { /* fallthrough to mock */ }
  }
  // Mock: random 0-20 mm/h
  return { rainNext2h: Math.random() * 20, raw: { mock: true } };
}

async function runPrediction(prisma, io) {
  const zones = await prisma.zone.findMany();
  const created = [];
  for (const zone of zones) {
    const boundary = JSON.parse(zone.boundary);
    const cx = (boundary[0][0] + boundary[2][0]) / 2;
    const cy = (boundary[0][1] + boundary[2][1]) / 2;
    const weather = await fetchWeather(cx, cy);
    if (weather.rainNext2h <= 10) continue;

    // Historical check
    const pastFloods = await prisma.report.count({
      where: { zoneId: zone.id, type: 'WATERLOGGING', status: 'VERIFIED' }
    });
    if (pastFloods === 0) continue;

    const prediction = await prisma.hazardPrediction.create({
      data: {
        zoneId: zone.id,
        predictedType: 'WATERLOGGING',
        confidenceScore: 0.75 + Math.min(0.2, pastFloods * 0.02),
        weatherData: JSON.stringify(weather),
        expiresAt: new Date(Date.now() + 2 * 3600 * 1000)
      },
      include: { zone: true }
    });
    created.push(prediction);
    io.of('/driver').emit('prediction:alert', prediction);
    io.of('/citizen').emit('prediction:alert', prediction);
    io.of('/police').emit('prediction:new', prediction);
  }
  return created;
}

module.exports = { runPrediction, fetchWeather };
