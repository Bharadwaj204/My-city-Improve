const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  description: { type: String, required: true },
  email: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  photoUrl: { type: String },
  status: { type: String, enum: ['Pending','In Progress','Resolved'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
