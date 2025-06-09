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

// Using bitwise flags instead of string enum to allow combined states
export enum TagState {
  SAVED = 0, // 0000 - Base state
  TO_DELETE = 1, // 0001 - Marked for deletion
  TO_ADD = 2, // 0010 - Newly added
  DIRTY = 4, // 0100 - Position changed
}

// Helper functions to check and manipulate tag states
export const hasState = (state: number, flag: TagState): boolean =>
  (state & flag) !== 0;
export const addState = (state: number, flag: TagState): number => state | flag;
export const removeState = (state: number, flag: TagState): number =>
  state & ~flag;
export const toggleState = (state: number, flag: TagState): number =>
  state ^ flag;

// For debugging and display purposes
export const getTagStateString = (state: number): string => {
  if (state === TagState.SAVED) return 'Saved';

  const states: string[] = [];
  if (hasState(state, TagState.TO_DELETE)) states.push('ToDelete');
  if (hasState(state, TagState.TO_ADD)) states.push('ToAdd');
  if (hasState(state, TagState.DIRTY)) states.push('Dirty');

  return states.join('+');
};

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageAsset = {
  ioState: Extract<IoState, IoState.SAVING | IoState.COMPLETE>;
  fileId: string;
  fileExtension: string;
  dimensions: ImageDimensions;
  tagStatus: { [key: string]: number }; // Changed from TagState to number to support bit flags
  tagList: string[];
  savedTagList: string[]; // Original tag order from last save
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

    // Filter out tags that are marked for deletion, but keep SAVED, TO_ADD and DIRTY tags
    const updateTags = asset.tagList.filter(
      (tag) => !hasState(asset.tagStatus[tag], TagState.TO_DELETE),
    );

    const flattenedTags = updateTags.join(', ');

    const success = await writeTagsToDisk(fileId, flattenedTags);

    if (success) {
      // Create a new clean tagStatus object with only saved tags
      const newTagStatus = updateTags.reduce(
        (acc, tag) => {
          acc[tag] = TagState.SAVED;
          return acc;
        },
        {} as { [key: string]: number },
      );

      return {
        assetIndex: images.findIndex((element) => element.fileId === fileId),
        tagList: updateTags,
        tagStatus: newTagStatus,
        savedTagList: [...updateTags], // Store the current order as the saved order
      };
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

      // Handle cases based on the current state
      if (hasState(tagState, TagState.TO_ADD)) {
        // For TO_ADD tags, we still want to remove them completely
        delete state.images[assetIndex].tagStatus[tagName];
        state.images[assetIndex].tagList.splice(
          state.images[assetIndex].tagList.findIndex(
            (item) => item === tagName,
          ),
          1,
        );
      } else {
        // Toggle TO_DELETE flag for all other tags
        state.images[assetIndex].tagStatus[tagName] = toggleState(
          tagState,
          TagState.TO_DELETE,
        );
      }
    },

    reorderTags: (
      state,
      {
        payload,
      }: PayloadAction<{ assetId: string; oldIndex: number; newIndex: number }>,
    ) => {
      const { assetId, oldIndex, newIndex } = payload;

      // No need to reorder if indexes are the same
      if (oldIndex === newIndex) return;

      const assetIndex = state.images.findIndex(
        (element) => element.fileId === assetId,
      );

      if (assetIndex === -1) return;

      const asset = { ...state.images[assetIndex] };

      // Get the tag being moved
      const tagToMove = asset.tagList[oldIndex];

      // Create a completely new tag list
      const newTagList = [...asset.tagList];
      newTagList.splice(oldIndex, 1);
      newTagList.splice(newIndex, 0, tagToMove);

      // Create a new tag status object
      const newTagStatus = { ...asset.tagStatus };

      // Mark tags affected by the reordering as DIRTY
      // Only if they were previously SAVED
      const minIndex = Math.min(oldIndex, newIndex);
      const maxIndex = Math.max(oldIndex, newIndex);

      // Mark all tags in the affected range as DIRTY if they don't already have TO_ADD state
      for (let i = minIndex; i <= maxIndex; i++) {
        const tag = i === newIndex ? tagToMove : newTagList[i];
        if (tag && !hasState(newTagStatus[tag], TagState.TO_ADD)) {
          // Add DIRTY flag without removing other flags
          newTagStatus[tag] = addState(newTagStatus[tag], TagState.DIRTY);
        }
      }

      // Replace the entire asset with a new object
      state.images = [
        ...state.images.slice(0, assetIndex),
        {
          ...asset,
          tagList: newTagList,
          tagStatus: newTagStatus,
        },
        ...state.images.slice(assetIndex + 1),
      ];
    },

    resetTags: (state, { payload }: PayloadAction<string>) => {
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload,
      );

      if (assetIndex === -1) return;

      const asset = { ...state.images[assetIndex] };
      const newTagStatus = { ...asset.tagStatus };

      // Start with the saved order as our base
      const savedList = [...(asset.savedTagList || [])];

      // Create filter map of valid tags (those that are not TO_ADD)
      const validTags = new Set();
      asset.tagList.forEach((tag) => {
        // Skip TO_ADD tags
        if (hasState(newTagStatus[tag], TagState.TO_ADD)) {
          delete newTagStatus[tag];
        } else {
          validTags.add(tag);
          // Reset all flags to SAVED state
          newTagStatus[tag] = TagState.SAVED;
        }
      });

      // Generate the restored tag list from the saved order
      // Only include tags that still exist (weren't marked as TO_ADD)
      const newTagList = savedList.filter((tag) => validTags.has(tag));

      // Replace the entire asset with a new object
      state.images = [
        ...state.images.slice(0, assetIndex),
        {
          ...asset,
          tagList: newTagList,
          tagStatus: newTagStatus,
        },
        ...state.images.slice(assetIndex + 1),
      ];
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
      const { assetIndex, tagList, tagStatus, savedTagList } = action.payload;

      state.images[assetIndex].ioState = IoState.COMPLETE;
      state.images[assetIndex].tagList = tagList;
      state.images[assetIndex].tagStatus = tagStatus;
      state.images[assetIndex].savedTagList = savedTagList;
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
        Object.entries(dimensionGroups).map(([dim, assets]) => [
          dim,
          assets.length,
        ]),
      );
    }),

    selectTagsByStatus: (state, fileId) => {
      const selectedImage = state.images.find((item) => item.fileId === fileId);

      return selectedImage?.tagStatus || {};
    },

    selectOrderedTagsWithStatus: createSelector(
      // Input selectors
      [(state) => state.images, (state, fileId) => fileId],
      // Result function
      (images, fileId) => {
        const selectedImage = images.find(
          (item: { fileId: string }) => item.fileId === fileId,
        );

        if (!selectedImage) return [];

        // Create an array of objects with tag name and status
        // This preserves the order from tagList
        return selectedImage.tagList.map((tagName: string | number) => ({
          name: tagName,
          status: selectedImage.tagStatus[tagName] || TagState.SAVED,
        }));
      },
    ),

    selectTagsForAsset: (state, fileId) => {
      const selectedImage = state.images.find((item) => item.fileId === fileId);
      return {
        tagStatus: selectedImage?.tagStatus || {},
        tagList: selectedImage?.tagList || [],
      };
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
export const { addTag, deleteTag, reorderTags, resetTags } =
  imagesSlice.actions;
export const {
  selectIoState,
  selectAllImages,
  selectImageCount,
  selectImageSizes,
  selectAllTags,
  selectTagsByStatus,
  selectOrderedTagsWithStatus,
  selectTagsForAsset,
} = imagesSlice.selectors;
