import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Header } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const colors = useColors();
  const { logout, isDarkMode, toggleDarkMode } = useSawari();
  const router = useRouter();

  // Mock settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header title="Settings" back={true} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferences</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Push Notifications */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>Push Notifications</Text>
                <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>Receive updates on your rides and offers</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setNotificationsEnabled(val);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Location Services */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>Location Services</Text>
                <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>Allow access to your precise location</Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setLocationEnabled(val);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Dark Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>Experience MySawari in dark theme</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  toggleDarkMode(val);
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Account</Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color={colors.foreground} style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
          
          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>MySawari v1.0.0</Text>
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
    fontSize: 18,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  versionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  }
});
