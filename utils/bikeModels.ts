import models from '@/constants/bikeModels.json';

/**
 * Transmission of a two-wheeler from its model: scooters are gearless ("Automatic"), motorcycles are geared ("Manual").
 * The vehicle records have this typed in by hand and it was wrong for some (a Jawa listed as Automatic, an NTorq as
 * Manual), so a recognised model decides it. null = model not in the list: the record's own value is used.
 */
export function bikeTransmissionFor(name: string | undefined | null): 'Automatic' | 'Manual' | null {
  const n = String(name || '').toLowerCase();
  if (!n) return null;
  if (models.scooters.some((m) => n.includes(m))) return 'Automatic';
  if (models.geared.some((m) => n.includes(m))) return 'Manual';
  return null;
}
