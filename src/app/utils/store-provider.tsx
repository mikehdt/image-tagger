'use client';
import { useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { AppStore, makeStore } from '../store';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>(undefined);
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return <ReduxProvider store={storeRef.current}>{children}</ReduxProvider>;
}
