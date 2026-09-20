import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications, markAllAsRead } = useSawari();

  // Mark all as read when screen is opened
  useEffect(() => {
    markAllAsRead();
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bell-off" size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        When you get updates about your bookings, they will appear here.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, notifications.length === 0 && { flex: 1 }]}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => {
          const date = new Date(item.date);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString([], { day: 'numeric', month: 'short' });

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.tintLight }]}>
                  <Feather name="bell" size={16} color={colors.foreground} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {dateString} • {timeString}
                  </Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>

              {item.image && (
                <Image source={{ uri: item.image }} style={styles.attachedImage} resizeMode="cover" />
              )}
              
              {!!item.body && (
                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{item.body}</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  list: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  attachedImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 12,
  },
  cardBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
