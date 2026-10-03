import { calculateRentalDays } from './services/backend/pricingEngine';
console.log('1 to 2, 8am to 8am:', calculateRentalDays('1 Sep', '2 Sep', '8:00 AM', '8:00 AM'));
console.log('1 to 2, 8am to 9am:', calculateRentalDays('1 Sep', '2 Sep', '8:00 AM', '9:00 AM'));
console.log('1 to 1, 8am to 8am:', calculateRentalDays('1 Sep', '1 Sep', '8:00 AM', '8:00 AM'));
console.log('1 to 1, 8am to 9am:', calculateRentalDays('1 Sep', '1 Sep', '8:00 AM', '9:00 AM'));
