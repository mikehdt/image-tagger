import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import Image from 'next/image';
import { SyntheticEvent, useState } from 'react';

import type { TagList } from './asset-list';
import { NewTag } from './tags/new-tag';
import { NewTagInput } from './tags/new-tag-input';
import { Tag } from './tags/tag';
import { TagActions } from './tags/tag-actions';
import type { ImageAsset } from './types/image-asset';

export const Asset = ({
  img,
  filters,
  globalTagList,
  actions,
}: {
  img: ImageAsset;
  filters: string[];
  globalTagList: TagList;
  actions: { [key: string]: any };
}) => {
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [addTags, setAddTags] = useState<string[]>([]);
  const [deleteTags, setDeleteTags] = useState<string[]>([]);
  const [imageSize, setImageSize] = useState<boolean>(false);

  const addNewTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    if (tag.trim() !== '') {
      if (!addTags.includes(tag) && !img.tags.includes(tag)) {
        setAddTags([...addTags, tag]);
        setNewTagInput('');
      } else {
        console.log("Couldn't add tag, it's already is in the list", tag);
      }
    } else {
      console.log("Couldn't add tag, it was empty.");
    }
  };

  const toggleImageSize = () => {
    setImageSize(!imageSize);
  };

  const removeNewTag = (e: SyntheticEvent, tag: string) => {
    e.stopPropagation();

    setAddTags(addTags.filter((i) => i !== tag));
  };

  const toggleDeleteTag = (e: SyntheticEvent, tag: string) => {
    // Can probably do this better with internal state and a call to a higher array
    e.stopPropagation();

    const newDeleteTags = deleteTags.includes(tag)
      ? deleteTags.filter((i) => i !== tag)
      : [...deleteTags, tag];

    setDeleteTags(newDeleteTags);
  };

  const clearChanges = () => {
    setAddTags([]);
    setDeleteTags([]);
  };

  const saveFilters = async () => {
    const success = await actions.saveTags(img.fileId, addTags, deleteTags);

    if (success) clearChanges();
  };

  const { setNodeRef } = useDroppable({
    id: 'droppy',
  });

  const { listeners } = useDraggable({
    id: 'draggable',
    data: {
      supports: ['type1', 'type2'],
    },
  });

  return (
    <div className="mb-4 flex w-full flex-wrap border border-slate-300">
      <div
        className={`flex items-center justify-center ${!imageSize ? 'w-1/4' : 'w-3/4'} cursor-pointer self-stretch bg-slate-300`}
      >
        <div className="flex bg-slate-300" onClick={toggleImageSize}>
          <Image
            className={`${!imageSize ? 'max-h-64' : ''} h-auto w-auto object-contain`}
            src={`/assets/${img.file}`}
            width={img.width}
            height={img.height}
            alt=""
            title={img.file}
          />
        </div>
      </div>
      <DndContext>
        <div
          className={`${imageSize ? 'w-1/4' : 'w-3/4'} p-4`}
          ref={setNodeRef}
        >
          {img.tags.map((tag: string, idx: number) => (
            <Tag
              key={`${idx}-${tag}`}
              {...listeners}
              tag={tag}
              deleteTags={deleteTags}
              onToggleDelete={(e) => toggleDeleteTag(e, tag)}
              isActive={filters.includes(tag)}
              isDeletable={deleteTags.includes(tag)}
              onClick={() => actions.toggleFilter(tag)}
              tagCount={
                deleteTags.includes(tag)
                  ? globalTagList[tag] - 1
                  : globalTagList[tag]
              }
            />
          ))}

          {addTags.map((tag, idx) => (
            <NewTag
              key={`${tag}--${idx}`}
              tag={tag}
              tagCount={globalTagList[tag] ? globalTagList[tag] + 1 : 1}
              isActive={filters.includes(tag)}
              onCancelNewTag={(e) => removeNewTag(e, tag)}
            />
          ))}

          <NewTagInput
            inputValue={newTagInput}
            onInputChange={(e) => setNewTagInput(e.currentTarget.value)}
            onAddTag={(e) => addNewTag(e, newTagInput)}
          />
        </div>
      </DndContext>
      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex h-8 items-center tabular-nums">
          {img.width}&times;{img.height} &ndash; {img.fileId}
        </span>
        {addTags.length || deleteTags.length ? (
          <TagActions clearChanges={clearChanges} saveFilters={saveFilters} />
        ) : null}
      </div>
    </div>
  );
};
