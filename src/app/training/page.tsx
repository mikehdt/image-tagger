'use client';

import { useCallback } from 'react';

import { TrainingConfigForm } from '../components/training/training-config-form/training-config-form';

export default function TrainingPage() {
  const handleStartTraining = useCallback(
    async (config: Record<string, unknown>) => {
      // TODO: Wire up to /api/training/start
      console.log('Start training with config:', config);
    },
    [],
  );

  return (
    <div className="py-6">
      <TrainingConfigForm onStartTraining={handleStartTraining} />
    </div>
  );
}
