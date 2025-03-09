import Image from 'next/image';
import { SyntheticEvent, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  ImageDimensions,
  IoState,
  resetTags,
  saveAssets,
  selectAllTags,
  selectTagsByStatus,
  TagState,
} from '../store/slice-assets';
import { selectFilterTags, toggleSizeFilter } from '../store/slice-filters';
import { composeDimensions } from '../utils/helpers';
import { NewInput } from './new-input';
import { Tag } from './tag';

type AssetProps = {
  assetId: string;
  fileExtension: string;
  dimensions: ImageDimensions;
  dimensionsActive: boolean;
};

export const Asset = ({
  assetId,
  fileExtension,
  dimensions,
  dimensionsActive,
}: AssetProps) => {
  const dimensionsComposed = composeDimensions(dimensions);

  const [imageZoom, setImageZoom] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const dispatch = useAppDispatch();
  const globalTagList = useAppSelector(selectAllTags);
  const filterTags = useAppSelector(selectFilterTags);
  const tagsByStatus = useAppSelector((state) =>
    selectTagsByStatus(state, assetId),
  );

  const toggleImageZoom = () => {
    setImageZoom(!imageZoom);
  };

  const tagList = Object.keys(tagsByStatus);

  const showActions =
    tagList.length &&
    tagList.find((tagName) => tagsByStatus[tagName] !== TagState.SAVED) &&
    ioState !== IoState.SAVING;

  const addNewTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    if (tag.trim() !== '') {
      if (!tagList.includes(tag)) {
        dispatch(addTag({ fileId, tag }));
        setNewTagInput('');
      } else {
        console.log("Couldn't add tag, it's already is in the list", tag);
      }
    } else {
      console.log("Couldn't add tag, it was empty.");
    }
  };

  const saveAction = () => {
    dispatch(saveAssets(assetId));
  };

  const cancelAction = () => {
    dispatch(resetTags(assetId));
  };

  const toggleSize = (composedSize: string) => {
    dispatch(toggleSizeFilter(composedSize));
  };

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-b-lg border border-slate-300">
      <div
        className={`flex w-full items-center justify-center ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'} cursor-pointer self-stretch bg-slate-300 transition-all`}
        onClick={toggleImageZoom}
      >
        <div className="flex border-r border-r-slate-300 bg-slate-300">
          {/* <Image
            className={`${!imageZoom && 'max-h-64'} h-auto w-auto object-contain`}
            src={`/assets/${assetId}.${fileExtension}`}
            width={dimensions.width}
            height={dimensions.height}
            alt=""
          /> */}
          &nbsp;
        </div>
      </div>

      <div className={`${imageZoom ? 'md:w-1/4' : 'md:w-3/4'} p-4`}>
        {tagList.map((tagName: string, idx: number) => (
          <Tag
            key={`${idx}-${tagName}`}
            fade={newTagInput !== '' && newTagInput !== tagName}
            tagName={tagName}
            tagState={tagsByStatus[tagName]}
            count={globalTagList[tagName]}
            // onToggleTag={(e) => toggleTag(e, tagName)}
            // onDeleteTag={(e) => toggleDeleteTag(e, tagName)}
            highlight={filterTags.includes(tagName)}
          />
        ))}

        <NewInput
          inputValue={newTagInput}
          onInputChange={(e) =>
            setNewTagInput(e.currentTarget.value.trimStart())
          }
          onAdd={(e) => addNewTag(e, newTagInput)}
        />
      </div>

      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex h-8 min-w-0 items-center tabular-nums">
          <button
            type="button"
            className={`mr-2 cursor-pointer rounded-sm border border-sky-300 ${dimensionsActive ? 'bg-sky-300 text-sky-900' : 'bg-sky-100'} px-2 py-0.5`}
            onClick={() => toggleSize(dimensionsComposed)}
          >
            {dimensions.width}&times;{dimensions.height}
          </button>

          <span className="mr-2 cursor-default rounded-sm border border-stone-300 bg-stone-100 px-2 py-0.5 max-sm:hidden">
            {fileExtension}
          </span>

          <span
            className="cursor-default overflow-hidden overflow-ellipsis text-slate-500 max-sm:hidden"
            style={{ textShadow: 'white 0 1px 0' }}
          >
            {assetId}
          </span>
        </span>
        {/* {showActions ? (
          <AssetActions onSave={saveAction} onCancel={cancelAction} />
        ) : null} */}
      </div>
    </div>
  );
};
