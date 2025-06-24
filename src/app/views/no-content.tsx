'use client';

import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

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

      <a
        href="#"
        onClick={doReload}
        className="rounded-sm bg-slate-200 px-4 py-1 transition-colors hover:bg-slate-400 hover:text-white"
      >
        Refresh
      </a>
    </div>
  );
};
