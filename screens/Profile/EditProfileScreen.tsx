import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export default function EditProfileScreen() {
  const colors = useColors();
  const { customer, saveProfile } = useSawari();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [dob, setDob] = useState(customer.dob);
  const [gender, setGender] = useState(customer.gender);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObject, setDateObject] = useState(() => {
    if (customer.dob) {
      const parts = customer.dob.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    return new Date(2000, 0, 1);
  });

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObject(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setDob(`${day}/${month}/${year}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      await saveProfile({
        name,
        email,
        dob,
        gender
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      alert(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKycUpload = async () => {
    Alert.alert(
      "Upload Document",
      "Choose a method to upload your Driver's License or KYC Document",
      [
        {
          text: "Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 1,
            });
            if (!result.canceled) {
              Alert.alert('Success', 'Document photo captured successfully.');
              // Here you would upload result.assets[0].uri to backend
            }
          }
        },
        {
          text: "Photo Library",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Photo Library permission is required to select photos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 1,
            });
            if (!result.canceled) {
              Alert.alert('Success', 'Document selected successfully.');
              // Here you would upload result.assets[0].uri to backend
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          >
            <Text style={styles.saveText}>{isLoading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            
            {/* Joined On Badge */}
            <View style={styles.joinedContainer}>
              <View style={[styles.joinedBadge, { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1 }]}>
                <Feather name="calendar" size={14} color="#000000" style={styles.joinedIcon} />
                <Text style={[styles.joinedText, { color: "#000000" }]}>Member since {customer.joinedOn || 'recently'}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Mobile Number</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled, { backgroundColor: colors.background, borderColor: colors.border, color: colors.mutedForeground }]}
                value={customer.mobile}
                editable={false}
                placeholder="Mobile Number"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.helpText, { color: colors.mutedForeground }]}>Mobile number cannot be changed.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <View pointerEvents="none">
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    value={dob}
                    editable={false}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateObject}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Gender</Text>
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      gender === option && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text 
                      style={[
                        styles.genderText, 
                        { color: colors.foreground },
                        gender === option && { color: '#000000' }
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>KYC / Driver's License</Text>
              <TouchableOpacity 
                style={[styles.kycButton, { borderColor: colors.border, backgroundColor: colors.muted }]}
                onPress={handleKycUpload}
              >
                <Feather name="upload-cloud" size={20} color={colors.foreground} style={{ marginRight: 8 }} />
                <Text style={[styles.kycText, { color: colors.foreground }]}>Upload Document</Text>
              </TouchableOpacity>
              <Text style={[styles.helpText, { color: colors.mutedForeground }]}>Required for car rentals.</Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  scrollContent: {
    padding: 20,
  },
  joinedContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinedIcon: {
    marginRight: 6,
  },
  joinedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  helpText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  kycButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  kycText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
