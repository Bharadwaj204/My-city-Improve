const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Security middleware
module.exports = function(app) {
  // Enable CORS
  app.use(cors());

  // Set security HTTP headers
  app.use(helmet());

  // Rate limiting
  app.use('/api', limiter);

  // Data sanitization against XSS
  app.use(xss());

  // File upload validation
  app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: process.env.NODE_ENV === 'development',
    safeFileNames: true,
    preserveExtension: 4,
    abortOnLimit: true,
    limitHandler: function(req, res) {
      return res.status(413).json({ error: 'File too large. Max size is 5MB.' });
    },
    uploadTimeout: 30000, // 30s timeout
    fileHandler: function(req, res, next) {
      const file = req.files.photo;
      if (!file) return next();
      
      // Validate mime type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only jpg, png, gif allowed.' });
      }
      
      next();
    }
  }));
};