const AuthService = require('./auth.service');
const ApiResponse = require('../../common/utils/api-response');
const asyncHandler = require('../../common/utils/async-handler');
const { sendOtpSchema, verifyOtpSchema } = require('./auth.validation');
const AppError = require('../../common/errors/app-error');

class AuthController {
  constructor() {
    this.service = new AuthService();
  }

  sendOtp = asyncHandler(async (req, res) => {
    const { error, value } = sendOtpSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    await this.service.sendOtp(value);
    return ApiResponse.success(res, null, 'OTP sent successfully');
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const result = await this.service.verifyOtp(value);
    return ApiResponse.success(res, result, 'Logged in successfully');
  });
}

module.exports = AuthController;
