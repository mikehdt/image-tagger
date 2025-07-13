'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AssetList } from '../views/asset-list';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Check if a project is selected
  useEffect(() => {
    const selectedProject = sessionStorage.getItem('selectedProject');
    if (!selectedProject) {
      // No project selected, redirect to project selector
      router.push('/');
      return;
    }
  }, [router]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  return <AssetList currentPage={currentPage} />;
}
