import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { Header } from '@/components';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Enable LayoutAnimation for Android on older architecture
const isFabricEnabled = (global as any)?.nativeFabricUIManager != null;
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !isFabricEnabled) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  {
    id: '1',
    question: 'What if the car breaks down during my trip?',
    answer: 'Do not panic. Park the car safely on the side of the road and contact our 24/7 Roadside Assistance immediately via the app or call our emergency hotline. We will dispatch a mechanic or arrange a replacement vehicle as quickly as possible.'
  },
  {
    id: '2',
    question: 'Is fuel included in the rental cost?',
    answer: 'No, fuel is not included. You will receive the car with a full or partial tank, and you must return it with the exact same fuel level. Any missing fuel will be charged along with a convenience fee.'
  },
  {
    id: '3',
    question: 'How do I extend my booking?',
    answer: 'You can extend your booking directly from the "Bookings" tab in the app. Please ensure you extend it at least 2 hours before your original return time to avoid late fees. Extensions are subject to vehicle availability.'
  },
  {
    id: '4',
    question: 'Who pays for tolls and parking?',
    answer: 'The customer is responsible for all tolls, parking fees, and interstate permits during the rental period. Fastag is installed in all cars, and any Fastag deductions will be billed to you at the end of the trip.'
  },
  {
    id: '5',
    question: 'What happens in case of an accident?',
    answer: 'Ensure your safety first, then contact local authorities if necessary. Immediately notify our support team through the app. Do not attempt to repair the vehicle yourself. An insurance claim will be filed based on the police report and damage assessment.'
  }
];

export default function HelpScreen() {
  const colors = useColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header title="Help & FAQ" back={true} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Find quick answers to common questions about your rentals.
          </Text>

          <View style={styles.faqList}>
            {faqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.faqHeader} 
                    onPress={() => toggleExpand(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.questionText, { color: colors.foreground }]}>{faq.question}</Text>
                    <Feather 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.mutedForeground} 
                    />
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={[styles.answerText, { color: colors.mutedForeground }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={[styles.supportCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <View style={styles.supportHeader}>
              <Feather name="message-circle" size={24} color={colors.primaryText} />
              <Text style={[styles.supportTitle, { color: colors.foreground }]}>Still need help?</Text>
            </View>
            <Text style={[styles.supportSubtitle, { color: colors.mutedForeground }]}>
              Our support agents are available 24/7 to resolve your issues.
            </Text>
            <TouchableOpacity 
              style={[styles.chatButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL('https://wa.me/919876543210')}
            >
              <Text style={styles.chatButtonText}>Chat on WhatsApp</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  faqList: {
    gap: 12,
    marginBottom: 32,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginRight: 16,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  supportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  supportTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  supportSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  chatButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#101B2E',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  }
});
