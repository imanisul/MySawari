class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, error = undefined) {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  }
}
module.exports = ApiResponse;
