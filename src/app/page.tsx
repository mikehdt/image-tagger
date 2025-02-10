'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { LoadState } from './types/load-state';
import type { ImageAsset } from './types/image-asset';
import { getImageFiles } from './utils/asset-actions';
import { AssetList } from './asset-list';

export default function Home() {
  const initialLoad = useRef<boolean>(true);
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [loadState, setLoadState] = useState<LoadState>(
    LoadState.Uninitialized,
  );

  // Could accept 'optimistic' assets and set them, then load?
  const loadImageAssets = useCallback(async () => {
    if (
      loadState === LoadState.Loaded ||
      (imageAssets.length > 0 && loadState === LoadState.Reload)
    ) {
      setLoadState(LoadState.Reload);
    } else {
      setLoadState(LoadState.InitialLoad);
    }

    const newImageAssets = await getImageFiles();

    setImageAssets(newImageAssets);
    setLoadState(LoadState.Loaded);
  }, [imageAssets, loadState]);

  const patchImageAssetTags = (imageId: string, newTags: string[]) => {
    const patchedImageAssets = imageAssets.map((img): ImageAsset => {
      // It's assumed this function will always complete faster than a disk I/O
      if (img.fileId === imageId) {
        // Patch optimistically
        return {
          ...img,
          tags: newTags,
        };
      }

      return img;
    });

    setImageAssets(patchedImageAssets);
  };

  // Only trigger once on initial load
  useEffect(() => {
    if (initialLoad.current) loadImageAssets();

    initialLoad.current = false;
  }, [initialLoad, loadImageAssets]);

  return (
    <div className="min-h-screen items-center justify-items-center px-8 py-20 font-[family-name:var(--font-geist-sans)]">
      <AssetList
        imageAssets={imageAssets}
        reloadAssets={loadImageAssets}
        loadState={loadState}
        patchAssetTags={patchImageAssetTags}
      />
    </div>
  );
}
