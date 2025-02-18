import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

export const NoContent = ({
  doReload,
}: {
  doReload: (e: SyntheticEvent) => void;
}) => (
  <div className="text-center">
    <p>
      <CubeTransparentIcon />
    </p>
    <h1 className="mb-4 text-xl">No assets were found</h1>
    <a href="#" onClick={doReload} className="text-cyan-700 underline">
      Refresh
    </a>
  </div>
);
