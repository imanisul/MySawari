import React from 'react';
import { View, Modal, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { InlineTripEditor } from '../booking/InlineTripEditor';

export function TripEditorModal({
  visible,
  onClose,
  onSave
}: {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Plan Your Trip</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.5 }]}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          
          <View style={styles.editorWrap}>
            <InlineTripEditor onSave={onSave} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  editorWrap: {
    flex: 1,
    paddingTop: 16,
  }
});
