const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../common/errors/app-error');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'mysawari_super_secret_key_123!'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('No user found with this id', 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

module.exports = protect;
