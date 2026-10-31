import React from 'react';
import { LoginBottomSheet } from './LoginBottomSheet';

/**
 * "Get started with My Sawari" prompt shown on Home for signed-out customers.
 *
 * It used to be a separate phone-only sheet that sent the OTP and then opened LoginBottomSheet, which started
 * again at an empty phone field (the number had to be typed twice and a second OTP was sent). It now opens the
 * one sign-in sheet, which runs phone → code → profile itself.
 *
 * `onLoginSuccess` runs once the customer is signed in (not when the code is sent, as before).
 */
export function PhoneNumberSheet({
  visible,
  onClose,
  onLoginSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}) {
  return <LoginBottomSheet visible={visible} onClose={onClose} onLoginSuccess={onLoginSuccess} required />;
}