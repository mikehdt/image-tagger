import type { SyntheticEvent } from 'react';

export const NoContent = ({
  doReload,
}: {
  doReload: (e: SyntheticEvent) => void;
}) => (
  <div>
    <h1>No assets were found</h1>
    <a href="#" onClick={doReload}>
      Refresh
    </a>
  </div>
);
