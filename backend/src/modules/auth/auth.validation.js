const Joi = require('joi');

const sendOtpSchema = Joi.object({
  mobile: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  mobile: Joi.string().required(),
  otp: Joi.string().length(4).required(),
  name: Joi.string().optional(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema
};
