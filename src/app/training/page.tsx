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
    <div className="px-4 py-6">
      <div className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-xl font-semibold text-(--foreground)">Training</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure and start a LoRA training run
        </p>
      </div>

      <TrainingConfigForm onStartTraining={handleStartTraining} />
    </div>
  );
}
