'use client';

import { useCallback } from 'react';

import { TrainingConfigForm } from './components/training-config-form/training-config-form';
import { useAppDispatch } from '../store/hooks';
import { startMockTraining } from '../store/training/mock-training';

export default function TrainingPage() {
  const dispatch = useAppDispatch();

  const handleStartTraining = useCallback(
    (config: Record<string, unknown>) => {
      dispatch(startMockTraining(config));
    },
    [dispatch],
  );

  return (
    <div className="py-6">
      <TrainingConfigForm onStartTraining={handleStartTraining} />
    </div>
  );
}
