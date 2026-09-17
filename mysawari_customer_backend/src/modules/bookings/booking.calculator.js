class BookingCalculator {
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getDistanceKm(pickup, dropoff) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      if (pickup && dropoff) {
        return Math.round(this.calculateHaversineDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude) * 1.3);
      }
      return 10;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup.latitude},${pickup.longitude}&destinations=${dropoff.latitude},${dropoff.longitude}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.rows[0].elements[0].status === "OK") {
        return Math.round(data.rows[0].elements[0].distance.value / 1000);
      }
    } catch(e) {
      console.error("Distance API Error", e);
    }
    return 50;
  }

  async calculateQuote(pickup, dropoff, couponCode) {
    const distanceKm = await this.getDistanceKm(pickup, dropoff);
    const RATE_PER_KM = 20;
    const baseCost = distanceKm * RATE_PER_KM;
    let discount = 0;

    if (couponCode === 'FIRST50') {
      discount = 50;
    } else if (couponCode === 'SAWARI10') {
      discount = Math.round(baseCost * 0.1);
    }

    const finalCost = Math.max(0, baseCost - discount);

    return {
      distanceKm,
      ratePerKm: RATE_PER_KM,
      baseCost,
      discount,
      finalCost
    };
  }
}

module.exports = BookingCalculator;
