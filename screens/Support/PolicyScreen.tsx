import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubPageHeader } from '@/components/vehicle/details/SubPageHeader';
import { useDetailsPalette, DetailsPalette } from '@/components/vehicle/details/detailsPalette';

// "Policy Agreements" page, from the Figma frame. Opened from the car details page
// (Policy Agreement → Learn More, Cancellation & Policy → View Terms & Condition).

/** A bullet, optionally with its own sub-bullets. */
type Point = string | { text: string; sub: string[] };
type Clause = { title: string; points: Point[]; note?: string };
type Policy = { title: string; clauses: Clause[] };

const RENTAL_CLAUSES: Clause[] = [
  {
    title: 'Fee Policy',
    points: [
      'The renter must be 18 years or older and hold a valid driving licence.',
      'A valid government-issued ID and driving licence must be submitted before vehicle handover.',
      'The name on the booking must match the documents provided.',
      'The vehicle can only be driven by the renter or additional drivers who have been approved and registered.',
      'The renter must provide accurate personal and booking information.',
      'MySawari reserves the right to refuse vehicle handover if required documents are missing, invalid, or cannot be verified.',
    ],
  },
  {
    title: 'Vehicle Handover',
    points: [
      'The vehicle will be provided in a roadworthy and reasonably clean condition.',
      'The renter should inspect the vehicle before starting the trip.',
      'Existing scratches, dents, or other visible damage should be reported before departure.',
      'The renter is responsible for the vehicle from the time of handover until it is returned and checked.',
      'Vehicle pickup and return must take place at the designated location and agreed time.',
      'Late pickup does not automatically extend the rental period.',
    ],
  },
  {
    title: 'Rental Duration',
    points: [
      { text: 'Standard Rental', sub: ['Rental duration: As selected during booking.', 'Included distance: 300 km', 'Additional distance: ₹75/km or the rate displayed during booking.'] },
      { text: 'Unlimited KM Package', sub: ['Unlimited kilometres are available only when the Unlimited KM package is selected and paid for.', 'Unlimited KM applies only during the booked rental period.'] },
    ],
    note: 'Important: The package selected during booking determines the applicable kilometre policy.',
  },
  {
    title: 'Fuel Policy',
    points: [
      'Fuel is not included in the rental price unless explicitly stated.',
      'The renter is responsible for fuel consumed during the rental.',
      'The vehicle should be returned with the fuel level agreed at pickup.',
      'Any fuel shortage or applicable refueling charge may be deducted from the security deposit/payment method.',
      'Only the recommended fuel type for the vehicle should be used.',
    ],
  },
  {
    title: 'Additional Kilometres',
    points: [
      'For Fixed KM bookings:',
      'The included distance is 300 km.',
      'Additional kilometres are charged at ₹75/km.',
      'The additional kilometre charge is calculated based on the final odometer reading.',
      'Any applicable additional KM charges must be paid before or after completion of the rental as specified by MySawari.',
    ],
  },
];

// The design uses the same clauses under all three headings for now; give each its own list when the final text is ready.
const POLICIES: Policy[] = [
  { title: 'Fee Policy', clauses: RENTAL_CLAUSES },
  { title: 'Terms & Condition', clauses: RENTAL_CLAUSES },
  { title: 'Privacy Policy', clauses: RENTAL_CLAUSES },
];

function Bullet({ text, p, indent = 0 }: { text: string; p: DetailsPalette; indent?: number }) {
  return (
    <View style={[styles.bulletRow, { paddingLeft: 6 + indent * 14 }]}>
      <View style={[styles.bulletDot, { backgroundColor: p.muted }]} />
      <Text style={[styles.bulletText, { color: p.muted }]}>{text}</Text>
    </View>
  );
}

export default function PolicyScreen() {
  const p = useDetailsPalette();
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <SubPageHeader title="Policy Agreements" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {POLICIES.map((policy, pi) => (
          <View key={policy.title} style={pi > 0 && { marginTop: 28 }}>
            <Text style={[styles.policyTitle, { color: p.fg }]}>{policy.title}</Text>
            {policy.clauses.map((clause, ci) => (
              <View key={clause.title} style={{ marginTop: ci === 0 ? 14 : 18 }}>
                <Text style={[styles.clauseTitle, { color: p.fg }]}>{ci + 1}.  {clause.title}</Text>
                <View style={{ gap: 3 }}>
                  {clause.points.map((pt) =>
                    typeof pt === 'string' ? (
                      <Bullet key={pt} text={pt} p={p} />
                    ) : (
                      <View key={pt.text} style={{ gap: 3 }}>
                        <Bullet text={pt.text} p={p} />
                        {pt.sub.map((s) => <Bullet key={s} text={s} p={p} indent={1} />)}
                      </View>
                    ),
                  )}
                </View>
                {!!clause.note && <Text style={[styles.note, { color: p.muted }]}>{clause.note}</Text>}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  policyTitle: { fontFamily: 'Inter_500Medium', fontSize: 15.5 },
  clauseTitle: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 7, marginRight: 8 },
  bulletText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 3 },
});
