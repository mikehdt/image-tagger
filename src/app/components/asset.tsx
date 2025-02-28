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
import { selectFilterTags, toggleTagFilter } from '../store/slice-filters';
import { AssetActions } from './asset-actions';
import { NewTagInput } from './tags/new-tag-input';
import { Tag } from './tags/tag';

export const Asset = ({ asset }: { asset: ImageAsset }) => {
  const { fileId, file, dimensions, tags } = asset;

  const [imageZoom, setImageZoom] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const dispatch = useAppDispatch();
  const globalTagList = useAppSelector(selectTags);
  const filterTags = useAppSelector(selectFilterTags);

  const toggleImageZoom = () => {
    setImageZoom(!imageZoom);
  };

  const toggleTag = (e: SyntheticEvent, tagName: string) => {
    e.preventDefault();
    dispatch(toggleTagFilter(tagName));
  };

  const showActions = tags.length && tags.find((tag) => tag.state !== 'Active');

  const addNewTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    if (tag.trim() !== '') {
      const tagList = tags.map((tag) => tag.name);

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

  const toggleDeleteTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();
    dispatch(deleteTag({ fileId, tag }));
  };

  // Should probably consider how to queue these requests
  const saveAction = () => {
    dispatch(saveAssets(fileId));
  };

  const cancelAction = () => {
    dispatch(resetTags(fileId));
  };

  return (
    <div className="mb-4 flex w-full flex-wrap border border-slate-300">
      <div
        className={`flex w-full items-center justify-center ${!imageZoom ? 'md:w-1/4' : 'md:w-3/4'} cursor-pointer self-stretch bg-slate-300 transition-all`}
      >
        <div className="flex bg-slate-300" onClick={toggleImageZoom}>
          <Image
            className={`${!imageZoom ? 'max-h-64' : ''} h-auto w-auto object-contain`}
            src={`/assets/${file}`}
            width={dimensions.width}
            height={dimensions.height}
            alt=""
            title={file}
          />
        </div>
      </div>

      <div className={`${imageZoom ? 'md:w-1/4' : 'md:w-3/4'} p-4`}>
        {tags.map((tag: ImageTag, idx: number) => (
          <Tag
            key={`${idx}-${tag.name}`}
            tag={tag}
            count={globalTagList[tag.name]}
            onToggleTag={(e) => toggleTag(e, tag.name)}
            onDeleteTag={(e) => toggleDeleteTag(e, tag.name)}
            highlight={filterTags.includes(tag.name)}
          />
        ))}

        <NewTagInput
          inputValue={newTagInput}
          onInputChange={(e) => setNewTagInput(e.currentTarget.value)}
          onAddTag={(e) => addNewTag(e, newTagInput)}
        />
      </div>

      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex h-8 items-center tabular-nums">
          <button
            type="button"
            className="mr-2 cursor-pointer rounded-sm border border-sky-300 bg-sky-100 px-2 py-0.5"
          >
            {dimensions.width}&times;{dimensions.height}
          </button>
          {fileId}
        </span>
        {showActions ? (
          <AssetActions onSave={saveAction} onCancel={cancelAction} />
        ) : null}
      </div>
    </div>
  );
};
