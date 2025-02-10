import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import type { ImageAsset } from './types/image-asset';
import type { TagList } from './asset-list';
import { SyntheticEvent, useState } from 'react';

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

  return (
    <div className="mb-4 flex w-full flex-wrap border border-slate-300">
      <div
        className={`flex items-center justify-center ${!imageSize ? 'w-1/4' : 'w-3/4'} cursor-pointer self-stretch bg-slate-300`}
      >
        <div className={`flex bg-slate-300`} onClick={toggleImageSize}>
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
      <div className={`${imageSize ? 'w-1/4' : 'w-3/4'} p-4`}>
        {img.tags.map((tag: string, idx: number) => (
          <span
            key={`${tag}--${idx}`}
            className={`mb-2 mr-2 inline-flex cursor-pointer items-center rounded-full border py-1 pl-4 pr-2 ${deleteTags.includes(tag) ? 'border-pink-500' : 'border-teal-500'} ${
              filters.includes(tag)
                ? 'bg-emerald-300 hover:bg-emerald-100'
                : 'hover:bg-teal-100'
            } ${idx === 0 ? 'font-bold' : ''}`}
            onClick={() => actions.toggleFilter(tag)}
          >
            <span className={deleteTags.includes(tag) ? 'line-through' : ''}>
              {tag}
            </span>
            <span className="ml-2 inline-flex rounded-full border border-teal-300 bg-white px-2 py-0.5 text-xs">
              {deleteTags.includes(tag)
                ? globalTagList[tag] - 1
                : globalTagList[tag]}
            </span>
            <span
              className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
              onClick={(e) => toggleDeleteTag(e, tag)}
            >
              <XMarkIcon />
            </span>
          </span>
        ))}
        {addTags.map((tag, idx) => (
          <span
            key={`${tag}--${idx}`}
            className={`mb-2 mr-2 inline-flex cursor-pointer items-center rounded-full border border-amber-500 py-1 pl-4 pr-2 ${
              filters.includes(tag) ? 'bg-amber-300' : ''
            }`}
          >
            {tag}
            <span className="ml-2 inline-flex rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs">
              {globalTagList[tag] ? globalTagList[tag] + 1 : 1}
            </span>
            <span
              className="ml-1 inline-flex w-5 rounded-full p-0.5 hover:bg-pink-500 hover:text-white"
              onClick={(e) => removeNewTag(e, tag)}
            >
              <XMarkIcon />
            </span>
          </span>
        ))}
        <div className="relative inline-flex">
          <input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            type="text"
            className="w-36 rounded-full border border-green-300 py-1 pe-8 ps-4"
          />
          <span
            className="absolute bottom-0 right-2 top-0 mb-auto ml-2 mt-auto h-5 w-5 cursor-pointer rounded-full p-0.5 hover:bg-green-500 hover:text-white"
            onClick={(e) => addNewTag(e, newTagInput)}
          >
            <PlusIcon />
          </span>
        </div>
      </div>
      <div className="flex w-full items-center border-t border-t-slate-300 bg-slate-100 px-2 py-1 text-sm">
        <span className="inline-flex h-8 items-center">
          {img.width}&times;{img.height} &ndash; {img.fileId}
        </span>
        {addTags.length || deleteTags.length ? (
          <span className="ml-auto">
            <button
              className="rounded-sm bg-slate-200 px-4 py-1 hover:bg-slate-400"
              onClick={clearChanges}
            >
              Cancel
            </button>
            <button
              className="ml-2 rounded-sm bg-emerald-200 px-4 py-1 hover:bg-emerald-400"
              onClick={async () => {
                const success = await actions.saveTags(
                  img.fileId,
                  addTags,
                  deleteTags,
                );

                if (success) clearChanges();
              }}
            >
              Save
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
};
