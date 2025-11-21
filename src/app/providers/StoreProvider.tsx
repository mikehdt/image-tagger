'use client';

import { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { makeStore } from '../store';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  // Use lazy initialization to create the store only once
  const [store] = useState(() => makeStore());

  return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
