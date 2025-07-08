'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { AssetList } from '../views/asset-list';

export default function Page() {
  const params = useParams();
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  return <AssetList currentPage={currentPage} />;
}
