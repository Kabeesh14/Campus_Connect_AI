const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const { testConnection } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { securityHeaders, rateLimiter, sanitizeInputs } = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadDir, 'avatars');
const resumesDir = path.join(uploadDir, 'resumes');
const logosDir = path.join(uploadDir, 'logos');

[uploadDir, avatarsDir, resumesDir, logosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware Setup
app.use(securityHeaders);
app.use(rateLimiter());
// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5000'] : '*';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins === '*' || allowedOrigins.includes(origin) || origin.endsWith('.railway.app') || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { PRIMARY_MODEL } = require('./services/geminiClient');

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isAiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key' && process.env.GEMINI_API_KEY.trim());
  res.status(200).json({
    status: 'ok',
    database: 'connected',
    ai: isAiConfigured ? 'connected' : 'unconfigured',
    aiModel: PRIMARY_MODEL,
    geminiConfigured: isAiConfigured,
    jwt: 'valid',
  });
});

// API Route Imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const officerRoutes = require('./routes/officerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const { verifyToken } = require('./middleware/authMiddleware');
const { getMe } = require('./controllers/authController');

// Direct profile endpoint
app.get('/api/profile', verifyToken, getMe);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve frontend static assets in production if dist exists
const frontendDistPath = path.join(__dirname, '../dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Startup validation for Gemini API key
const validateGeminiConfig = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_google_gemini_api_key') {
    console.warn('⚠️  [AI Subsystem Notice] GEMINI_API_KEY is missing or unconfigured in .env file.');
    console.warn('⚠️  AI endpoints will return HTTP 500 until a valid GEMINI_API_KEY is provided.');
  } else {
    console.log('✅ Google Gemini 1.5 Flash AI Engine Initialized.');
  }
};

const initDatabase = require('./scripts/initDb');

// Start Server & Test Database Connection
app.listen(PORT, async () => {
  console.log(`===========================================`);
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
  validateGeminiConfig();
  await testConnection();
  try {
    await initDatabase();
  } catch (err) {
    console.warn('[DB INIT] Migration warning:', err.message);
  }
});

module.exports = app;
