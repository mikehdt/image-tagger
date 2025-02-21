import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

export const NoContent = ({
  doReload,
}: {
  doReload: (e: SyntheticEvent) => void;
}) => (
  <div className="mx-auto w-1/4 text-center">
    <p>
      <CubeTransparentIcon />
    </p>
    <h1 className="mb-4 w-full text-xl">No assets were found</h1>
    <a href="#" onClick={doReload} className="text-cyan-700 underline">
      Refresh
    </a>
  </div>
);
