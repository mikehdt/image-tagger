'use server';
import { createReadStream } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

import { imageDimensionsFromStream } from 'image-dimensions';

const dataPath = './public/assets';
import type { ImageAsset, ImageTag } from '../store/slice-assets';

export const getImageFiles = async () => {
  const dir = path.resolve(dataPath);

  const filenames = fs.readdirSync(dir);

  const imageFiles = filenames.filter(
    (file) => path.extname(file) === '.png' || path.extname(file) === '.jpg',
  );

  const imageAssets: ImageAsset[] = [];

  for (const file of imageFiles) {
    const fileId = file.substring(0, file.lastIndexOf('.'));

    // @ts-expect-error ReadableStream.from being weird
    const stream = ReadableStream.from(createReadStream(`${dataPath}/${file}`));

    const dimensions = await imageDimensionsFromStream(stream);

    const tags = await fs
      .readFileSync(`${dataPath}/${fileId}.txt`, 'utf8')
      .split(', ')
      .map(
        (tag) =>
          ({
            name: tag.trim(),
            state: 'Active',
          }) as ImageTag,
      );

    imageAssets.push({
      fileId,
      file,
      dimensions: {
        ...(dimensions as { width: number; height: number }),
        composed: `${dimensions?.width}x${dimensions?.height}`,
      },
      tags,
    });
  }

  return imageAssets || [];
};

export const writeTagsToDisk = async (
  fileId: string,
  composedTags: string,
): Promise<boolean> => {
  try {
    fs.writeFileSync(`${dataPath}/${fileId}.txt`, composedTags);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
