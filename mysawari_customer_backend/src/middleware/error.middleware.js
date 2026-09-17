const AppError = require('../common/errors/app-error');
const ApiResponse = require('../common/utils/api-response');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    console.error('[Unhandled Error]', err);
  }

  return ApiResponse.error(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};

module.exports = errorMiddleware;
