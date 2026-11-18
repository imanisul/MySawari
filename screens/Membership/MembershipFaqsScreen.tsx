import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FaqList } from '@/components/vehicle/details/CarDetailsSections';
import { SubPageHeader } from '@/components/vehicle/details/SubPageHeader';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { MEMBERSHIP_FAQS } from './membershipFaqs';

export default function MembershipFaqsScreen() {
  const p = useDetailsPalette();
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <SubPageHeader title="Membership FAQs" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FaqList items={MEMBERSHIP_FAQS} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 10, paddingBottom: 40 },
});
