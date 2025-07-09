'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

import { Button } from '../components/shared/button';

type NoContentProps = { onReload: () => void };

export const NoContent = ({ onReload }: NoContentProps) => {
  const doReload = (e: SyntheticEvent) => {
    e.preventDefault();
    onReload();
  };

  return (
    <div className="mx-auto flex w-full max-w-120 min-w-80 flex-wrap justify-center px-4 py-20 text-center">
      <CubeTransparentIcon className="w-full max-w-80 text-slate-500" />

      <h1 className="mt-4 mb-4 w-full text-xl text-slate-500">
        No assets were found
      </h1>

      <p className="mt-4 flex w-full justify-center">
        <Button onClick={doReload} size="mediumWide">
          Refresh
        </Button>
      </p>
    </div>
  );
};
