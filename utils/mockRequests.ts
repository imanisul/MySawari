import AsyncStorage from '@react-native-async-storage/async-storage';

const EXTENSION_KEY = '@mysawari_pending_extensions';
const REFUND_KEY = '@mysawari_pending_refunds';

export type PendingExtension = {
  bookingId: string;
  daysToAdd: number;
  additionalAmount: number;
  requestedAt: string;
};

export type PendingRefund = {
  bookingId: string;
  refundAmount: number;
  requestedAt: string;
};

export const MockRequests = {
  // --- Extensions ---
  async requestExtension(extension: PendingExtension) {
    const existing = await this.getPendingExtensions();
    existing.push(extension);
    await AsyncStorage.setItem(EXTENSION_KEY, JSON.stringify(existing));
  },

  async getPendingExtensions(): Promise<PendingExtension[]> {
    try {
      const data = await AsyncStorage.getItem(EXTENSION_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getExtensionForBooking(bookingId: string): Promise<PendingExtension | null> {
    const extensions = await this.getPendingExtensions();
    return extensions.find(e => e.bookingId === bookingId) || null;
  },

  async approveExtension(bookingId: string) {
    const extensions = await this.getPendingExtensions();
    const filtered = extensions.filter(e => e.bookingId !== bookingId);
    await AsyncStorage.setItem(EXTENSION_KEY, JSON.stringify(filtered));
  },

  // --- Refunds ---
  async requestRefund(refund: PendingRefund) {
    const existing = await this.getPendingRefunds();
    existing.push(refund);
    await AsyncStorage.setItem(REFUND_KEY, JSON.stringify(existing));
  },

  async getPendingRefunds(): Promise<PendingRefund[]> {
    try {
      const data = await AsyncStorage.getItem(REFUND_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async getRefundForBooking(bookingId: string): Promise<PendingRefund | null> {
    const refunds = await this.getPendingRefunds();
    return refunds.find(r => r.bookingId === bookingId) || null;
  },

  async approveRefund(bookingId: string) {
    const refunds = await this.getPendingRefunds();
    const filtered = refunds.filter(r => r.bookingId !== bookingId);
    await AsyncStorage.setItem(REFUND_KEY, JSON.stringify(filtered));
  }
};
