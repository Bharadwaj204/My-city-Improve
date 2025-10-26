const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { authMiddleware } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

// Create complaint with photo
router.post('/', async (req, res) => {
  try {
    const { description, lat, lng, email } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    let photoUrl = null;
    if (req.files && req.files.photo) {
      const result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
        folder: 'mycity',
        resource_type: 'auto'
      });
      photoUrl = result.secure_url;
    }

    const complaint = await Complaint.create({
      description,
      email: email || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      photoUrl
    });

    res.json(complaint);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get all complaints (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Get single complaint
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Update status (admin)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'not found' });

    complaint.status = status;
    complaint.updatedAt = new Date();
    await complaint.save();

    // Send email notification if configured
    if (complaint.email && process.env.EMAIL_USER) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: complaint.email,
          subject: `Complaint ${complaint._id} status: ${status}`,
          text: `Your complaint status has been updated to: ${status}\n\nDescription: ${complaint.description}`
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
      }
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

// Get resolved complaints
router.get('/resolved', async (req, res) => {
  try {
    const resolved = await Complaint.find({ status: 'Resolved' })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(resolved);
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;