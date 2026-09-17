const BookingCalculator = require('./booking.calculator');
const ApiResponse = require('../../common/utils/api-response');
const asyncHandler = require('../../common/utils/async-handler');

class BookingController {
  constructor() {
    this.calculator = new BookingCalculator();
  }

  quote = asyncHandler(async (req, res) => {
    const { pickup, dropoff, couponCode } = req.body;
    const quote = await this.calculator.calculateQuote(pickup, dropoff, couponCode);
    return ApiResponse.success(res, quote);
  });
}

module.exports = BookingController;
