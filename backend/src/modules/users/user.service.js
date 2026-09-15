const User = require('../../models/user.model');
const AppError = require('../../common/errors/app-error');

class UserService {
  async updateProfile(userId, profileData) {
    const updateFields = {};
    
    // Only allow updating specific fields
    if (profileData.fullName) updateFields.fullName = profileData.fullName;
    if (profileData.email !== undefined) updateFields.email = profileData.email;
    if (profileData.dob !== undefined) updateFields.dob = profileData.dob;
    if (profileData.gender !== undefined) updateFields.gender = profileData.gender;
    if (profileData.aadhaarNumber !== undefined) updateFields.aadhaarNumber = profileData.aadhaarNumber;
    if (profileData.drivingLicenseNumber !== undefined) updateFields.drivingLicenseNumber = profileData.drivingLicenseNumber;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user;
  }
}

module.exports = UserService;
