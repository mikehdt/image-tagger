'use client';

import { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { makeStore } from '../store';
import { subscribePreferencesPersistence } from '../store/preferences';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // Use lazy initialization to create the store only once
  const [store] = useState(() => {
    const s = makeStore();
    subscribePreferencesPersistence(s);
    return s;
  });

  return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
