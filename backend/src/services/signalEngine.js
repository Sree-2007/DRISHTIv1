function computeGreenTime(vehicleCount, bikeCount) {
  let base = 30 + vehicleCount * 0.5 + bikeCount * 0.3;
  if (bikeCount > vehicleCount * 1.5) base += 15; // two-wheeler priority phase
  return Math.min(120, Math.round(base));
}

module.exports = { computeGreenTime };
