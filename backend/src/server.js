require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const cron = require('node-cron');

const prisma = require('./config/db');
const socketHandler = require('./services/socketHandler');
const { runPrediction } = require('./services/prediction');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '12mb' }));
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/auth/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// Health
app.get('/', (req, res) => res.json({ service: 'DRISHTI API', status: 'ok', time: new Date() }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', require('./routes/auth')(prisma, io));
app.use('/api/reports', require('./routes/reports')(prisma, io));
app.use('/api/zones', require('./routes/zones')(prisma, io));
app.use('/api/signals', require('./routes/signals')(prisma, io));
app.use('/api/predictions', require('./routes/predictions')(prisma, io));
app.use('/api/dashboard', require('./routes/dashboard')(prisma, io));
app.use('/api/simulator', require('./routes/simulator')(prisma, io));

// Sockets
socketHandler(io);

// Prediction cron — every 30 min
cron.schedule('*/30 * * * *', () => {
  console.log('[cron] Running prediction engine...');
  runPrediction(prisma, io).catch(console.error);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 DRISHTI backend on http://localhost:${PORT}`);
});
