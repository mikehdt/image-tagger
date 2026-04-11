'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { Modal } from '@/app/components/shared/modal';

import { AutoTaggerProgress } from './auto-tagger-progress';
import { AutoTaggerSettings } from './auto-tagger-settings';
import { AutoTaggerSummary } from './auto-tagger-summary';
import { useAutoTagger } from './use-auto-tagger';

type AutoTaggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: { fileId: string; fileExtension: string }[];
};

export function AutoTaggerModal({
  isOpen,
  onClose,
  selectedAssets,
}: AutoTaggerModalProps) {
  const router = useRouter();

  const {
    options,
    unselectOnComplete,
    isTagging,
    progress,
    summary,
    error,
    wasCancelled,
    hasReadyModel,
    modelItems,
    selectedModelId,
    insertModeOptions,
    handleModelChange,
    handleOptionChange,
    setUnselectOnComplete,
    handleClose,
    handleCancel,
    handleStartTagging,
  } = useAutoTagger({ isOpen, onClose, selectedAssets });

  const handleLeave = useCallback(() => {
    onClose();
    router.push('/');
  }, [onClose, router]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      preventClose={isTagging}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300">
          Auto-Tag Images
        </h2>

        {!hasReadyModel ? (
          <div className="rounded-md border border-amber-600 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <p className="font-medium">No models installed</p>
            <p className="mt-1">
              Please set up an auto-tagger model first using the project menu
              option.
            </p>
          </div>
        ) : isTagging ? (
          <AutoTaggerProgress
            progress={progress}
            onCancel={handleCancel}
            onLeave={handleLeave}
          />
        ) : summary ? (
          <AutoTaggerSummary
            summary={summary}
            wasCancelled={wasCancelled}
            onClose={handleClose}
          />
        ) : (
          <AutoTaggerSettings
            options={options}
            unselectOnComplete={unselectOnComplete}
            selectedModelId={selectedModelId}
            modelItems={modelItems}
            insertModeOptions={insertModeOptions}
            selectedAssetsCount={selectedAssets.length}
            error={error}
            onModelChange={handleModelChange}
            onOptionChange={handleOptionChange}
            onUnselectOnCompleteChange={() =>
              setUnselectOnComplete((prev) => !prev)
            }
            onClose={handleClose}
            onStartTagging={handleStartTagging}
          />
        )}
      </div>
    </Modal>
  );
}
