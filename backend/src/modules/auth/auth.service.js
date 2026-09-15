const jwt = require('jsonwebtoken');
const watiService = require('../../integrations/wati.service');
const AuthRepository = require('./auth.repository');
const AppError = require('../../common/errors/app-error');

class AuthService {
  constructor() {
    this.repository = new AuthRepository();
    this.JWT_SECRET = process.env.JWT_SECRET || 'mysawari_super_secret_key_123!';
  }

  async sendOtp({ mobile }) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    await this.repository.saveOtp(mobile, otp, expiresAt);
    
    try {
      // Call WATI API to send WhatsApp message
      await watiService.sendWhatsAppOtp(mobile, otp);

      // Local logging for development/auditing
      console.log(`\n================================`);
      console.log(`💬 WhatsApp OTP Request Queued: ${mobile}`);
      console.log(`🔒 Developer Override Code: ${otp}`);
      console.log(`================================\n`);
    } catch (error) {
      // If sending fails, rollback the OTP from database so the user isn't stuck
      await this.repository.deleteOtp(mobile);
      throw error;
    }
  }

  async verifyOtp({ mobile, otp, name }) {
    const storedData = await this.repository.getOtp(mobile);
    
    if (!storedData) {
      throw new AppError('Please request a new OTP first', 400);
    }
    if (Date.now() > storedData.expiresAt) {
      await this.repository.deleteOtp(mobile);
      throw new AppError('OTP has expired', 400);
    }
    if (storedData.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    await this.repository.deleteOtp(mobile);

    let user = await this.repository.findUserByMobile(mobile);
    
    if (!user) {
      const prefix = name ? name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'USER';
      const uniqueCode = `${prefix}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      user = await this.repository.createUser({
        id: `usr_${Math.random().toString(36).substring(2, 10)}`,
        name: name || 'New User',
        mobile: mobile,
        referralCode: uniqueCode,
        walletBalance: 0,
        rewardsPoints: 0
      });
    }

    const token = jwt.sign({ id: user.id, mobile: user.mobile }, this.JWT_SECRET, { expiresIn: '30d' });
    
    return { token, user };
  }
}

module.exports = AuthService;
