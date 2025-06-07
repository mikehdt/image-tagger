import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { getImageFiles, writeTagsToDisk } from '../utils/asset-actions';
import { composeDimensions } from '../utils/helpers';

export enum IoState {
  UNINITIALIZED = 'Uninitialized',
  LOADING = 'Loading',
  SAVING = 'Saving',
  COMPLETE = 'Complete',
  ERROR = 'IoError',
}

export enum TagState {
  SAVED = 'Saved',
  TO_DELETE = 'ToDelete',
  TO_ADD = 'ToAdd',
}

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageAsset = {
  ioState: Extract<IoState, IoState.SAVING | IoState.COMPLETE>;
  fileId: string;
  fileExtension: string;
  dimensions: ImageDimensions;
  tagStatus: { [key: string]: TagState };
  tagList: string[];
};

export const loadAssets = createAsyncThunk(
  'assets/loadAssets',
  async () => await getImageFiles(),
);

export const saveAssets = createAsyncThunk(
  'assets/saveImages',
  async (fileId: string, { getState }) => {
    const {
      assets: { images },
    } = getState() as { assets: ImageAssets };

    const asset = images.find((element) => element.fileId === fileId);

    if (!asset) {
      throw new Error(`Asset with ID ${fileId} not found`);
    }

    const updateTags = asset.tagList.filter((tag) => asset.tagStatus[tag] !== 'ToDelete');

    const flattenedTags = updateTags.join(', ');

    const success = await writeTagsToDisk(fileId, flattenedTags);

    if (success) {
      // Create a new clean tagStatus object with only saved tags
      const newTagStatus = updateTags.reduce((acc, tag) => {
        acc[tag] = TagState.SAVED;
        return acc;
      }, {} as {[key: string]: TagState});

      return { assetIndex: images.findIndex((element) => element.fileId === fileId), tagList: updateTags, tagStatus: newTagStatus };
    }

    throw new Error(`Unable to save the asset ${fileId}`);
  },
);

type ImageAssets = {
  ioState: IoState;
  ioMessage: undefined | string;
  images: ImageAsset[];
};

type KeyedCountList = { [key: string]: number };

const initialState = {
  ioState: 'Uninitialized',
  ioMessage: undefined,
  images: [],
} as ImageAssets;

const imagesSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addTag: (
      state,
      { payload }: PayloadAction<{ assetId: string; tagName: string }>,
    ) => {
      const { assetId, tagName } = payload;

      if (tagName.trim() === '') return;

      const imageIndex = state.images.findIndex(
        (element) => element.fileId === assetId,
      );

      // Even if duplicate tags might exist, we'll only allow adding if not already in the list
      // This prevents inadvertently adding more duplicates
      if (!state.images[imageIndex].tagList.includes(tagName)) {
        state.images[imageIndex].tagList.push(tagName);
        state.images[imageIndex].tagStatus[tagName] = TagState.TO_ADD;
      }
    },

    deleteTag: (
      state,
      { payload }: PayloadAction<{ assetId: string; tagName: string }>,
    ) => {
      const { assetId, tagName } = payload;

      const assetIndex = state.images.findIndex(
        (element) => element.fileId === assetId,
      );

      // Stop if no tags to operate on
      if (!state.images[assetIndex]?.tagStatus) return;

      const tagState = state.images[assetIndex].tagStatus[tagName];

      // Active and ToDelete toggle states; ToAdd gets removed
      if (tagState === TagState.SAVED) {
        state.images[assetIndex].tagStatus[tagName] = TagState.TO_DELETE;
      } else if (tagState === TagState.TO_DELETE) {
        state.images[assetIndex].tagStatus[tagName] = TagState.SAVED;
      } else if (tagState === TagState.TO_ADD) {
        delete state.images[assetIndex].tagStatus[tagName];
        state.images[assetIndex].tagList.splice(
          state.images[assetIndex].tagList.findIndex(
            (item) => item === tagName,
          ),
          1,
        );
      }
    },

    resetTags: (state, { payload }: PayloadAction<string>) => {
      const asset = state.images.find(
        (element) => element.fileId === payload,
      );

      // More straightforward implementation
      if (!asset) return;

      // Create new filtered tagList
      const newTagList = asset.tagList.filter(tag => {
        // Remove TO_ADD tags completely
        if (asset.tagStatus[tag] === TagState.TO_ADD) {
          delete asset.tagStatus[tag];
          return false;
        }

        // Reset TO_DELETE tags to SAVED
        if (asset.tagStatus[tag] === TagState.TO_DELETE) {
          asset.tagStatus[tag] = TagState.SAVED;
        }

        return true;
      });

      asset.tagList = newTagList;
    },
  },

  extraReducers: (builder) => {
    // Loading
    builder.addCase(loadAssets.pending, (state) => {
      state.ioState = IoState.LOADING;
      state.ioMessage = undefined;
    });

    builder.addCase(loadAssets.fulfilled, (state, action) => {
      state.ioState = IoState.COMPLETE;
      state.ioMessage = undefined;
      state.images = action.payload as ImageAsset[];
    });

    builder.addCase(loadAssets.rejected, (state, action) => {
      state.ioState = IoState.ERROR;
      state.ioMessage = action.error.message;
      state.images = [];
    });

    // Saving
    builder.addCase(saveAssets.pending, (state, action) => {
      const { arg } = action.meta;

      const imageIndex = state.images.findIndex((item) => item.fileId === arg);

      state.images[imageIndex].ioState = IoState.SAVING;
      state.ioState = IoState.SAVING;
      state.ioMessage = undefined;
    });

    builder.addCase(saveAssets.fulfilled, (state, action) => {
      state.ioState = IoState.COMPLETE;
      state.ioMessage = undefined;

      // Use the index from the payload directly
      const { assetIndex, tagList, tagStatus } = action.payload;

      state.images[assetIndex].ioState = IoState.COMPLETE;
      state.images[assetIndex].tagList = tagList;
      state.images[assetIndex].tagStatus = tagStatus;
    });

    builder.addCase(saveAssets.rejected, (state, action) => {
      state.ioState = IoState.ERROR;
      state.ioMessage = action.error.message;
    });
  },

  selectors: {
    selectIoState: (state) => {
      return state.ioState;
    },

    selectAllImages: (state) => {
      return state.images;
    },

    selectImageCount: (state) => {
      return state.images.length;
    },

    selectImageSizes: createSelector([(state) => state.images], (images) => {
  if (!images.length) return {};

  // Group by dimension
  const dimensionGroups: Record<string, ImageAsset[]> = {};
  for (const item of images) {
    const dimension = composeDimensions(item.dimensions);
    dimensionGroups[dimension] = dimensionGroups[dimension] || [];
    dimensionGroups[dimension].push(item);
  }

  // Create count map
  return Object.fromEntries(
    Object.entries(dimensionGroups).map(([dim, assets]) =>
      [dim, assets.length]
    )
  );
    }),

    selectTagsByStatus: (state, fileId) => {
      const selectedImage = state.images.find((item) => item.fileId === fileId);

      return selectedImage?.tagStatus || {};
    },

    selectAllTags: createSelector([(state) => state.images], (imageAssets) => {
      if (!imageAssets?.length) return {};

      const tagCounts: KeyedCountList = {};

      // Process all images and count tags
      for (const asset of imageAssets) {
        for (const tag of asset.tagList) {
          // Only count tags that aren't marked for deletion
          if (asset.tagStatus[tag] !== TagState.TO_DELETE) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }

      return tagCounts;
    }),
  },
});

export const { reducer: assetsReducer } = imagesSlice;
export const { addTag, deleteTag, resetTags } = imagesSlice.actions;
export const {
  selectIoState,
  selectAllImages,
  selectImageCount,
  selectImageSizes,
  selectAllTags,
  selectTagsByStatus,
} = imagesSlice.selectors;
