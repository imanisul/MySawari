const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// TTL index to automatically delete expired OTPs (expires after 5 minutes)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
