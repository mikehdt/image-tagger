import Image from 'next/image';
import { SyntheticEvent, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTag,
  deleteTag,
  type ImageAsset,
  type ImageTag,
  resetTags,
  saveAssets,
  selectTags,
} from '../store/slice-assets';
import {
  selectFilterSizes,
  selectFilterTags,
  toggleSizeFilter,
  toggleTagFilter,
} from '../store/slice-filters';
import { AssetActions } from './asset-actions';
import { NewInput } from './new-input';
import { Tag } from './tag';

export const Asset = ({
  asset,
  index,
}: {
  asset: ImageAsset;
  index: number;
}) => {
  const { ioState, fileId, fileExtension, dimensions, tagsByName, tagOrder } =
    asset;

  const [imageZoom, setImageZoom] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const dispatch = useAppDispatch();
  const globalTagList = useAppSelector(selectTags);
  const filterTags = useAppSelector(selectFilterTags);
  const filterSizes = useAppSelector(selectFilterSizes);

  const toggleImageZoom = () => {
    setImageZoom(!imageZoom);
  };

  const toggleTag = (e: SyntheticEvent, tagName: string) => {
    e.preventDefault();
    dispatch(toggleTagFilter(tagName));
  };

  const showActions =
    tagOrder.length &&
    tagOrder.find((tagName) => tagsByName[tagName].state !== 'Active') &&
    ioState !== 'Saving';

  const addNewTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    if (tag.trim() !== '') {
      if (!tagOrder.includes(tag)) {
        dispatch(addTag({ fileId, tag }));
        setNewTagInput('');
      } else {
        console.log("Couldn't add tag, it's already is in the list", tag);
      }
    } else {
      console.log("Couldn't add tag, it was empty.");
    }
  };

  const toggleDeleteTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();
    dispatch(deleteTag({ fileId, tag }));
  };

  const saveAction = () => {
    dispatch(saveAssets(fileId));
  };

  const cancelAction = () => {
    dispatch(resetTags(fileId));
  };

  const toggleSize = (composedSize: string) => {
    dispatch(toggleSizeFilter(composedSize));
  };

  return (
    <div className="mb-4 flex w-full flex-wrap overflow-hidden rounded-b-lg border border-slate-300">
      <div
        className={`flex w-full items-center justify-center ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'} cursor-pointer self-stretch bg-slate-300 transition-all`}
      >
        <div
          className="flex border-r border-r-slate-300 bg-slate-300"
          onClick={toggleImageZoom}
        >
          {/* <Image
            className={`${!imageZoom ? 'max-h-64' : ''} h-auto w-auto object-contain`}
            src={`/assets/${fileId}.${fileExtension}`}
            width={dimensions.width}
            height={dimensions.height}
            alt=""
            // This should probably be an intersection observer or something
            priority={index < 4}
          /> */}
          &nbsp;
        </div>
      </div>

      <div className={`${imageZoom ? 'md:w-1/4' : 'md:w-3/4'} p-4`}>
        {tagOrder.slice(0, 3).map((tagName: string, idx: number) => (
          <Tag
            key={`${idx}-${tagName}`}
            fade={newTagInput !== '' && newTagInput !== tagName}
            tagName={tagName}
            tagState={tagsByName[tagName]}
            count={globalTagList[tagName]}
            onToggleTag={(e) => toggleTag(e, tagName)}
            onDeleteTag={(e) => toggleDeleteTag(e, tagName)}
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
            className={`mr-2 cursor-pointer rounded-sm border border-sky-300 ${filterSizes.includes(dimensions.composed) ? 'bg-sky-300 text-sky-900' : 'bg-sky-100'} px-2 py-0.5`}
            onClick={() => toggleSize(dimensions.composed)}
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
            {fileId}
          </span>
        </span>
        {showActions ? (
          <AssetActions onSave={saveAction} onCancel={cancelAction} />
        ) : null}
      </div>
    </div>
  );
};
