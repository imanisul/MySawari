import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Header } from '@/components';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SafetyScreen() {
  const colors = useColors();

  const safetyFeatures = [
    {
      id: '1',
      title: '100% Sanitized Vehicles',
      description: 'Every car undergoes a rigorous 5-step deep cleaning and sanitization process before delivery.',
      icon: 'shield',
      color: '#34D399'
    },
    {
      id: '2',
      title: '24/7 Roadside Assistance',
      description: 'Stuck somewhere? Our dedicated response team is available round-the-clock for towing and mechanical support.',
      icon: 'tool',
      color: '#FBBF24'
    },
    {
      id: '3',
      title: 'GPS Tracking & SOS',
      description: 'All vehicles are equipped with active GPS tracking and a built-in SOS button for immediate emergency dispatch.',
      icon: 'map-pin',
      color: '#60A5FA'
    },
    {
      id: '4',
      title: 'Verified Customer Identity',
      description: 'We ensure a safe ecosystem by strictly verifying the identities and licenses of all users on the platform.',
      icon: 'user-check',
      color: '#A78BFA'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header title="Safety First" back={true} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Banner */}
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.heroIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="shield" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Your Safety is Our Priority</Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              Whether you're driving in the city or exploring the highways, we have implemented strict protocols to ensure your peace of mind.
            </Text>
          </View>

          {/* Safety Features List */}
          <View style={styles.featuresList}>
            {safetyFeatures.map((feature) => (
              <View key={feature.id} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Feather name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={[styles.contactCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Feather name="phone-call" size={24} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>Need Emergency Help?</Text>
            <Text style={[styles.contactSubtitle, { color: colors.mutedForeground }]}>Our safety team is always ready to assist you.</Text>
            <Text style={[styles.contactNumber, { color: colors.primary }]}>+91 1800-SAWARI-99</Text>
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
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  contactTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 6,
  },
  contactSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  contactNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  }
});
