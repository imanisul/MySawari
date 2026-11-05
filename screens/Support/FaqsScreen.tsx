import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAQS, FaqList } from '@/components/vehicle/details/CarDetailsSections';
import { SubPageHeader } from '@/components/vehicle/details/SubPageHeader';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/** Every FAQ, opened from "View More" on the car details page. Layout follows the Figma FAQs frame. */
export default function FaqsScreen() {
  const p = useDetailsPalette();
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <SubPageHeader title="FAQs" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FaqList items={FAQS} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 10, paddingBottom: 40 },
});
