import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSawari } from '@/context/SawariContext';
import { CustomAlert } from '@/components';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Design tokens (from Figma) ────────────────────────────────────────────────
const T = {
  white: '#FFFFFF',
  neutral800: '#262626',
  neutral500: '#737373',
  neutral400: '#A3A3A3',
  neutral300: '#D4D4D4',
  neutral200: '#E5E5E5',
  neutral100: '#F5F5F5',
  neutral50: '#FAFAFA',
  primary500: '#2F3E75',
};

const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

type FieldKey = 'name' | 'email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Field ────────────────────────────────────────────────────────────────────
type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  editing: boolean;
  dimmed: boolean; // another field is being edited
  showEditIcon: boolean;
  onStartEdit: () => void;
  draft: string;
  onChangeDraft: (v: string) => void;
  onUpdate: () => void;
  onCancel: () => void;
  saving: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
};

function ProfileField({
  label,
  value,
  placeholder,
  editing,
  dimmed,
  showEditIcon,
  onStartEdit,
  draft,
  onChangeDraft,
  onUpdate,
  onCancel,
  saving,
  keyboardType = 'default',
  autoCapitalize = 'words',
}: FieldProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [editing]);

  return (
    <View style={[styles.fieldGroup, editing && styles.fieldGroupEditing]}>
      <View style={styles.fieldInner}>
        <Text style={styles.label}>{label}</Text>

        {editing ? (
          <View style={[styles.box, styles.boxActive]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, styles.inputActive]}
              value={draft}
              onChangeText={onChangeDraft}
              placeholder={placeholder}
              placeholderTextColor={T.neutral400}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onUpdate}
              editable={!saving}
              selectionColor={T.primary500}
            />
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.box}
            onPress={onStartEdit}
            disabled={dimmed}
            accessibilityLabel={`Edit ${label}`}
          >
            <Text style={[styles.input, !value && styles.placeholder]} numberOfLines={1}>
              {value || placeholder}
            </Text>
            {showEditIcon && <Feather name="edit" size={16} color={T.primary500} />}
          </TouchableOpacity>
        )}
      </View>

      {editing && (
        <View style={styles.ctaRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.cta, styles.ctaPrimary, saving && { opacity: 0.8 }]}
            onPress={onUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={T.white} size="small" />
            ) : (
              <Text style={[styles.ctaText, { color: T.white }]}>Update</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.cta, styles.ctaSecondary]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={[styles.ctaText, { color: T.neutral800 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { customer, saveProfile } = useSawari();
  const router = useRouter();

  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentValues: Record<FieldKey, string> = {
    name: customer.name || '',
    email: customer.email || '',
  };

  const startEdit = (field: FieldKey) => {
    if (isLoading) return;
    Haptics.selectionAsync();
    setDraft(currentValues[field]);
    setEditingField(field);
  };

  const cancelEdit = () => {
    Haptics.selectionAsync();
    setEditingField(null);
    setDraft('');
  };

  const handleUpdate = async () => {
    if (!editingField) return;
    const value = draft.trim();

    if (editingField === 'name' && !value) {
      CustomAlert.alert('Name required', 'Name is required.');
      return;
    }
    if (editingField === 'email' && value && !EMAIL_REGEX.test(value)) {
      CustomAlert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    // Nothing changed → just close the editor.
    if (value === currentValues[editingField]) {
      setEditingField(null);
      return;
    }

    try {
      setIsLoading(true);
      await saveProfile({
        name: editingField === 'name' ? value : customer.name,
        email: editingField === 'email' ? value : customer.email,
        // Keep the fields that aren't on this screen unchanged.
        dob: customer.dob,
        gender: customer.gender,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingField(null);
      setDraft('');
    } catch (error: any) {
      CustomAlert.alert('Update failed', error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhonePress = () => {
    Haptics.selectionAsync();
    CustomAlert.alert('Phone Number', 'Mobile number cannot be changed.');
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={T.neutral800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <ProfileField
              label="Name"
              value={currentValues.name}
              placeholder="Enter your name"
              editing={editingField === 'name'}
              dimmed={editingField !== null && editingField !== 'name'}
              showEditIcon
              onStartEdit={() => startEdit('name')}
              draft={draft}
              onChangeDraft={setDraft}
              onUpdate={handleUpdate}
              onCancel={cancelEdit}
              saving={isLoading}
            />

            {/* Phone — read only */}
            <View style={styles.fieldInner}>
              <Text style={styles.label}>Phone Number</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.box, styles.boxPhone]}
                onPress={handlePhonePress}
                disabled={editingField !== null}
              >
                <Text style={[styles.input, !customer.mobile && styles.placeholder]} numberOfLines={1}>
                  {customer.mobile || 'Mobile Number'}
                </Text>
                <Feather name="edit" size={16} color={T.primary500} />
              </TouchableOpacity>
            </View>

            <ProfileField
              label="Email Address"
              value={currentValues.email}
              placeholder="Enter your email address"
              editing={editingField === 'email'}
              dimmed={editingField !== null && editingField !== 'email'}
              showEditIcon={!!currentValues.email}
              onStartEdit={() => startEdit('email')}
              draft={draft}
              onChangeDraft={setDraft}
              onUpdate={handleUpdate}
              onCancel={cancelEdit}
              saving={isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.white,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.neutral300,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 26,
    color: T.neutral800,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },

  // Field
  fieldGroup: {},
  fieldGroupEditing: {
    gap: 12,
  },
  fieldInner: {
    gap: 4,
  },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    lineHeight: 16,
    color: T.neutral500,
    textTransform: 'uppercase',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.neutral50,
    borderWidth: 1,
    borderColor: T.neutral200,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  boxPhone: {
    height: 52,
  },
  boxActive: {
    borderColor: T.neutral400,
  },
  input: {
    flex: 1,
    fontFamily: FONT.medium,
    fontSize: 15,
    lineHeight: 22,
    color: T.neutral500,
    paddingVertical: 12,
  },
  inputActive: {
    color: T.neutral800,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  placeholder: {
    color: T.neutral400,
  },

  // CTAs
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cta: {
    flex: 1,
    height: 47,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  ctaPrimary: {
    backgroundColor: T.primary500,
  },
  ctaSecondary: {
    backgroundColor: T.neutral50,
  },
  ctaText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});