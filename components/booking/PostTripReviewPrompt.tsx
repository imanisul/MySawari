import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { ReviewModal, ReviewTrip } from './ReviewModal';

// Device-local memory of trips whose prompt was dismissed ("Maybe later"); the
// review can still be written from the Bookings screen.
const DISMISSED_KEY = '@review_prompt_dismissed';

/**
 * Once a trip has been completed (the vehicle is returned), asks the customer
 * to review it. Checks on launch and every time the app comes back to the
 * foreground, since the trip is usually closed while the app is in the background.
 */
export function PostTripReviewPrompt() {
  const { isAuthenticated, isAuthLoading } = useSawari();
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  const [ready, setReady] = useState(false);

  const { data: pending = [], refetch } = useQuery({
    queryKey: ['pendingReviews'],
    queryFn: () => API.reviews.pending(),
    enabled: isAuthenticated === true && !isAuthLoading,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then(raw => setDismissed(raw ? JSON.parse(raw) : []))
      .catch(() => setDismissed([]));
  }, []);

  // Give the home screen a moment to settle before asking for anything.
  useEffect(() => {
    if (isAuthenticated !== true || isAuthLoading) {
      setReady(false);
      return;
    }
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && isAuthenticated === true) refetch();
    });
    return () => sub.remove();
  }, [isAuthenticated, refetch]);

  const next = dismissed === null ? undefined : pending.find(p => !dismissed.includes(p.bookingId));

  // The trip being reviewed is held here so the sheet doesn't change under the
  // customer's hands when the pending list refreshes after they submit.
  const [active, setActive] = useState<ReviewTrip | null>(null);
  const promptedThisSession = useRef(false);

  useEffect(() => {
    if (ready && next && !active && !promptedThisSession.current) {
      promptedThisSession.current = true; // one automatic prompt per session, not a chain of them
      setActive({ bookingId: next.bookingId, carId: next.carId, vehicleName: next.vehicleName });
    }
  }, [ready, next, active]);

  const close = useCallback(() => {
    if (active) {
      const updated = [...(dismissed || []), active.bookingId];
      setDismissed(updated);
      AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(updated)).catch(() => {});
    }
    setActive(null);
  }, [active, dismissed]);

  return <ReviewModal trip={active} onClose={close} />;
}
