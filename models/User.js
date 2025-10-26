const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','user'], default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.methods.comparePassword = function(password){
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.createFromEmailPassword = async function(email, password, role='admin'){
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return this.create({ email, passwordHash: hash, role });
}

module.exports = mongoose.model('User', UserSchema);
