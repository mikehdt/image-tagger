import { memo, useCallback } from 'react';

import { selectAssetCaptionText, setCaptionText } from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectTriggerPhrases } from '@/app/store/project';

import { CaptionEditor } from './caption-editor';

type CaptionManagerProps = {
  assetId: string;
};

const CaptionManagerComponent = ({ assetId }: CaptionManagerProps) => {
  const dispatch = useAppDispatch();
  const triggerPhrases = useAppSelector(selectTriggerPhrases);
  const captionText = useAppSelector((state) =>
    selectAssetCaptionText(state, assetId),
  );

  const handleTextChange = useCallback(
    (text: string) => {
      dispatch(setCaptionText({ assetId, text }));
    },
    [dispatch, assetId],
  );

  return (
    <CaptionEditor
      captionText={captionText}
      triggerPhrases={triggerPhrases}
      onTextChange={handleTextChange}
    />
  );
};

export const CaptionManager = memo(CaptionManagerComponent);
