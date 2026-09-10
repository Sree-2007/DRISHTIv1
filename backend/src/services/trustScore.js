// Simple AI pre-check: based on image size + type heuristic (mock classifier)
function classifyImage(base64) {
  if (!base64) return 0;
  // Heuristic: bigger images = more detail = higher confidence for demo
  const sizeKB = base64.length / 1024;
  return Math.min(95, 40 + Math.log2(sizeKB + 1) * 8);
}

async function applyTrustScoreChange(prisma, userId, delta, min = 0, max = 100) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const next = Math.max(min, Math.min(max, user.trustScore + delta));
  return prisma.user.update({ where: { id: userId }, data: { trustScore: next } });
}

module.exports = { classifyImage, applyTrustScoreChange };
