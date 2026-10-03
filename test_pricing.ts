import { calculateRentalDays } from './services/backend/pricingEngine';
console.log(calculateRentalDays('1 Sep', '2 Sep', '8:00 AM', '9:00 AM'));
console.log(calculateRentalDays('1 Sep', '1 Sep', '8:00 AM', '9:00 AM'));
