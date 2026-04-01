import { useCallback, useId, useRef, useState } from 'react';

import { usePopup } from '@/app/components/shared/popup';
import {
  getProjectFolders,
  getProjectList,
  type Project,
} from '@/app/utils/project-actions';

import type { DatasetFolder } from '../training-config-form/use-training-config-form';

export function useProjectPicker({
  excludeFolders,
  onSelect,
}: {
  excludeFolders: string[];
  onSelect: (
    folderName: string,
    displayName: string,
    folders: DatasetFolder[],
    thumbnail?: string,
    thumbnailVersion?: number,
  ) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();
  const popupId = `project-picker-${useId()}`;
  const { isOpen, shouldRender } = getPopupState(popupId);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingFolder, setSelectingFolder] = useState<string | null>(null);

  const open = useCallback(async () => {
    openPopup(popupId, { position: 'bottom-left', triggerRef });
    setLoading(true);
    try {
      const list = await getProjectList();
      // Filter out empty projects
      setProjects(list.filter((p) => (p.imageCount ?? 0) > 0));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [openPopup, popupId]);

  const close = useCallback(() => {
    closePopup(popupId);
  }, [closePopup, popupId]);

  const selectProject = useCallback(
    async (project: Project) => {
      if (excludeFolders.includes(project.name)) return;

      setSelectingFolder(project.name);
      try {
        const details = await getProjectFolders(project.name);
        const folders: DatasetFolder[] = details.map((f) => ({
          ...f,
          overrideRepeats: null,
        }));
        onSelect(
          project.name,
          project.title || project.name,
          folders,
          project.thumbnail || undefined,
          project.thumbnailVersion,
        );
        close();
      } finally {
        setSelectingFolder(null);
      }
    },
    [excludeFolders, onSelect, close],
  );

  return {
    triggerRef,
    popupId,
    isOpen,
    shouldRender,
    projects,
    loading,
    selectingFolder,
    open,
    close,
    selectProject,
  };
}
