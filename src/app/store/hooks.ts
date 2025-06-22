import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './index';

// Use throughout instead of plain `useDispatch` and `useSelector` for typing
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
// export const useAppStore = useStore.withTypes<AppStore>();
