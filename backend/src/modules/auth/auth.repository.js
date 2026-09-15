// Mock Repository for Demo
const globalDb = {
  users: [
    {
      id: "usr_mock123",
      name: "Demo User",
      mobile: "+91 9999999999",
      referralCode: "DEMO1234",
    }
  ],
  otps: {}
};

class AuthRepository {
  async saveOtp(mobile, otp, expiresAt) {
    globalDb.otps[mobile] = { otp, expiresAt };
  }

  async getOtp(mobile) {
    return globalDb.otps[mobile];
  }

  async deleteOtp(mobile) {
    delete globalDb.otps[mobile];
  }

  async findUserByMobile(mobile) {
    return globalDb.users.find(u => u.mobile === mobile);
  }

  async createUser(user) {
    globalDb.users.push(user);
    return user;
  }
}

module.exports = AuthRepository;
