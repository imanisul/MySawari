require('dotenv').config({ path: './mysawari_customer_backend/.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  const Vehicle = require('./mysawari_customer_backend/src/models/vehicle.model');
  const Booking = require('./mysawari_customer_backend/src/models/booking.model');
  
  const vehicles = await Vehicle.find({ isDeleted: false }).lean();
  const activeBookings = await Booking.find({
    status: { $in: ['confirmed', 'ongoing'] },
    toDate: { $gte: new Date(new Date().setHours(0,0,0,0)) },
    isDeleted: false
  }).lean();

  console.log(`Found ${vehicles.length} vehicles and ${activeBookings.length} active bookings`);
  
  let bookedVehiclesCount = 0;

  const vehiclesWithBookings = vehicles.map(vehicle => {
    const vehicleBookings = activeBookings.filter(b => b.vehicleId.toString() === vehicle._id.toString());
    if (vehicleBookings.length > 0) bookedVehiclesCount++;
    return {
      name: vehicle.vehicleName,
      bookedRanges: vehicleBookings.map(b => ({
        start: b.fromDate.toISOString(),
        end: b.toDate.toISOString()
      }))
    };
  });
  
  console.log(`Vehicles with active bookings: ${bookedVehiclesCount}`);
  if (bookedVehiclesCount > 0) {
    const sample = vehiclesWithBookings.find(v => v.bookedRanges.length > 0);
    console.log("Sample booked vehicle:", sample);
    
    // Simulate checkCarAvailability logic for "15 Sep" to "20 Sep"
    const selectedStart = new Date(new Date().getFullYear(), 8, 15).getTime(); // 15 Sep
    const selectedEnd = new Date(new Date().getFullYear(), 8, 20).getTime(); // 20 Sep
    
    console.log(`Searching dates: 15 Sep to 20 Sep`);
    
    const isOverlapping = sample.bookedRanges.some(range => {
      const bookedStart = new Date(range.start).getTime();
      const bookedStartNormalized = new Date(new Date(bookedStart).setHours(0,0,0,0)).getTime();
      const bookedEnd = new Date(range.end).getTime();
      const bookedEndNormalized = new Date(new Date(bookedEnd).setHours(23,59,59,999)).getTime();
      
      const overlap = (selectedStart <= bookedEndNormalized && selectedEnd >= bookedStartNormalized);
      console.log(`- Range ${range.start} to ${range.end} -> Overlaps? ${overlap}`);
      return overlap;
    });
  }

  process.exit(0);
}

run().catch(console.error);
