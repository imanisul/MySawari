import React, { createContext, useContext } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';

const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

export function BlurTargetProvider({
  target,
  children,
}: {
  target: RefObject<View | null>;
  children: React.ReactNode;
}) {
  return <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>;
}

export function useBlurTarget() {
  return useContext(BlurTargetContext);
}
