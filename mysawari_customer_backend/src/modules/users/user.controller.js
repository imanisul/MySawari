const UserService = require('./user.service');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      
      const updatedUser = await this.userService.updateProfile(userId, profileData);
      
      res.status(200).json({
        status: 'success',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
