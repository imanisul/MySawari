export const vehicleImages: Record<string, any> = {
  'alto_800': require('../assets/images/vehicles/alto_800.jpg'),
  'alto_k10': require('../assets/images/vehicles/alto_k10.jpg'),
  'santro': require('../assets/images/vehicles/santro.jpg'),
  'wagonr': require('../assets/images/vehicles/wagonr.jpg'),
  'grand_i10': require('../assets/images/vehicles/grand_i10.jpg'),
  'ignis': require('../assets/images/vehicles/ignis.jpg'),
  'tiago': require('../assets/images/vehicles/tiago.jpg'),
  'glanza': require('../assets/images/vehicles/glanza.jpg'),
  'tigor': require('../assets/images/vehicles/tigor.jpg'),
  'baleno': require('../assets/images/vehicles/baleno.jpg'),
  'punch': require('../assets/images/vehicles/punch.jpg'),
  'dzire': require('../assets/images/vehicles/dzire.jpg'),
  'aura': require('../assets/images/vehicles/aura.jpg'),
  'i20': require('../assets/images/vehicles/i20.jpg'),
  'altroz': require('../assets/images/vehicles/altroz.jpg'),
  'ciaz': require('../assets/images/vehicles/ciaz.jpg'),
  'fronx': require('../assets/images/vehicles/fronx.jpg'),
  'taisor': require('../assets/images/vehicles/taisor.jpg'),
  'brezza': require('../assets/images/vehicles/brezza.jpg'),
  'xuv300': require('../assets/images/vehicles/xuv300.jpg'),
  'nexon': require('../assets/images/vehicles/nexon.jpg'),
  'triber': require('../assets/images/vehicles/triber.jpg'),
  'bolero': require('../assets/images/vehicles/bolero.jpg'),
  'scorpio': require('../assets/images/vehicles/scorpio.jpg'),
  'innova_hycross': require('../assets/images/vehicles/innova_hycross.jpg'),
  'pleasure': require('../assets/images/vehicles/pleasure.jpg'),
  'yamaha_fascino': require('../assets/images/vehicles/yamaha_fascino.jpg'),
  'ntorq': require('../assets/images/vehicles/ntorq.jpg'),
  'hunter_350': require('../assets/images/vehicles/hunter_350.jpg'),
  'scram_411': require('../assets/images/vehicles/scram_411.jpg'),
  'creta': require('../assets/images/vehicles/creta.jpg'),
  'celerio': require('../assets/images/vehicles/celerio.jpg'),
  'ertiga': require('../assets/images/vehicles/ertiga.jpg'),
  'venue': require('../assets/images/vehicles/venue.jpg'),
  'activa_6g': require('../assets/images/vehicles/activa_6g.jpg'),
  'amaze': require('../assets/images/vehicles/amaze.jpg'),
  'avenis': require('../assets/images/vehicles/avenis.jpg'),
  'jawa': require('../assets/images/vehicles/jawa.jpg'),
  'xpulse_200': require('../assets/images/vehicles/xpulse_200.jpg'),
};

export const getVehicleImage = (vehicleName: string, isBike: boolean) => {
  const normalized = String(vehicleName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Try exact match
  if (vehicleImages[normalized]) return vehicleImages[normalized];
  
  // Try partial match
  for (const key of Object.keys(vehicleImages)) {
    if (normalized.includes(key)) {
      return vehicleImages[key];
    }
  }
  
  return isBike ? require('../assets/images/hunter.jpg') : require('../assets/images/swift.jpg');
};
