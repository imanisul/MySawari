import React, { useEffect, useState } from 'react';
import { useSawari } from '@/context/SawariContext';
import { onSplashGone } from '@/components/common/AnimatedSplash';
import { LoginBottomSheet } from './LoginBottomSheet';

/**
 * Mandatory Login Gate:
 * Sits at root of the app, covering all routes.
 * When a user is not logged in (!isAuthenticated), the login sheet is displayed immediately.
 * No bypass, no skipping, no exploring without authentication.
 */
export function LoginGate() {
  const { isAuthLoading, isAuthenticated } = useSawari();
  const [open, setOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // When launch splash is finished or if already gone, mark splashDone
    return onSplashGone(() => {
      setSplashDone(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && splashDone) {
      setOpen(true);
    } else if (isAuthenticated) {
      setOpen(false);
    }
  }, [isAuthLoading, isAuthenticated, splashDone]);

  // While checking saved session from SecureStore, wait
  if (isAuthLoading) return null;

  // If authenticated and the sheet finished closing, gate is unmounted completely
  if (isAuthenticated && !open) return null;

  return (
    <LoginBottomSheet
      visible={open && !isAuthenticated ? true : (!isAuthLoading && !isAuthenticated && splashDone)}
      onClose={() => {
        setOpen(false);
      }}
      required
    />
  );
}
