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
    <div className="mx-auto w-1/4 py-20 text-center">
      <p className="text-slate-500">
        <CubeTransparentIcon />
      </p>

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
