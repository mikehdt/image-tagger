'use server';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import { imageDimensionsFromStream } from 'image-dimensions';

const dataPath = './public/assets';
import {
  type ImageAsset,
  ImageDimensions,
  IoState,
  TagState,
} from '../store/slice-assets';

export const getImageFiles = async () => {
  const dir = path.resolve(dataPath);

  const filenames = fs.readdirSync(dir);

  const imageFiles = filenames.filter(
    (file) => path.extname(file) === '.png' || path.extname(file) === '.jpg',
  );

  const imageAssets: ImageAsset[] = [];

  for (const file of imageFiles) {
    const fileId = file.substring(0, file.lastIndexOf('.'));
    const fileExtension = file.substring(file.lastIndexOf('.') + 1);

    // @ts-expect-error ReadableStream.from being weird
    const stream = ReadableStream.from(createReadStream(`${dataPath}/${file}`));

    const dimensions = (await imageDimensionsFromStream(
      stream,
    )) as ImageDimensions;

    const tagStatus = await fs
      .readFileSync(`${dataPath}/${fileId}.txt`, 'utf8')
      .split(', ')
      .reduce(
        (acc, tag) => ({
          ...acc,
          [tag.trim()]: TagState.SAVED,
        }),
        {},
      );

    const tagList = Object.keys(tagStatus);

    imageAssets.push({
      ioState: IoState.COMPLETE,
      fileId,
      fileExtension,
      dimensions,
      tagStatus,
      tagList,
    });
  }

  return imageAssets;
};

export const writeTagsToDisk = async (
  fileId: string,
  composedTags: string,
): Promise<boolean> => {
  try {
    fs.writeFileSync(`${dataPath}/${fileId}.txt`, composedTags);
    return true;
  } catch (err) {
    console.error('Disk I/O error:', err);
    return false;
  }
};
