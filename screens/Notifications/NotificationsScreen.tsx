import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { NotificationsAPI, BackendNotification } from '@/services/api/notifications';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    const data = await NotificationsAPI.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handlePressNotification = async (item: BackendNotification) => {
    if (!item.isRead) {
      const success = await NotificationsAPI.markAsRead(item.id);
      if (success) {
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      }
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bell-off" size={48} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications yet</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
        When you get updates about your bookings, they will appear here.
      </Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const date = new Date(item.createdAt);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString([], { day: 'numeric', month: 'short' });

          return (
            <Pressable 
              onPress={() => handlePressNotification(item)}
              style={({ pressed }) => [
                styles.card, 
                { backgroundColor: item.isRead ? colors.card : colors.tintLight, borderColor: colors.border },
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.tint }]}>
                  <Feather name="bell" size={16} color="#fff" />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                    {dateString} • {timeString}
                  </Text>
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>

              {item.data?.image && (
                <Image source={{ uri: item.data.image }} style={styles.attachedImage} resizeMode="cover" />
              )}
              
              {!!item.body && (
                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{item.body}</Text>
              )}
            </Pressable>
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
