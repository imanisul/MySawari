const jwt = require('jsonwebtoken');
const watiService = require('../../integrations/wati.service');
const User = require('../../models/user.model');
const Otp = require('../../models/otp.model');
const AppError = require('../../common/errors/app-error');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'mysawari_super_secret_key_123!';
  }

  async sendOtp({ mobileNumber }) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp, expiresAt },
      { upsert: true, new: true }
    );
    
    try {
      // Call WATI API to send WhatsApp message
      await watiService.sendWhatsAppOtp(mobileNumber, otp);

      // Local logging for development/auditing
      console.log(`\n================================`);
      console.log(`💬 WhatsApp OTP Request Queued: ${mobileNumber}`);
      console.log(`🔒 Developer Override Code: ${otp}`);
      console.log(`================================\n`);
    } catch (error) {
      // If sending fails, rollback the OTP from database so the user isn't stuck
      await Otp.deleteOne({ mobileNumber });
      throw error;
    }
  }

  async verifyOtp({ mobileNumber, otp, fullName }) {
    const storedData = await Otp.findOne({ mobileNumber });
    
    if (!storedData) {
      throw new AppError('Please request a new OTP first', 400);
    }
    if (new Date() > storedData.expiresAt) {
      await Otp.deleteOne({ mobileNumber });
      throw new AppError('OTP has expired', 400);
    }
    if (storedData.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    await Otp.deleteOne({ mobileNumber });

    let user = await User.findOne({ mobileNumber });
    
    if (!user) {
      const crypto = require('crypto');
      const generateUniqueCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        const bytes = crypto.randomBytes(6);
        for (let i = 0; i < 6; i++) {
          code += chars[bytes[i] % chars.length];
        }
        return code;
      };
      
      const uniqueCode = generateUniqueCode();
      
      user = await User.create({
        fullName: fullName || 'New User',
        mobileNumber: mobileNumber,
        referralCode: uniqueCode,
        walletBalance: 0,
        rewardsPoints: 0,
        email: '',
        dob: '',
        gender: '',
        aadhaarNumber: '',
        drivingLicenseNumber: ''
      });
    }

    const token = jwt.sign({ id: user._id, mobileNumber: user.mobileNumber }, this.JWT_SECRET, { expiresIn: '30d' });
    
    return { token, user };
  }
}

module.exports = AuthService;
