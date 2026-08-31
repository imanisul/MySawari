import React, { createContext, useContext, useMemo, useState } from 'react';
import { Car, cars, DriverMode } from '@/lib/sawari';

export type PaymentMethod = 'UPI' | 'Card' | 'Net banking';
export type BookingStatus = 'upcoming' | 'active';

type SawariContextValue = {
  mode: DriverMode;
  selectedCar: Car;
  bookingConfirmed: boolean;
  pickup: string;
  dateRange: string;
  duration: string;
  pickupTime: string;
  returnTime: string;
  paymentMethod: PaymentMethod;
  paymentAttempts: number;
  bookingStatus: BookingStatus;
  customer: {
    name: string;
    mobile: string;
    email: string;
    license: string;
  };
  setMode: (mode: DriverMode) => void;
  selectCar: (car: Car) => void;
  setPickup: (pickup: string) => void;
  setDates: (dateRange: string, duration: string) => void;
  setTimes: (pickupTime: string, returnTime: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  updateCustomer: (field: 'name' | 'mobile' | 'email' | 'license', value: string) => void;
  payBooking: () => void;
  confirmBooking: () => void;
  setBookingStatus: (status: BookingStatus) => void;
  clearBooking: () => void;
};

const SawariContext = createContext<SawariContextValue | null>(null);

export function SawariProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DriverMode>('Self Drive');
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [pickup, setPickup] = useState('Bikaner');
  const [dateRange, setDateRange] = useState('17 Aug – 20 Aug');
  const [duration, setDuration] = useState('3 days');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnTime, setReturnTime] = useState('10:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('upcoming');
  const [customer, setCustomer] = useState({
    name: 'Jatin Prajapat',
    mobile: '',
    email: 'jatinprajapat682@gmail.com',
    license: '',
  });

  const value = useMemo(
    () => ({
      mode,
      selectedCar,
      bookingConfirmed,
      pickup,
      dateRange,
      duration,
      pickupTime,
      returnTime,
      paymentMethod,
      paymentAttempts,
      bookingStatus,
      customer,
      setMode,
      selectCar: setSelectedCar,
      setPickup,
      setDates: (nextDateRange: string, nextDuration: string) => {
        setDateRange(nextDateRange);
        setDuration(nextDuration);
      },
      setTimes: (nextPickupTime: string, nextReturnTime: string) => {
        setPickupTime(nextPickupTime);
        setReturnTime(nextReturnTime);
      },
      setPaymentMethod,
      updateCustomer: (field: 'name' | 'mobile' | 'email' | 'license', value: string) => {
        setCustomer((current) => ({ ...current, [field]: value }));
      },
      payBooking: () => {
        setPaymentAttempts((attempts) => attempts + 1);
      },
      confirmBooking: () => setBookingConfirmed(true),
      setBookingStatus,
      clearBooking: () => {
        setBookingConfirmed(false);
        setPaymentAttempts(0);
      },
    }),
    [
      bookingConfirmed,
      bookingStatus,
      customer,
      dateRange,
      duration,
      mode,
      paymentAttempts,
      paymentMethod,
      pickup,
      pickupTime,
      returnTime,
      selectedCar,
    ],
  );

  return <SawariContext.Provider value={value}>{children}</SawariContext.Provider>;
}

export function useSawari() {
  const context = useContext(SawariContext);
  if (!context) {
    throw new Error('useSawari must be used inside SawariProvider');
  }
  return context;
}