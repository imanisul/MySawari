const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fullName: {
    type: String,
    trim: true,
    default: 'New User'
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  dob: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  aadhaarNumber: {
    type: String,
    default: ''
  },
  drivingLicenseNumber: {
    type: String,
    default: ''
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  rewardsPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
