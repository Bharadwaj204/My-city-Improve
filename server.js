require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const streamifier = require('streamifier');

const Complaint = require('./models/Complaint');
const User = require('./models/User');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "maps.googleapis.com"]
    }
  }
}));

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://mycity.railway.app']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

app.use(compression()); // Compress responses
app.use(express.json({ limit: '10kb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('combined')); // Detailed logging in production

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// connect to mongo with retry logic
const connectWithRetry = async (retries = 5, interval = 5000) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'mycity',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Add these options for better resilience
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Auto reconnect on failure
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500
    });
    console.log('Connected to MongoDB');
    ensureInitialAdmin().catch(e => console.error('init admin error', e));
  } catch (err) {
    console.error('MongoDB connection error', err);
    if (retries > 0) {
      console.log(`Retrying connection in ${interval/1000} seconds... (${retries} attempts remaining)`);
      setTimeout(() => connectWithRetry(retries - 1, interval), interval);
    } else {
      console.error('Failed to connect to MongoDB after multiple retries');
      process.exit(1); // Exit if we can't connect to database
    }
  }
};

connectWithRetry();

async function ensureInitialAdmin(){
  const count = await User.countDocuments();
  if (count === 0) {
    const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@mycity.local';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';
    await User.createFromEmailPassword(email, password, 'admin');
    console.log('Created initial admin:', email, 'password:', password);
  }
}

// multer memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// email transporter (if configured)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });
}

async function sendStatusEmail(complaint){
  if (!transporter || !complaint.email) return;
  try{
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: complaint.email,
      subject: `Complaint ${complaint._id} status: ${complaint.status}`,
      text: `Your complaint is now: ${complaint.status}\nDescription: ${complaint.description}`
    });
  } catch(e){ console.error('email send error', e); }
}

// Health check for Render
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// routes
app.post('/api/complaints', upload.single('photo'), async (req, res) => {
  try {
    const { description, lat, lng, email } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    let photoUrl = null;
    if (req.file) {
      // upload to cloudinary via stream
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'mycity' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      photoUrl = result.secure_url;
    }

    const c = await Complaint.create({ description, email: email || null, lat: lat?parseFloat(lat):null, lng: lng?parseFloat(lng):null, photoUrl });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// admin: list all complaints
app.get('/api/complaints', authMiddleware, async (req, res) => {
  const comps = await Complaint.find().sort({ createdAt: -1 });
  res.json(comps);
});

// get single complaint (public)
app.get('/api/complaints/:id', async (req, res) => {
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
});

// admin update status
app.put('/api/complaints/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  const c = await Complaint.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'not found' });
  c.status = status;
  c.updatedAt = new Date();
  await c.save();
  // send email if configured
  sendStatusEmail(c).catch(e=>console.error(e));
  res.json(c);
});

// public resolved
app.get('/api/resolved', async (req, res) => {
  const resolved = await Complaint.find({ status: 'Resolved' }).sort({ updatedAt: -1 });
  res.json(resolved);
});

// chatbot
app.post('/api/chatbot', express.json(), async (req, res) => {
  const { message, id } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });
  const lower = message.toLowerCase();
  if (lower.includes('status') || lower.includes('what is the status')) {
    if (!id) return res.json({ reply: 'Please provide your complaint id. Example: { "id": "<your-id>", "message": "status" }' });
    const c = await Complaint.findById(id);
    if (!c) return res.json({ reply: `No complaint found with id ${id}` });
    return res.json({ reply: `Complaint ${id} is currently: ${c.status}` });
  }
  res.json({ reply: `I can tell you the status of a complaint. Try: "What is the status of my complaint?" and include your complaint id.` });
});

// fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message || 'Internal server error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});
