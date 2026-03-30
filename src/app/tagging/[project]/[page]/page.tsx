'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectProjectFolderName,
  setProjectInfo,
} from '../../../store/project';
import { AssetList } from '../../../views/asset-list';

export default function TaggingPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const project = decodeURIComponent(params.project as string);
  const currentPage = parseInt(params.page as string, 10) || 1;

  // Check if this project is already loaded in Redux (avoids re-dispatch on pagination)
  const loadedProject = useAppSelector(selectProjectFolderName);

  useEffect(() => {
    if (!project) {
      router.replace('/');
      return;
    }

    // Only update Redux if the project changed (not on page navigation)
    if (loadedProject !== project) {
      dispatch(
        setProjectInfo({
          name: project,
          path: project,
          folderName: project,
        }),
      );
    }
  }, [project, loadedProject, dispatch, router]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  if (!project) return null;

  return <AssetList currentPage={currentPage} />;
}
