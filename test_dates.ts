import { cars, resultCars } from './utils/sawari';
cars.concat(resultCars).forEach(c => {
  if (c.availabilityDate || c.availableToDate) {
    console.log(`Car: ${c.name}, availabilityDate: ${c.availabilityDate}, availableToDate: ${c.availableToDate}`);
  }
});
