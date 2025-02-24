import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { getImageFiles } from '../utils/asset-actions';

export type LoadState = 'Uninitialized' | 'Loading' | 'Loaded' | 'LoadError';

export type TagState = 'Active' | 'ToDelete' | 'ToAdd';

export type ImageTag = {
  name: string;
  state: TagState;
};

export type ImageAsset = {
  fileId: string;
  file: string;
  dimensions: {
    width: number;
    height: number;
    composed: string;
  };
  tags: ImageTag[];
};

export const loadImages = createAsyncThunk(
  'assets/loadImages',
  async () => await getImageFiles(),
);

type ImageAssets = {
  loadState: LoadState;
  loadMessage: undefined | string;
  images: ImageAsset[];
};

type KeyedCountList = { [key: string]: number };

const initialState = {
  loadState: 'Uninitialized',
  loadMessage: undefined,
  images: [],
} as ImageAssets;

const imagesSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addTag: (
      state,
      { payload }: PayloadAction<{ fileId: string; tag: string }>,
    ) => {
      if (payload.tag.trim() === '') return;

      state.images
        .find((element) => element.fileId === payload.fileId)
        ?.tags.push({
          name: payload.tag,
          state: 'ToAdd',
        });
    },

    deleteTag: (
      state,
      { payload }: PayloadAction<{ fileId: string; tag: string }>,
    ) => {
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload.fileId,
      );

      // Stop if no tags to operate on
      if (!state.images[assetIndex]?.tags.length) return;

      const tagIndex = state.images[assetIndex].tags.findIndex(
        (tag) => tag.name === payload.tag,
      );

      const tagState = state.images[assetIndex].tags[tagIndex].state;

      // Active and ToDelele toggle states; ToAdd gets removed
      if (tagState === 'Active') {
        state.images[assetIndex].tags[tagIndex].state = 'ToDelete';
      } else if (tagState === 'ToDelete') {
        state.images[assetIndex].tags[tagIndex].state = 'Active';
      } else if (tagState === 'ToAdd') {
        state.images[assetIndex].tags.splice(tagIndex);
      }
    },

    resetTags: (state, { payload }: PayloadAction<string>) => {
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload,
      );

      // Could add an `originalIndex` or similar if resetting re-ordering...
      state.images[assetIndex].tags = state.images[assetIndex].tags
        // Clear delete marks
        .map<ImageTag>((tag) => {
          if (tag.state === 'ToDelete') tag.state = 'Active';
          return tag;
        })
        // Clear new items
        .filter((item) => item.state !== 'ToAdd');
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadImages.pending, (state) => {
      state.loadState = 'Loading';
      state.loadMessage = undefined;
    });

    builder.addCase(loadImages.fulfilled, (state, action) => {
      state.loadState = 'Loaded';
      state.loadMessage = undefined;
      state.images = action.payload as ImageAsset[];
    });

    builder.addCase(loadImages.rejected, (state, action) => {
      state.loadState = 'LoadError';
      state.loadMessage = action.error.message;
      state.images = [];
    });
  },

  selectors: {
    selectLoadState: (state) => {
      return state.loadState;
    },

    selectImages: (state) => {
      return state.images;
    },

    selectImageSizes: createSelector([(state) => state.images], (images) => {
      return images.reduce((acc: KeyedCountList, item: ImageAsset) => {
        const { composed } = item.dimensions;
        if (typeof acc[composed] !== 'undefined') {
          return { ...acc, [composed]: (acc[composed] += 1) };
        } else {
          return { ...acc, [composed]: 1 };
        }
      }, {});
    }),

    selectTags: createSelector([(state) => state.images], (imageAssets) => {
      if (!imageAssets) return {};

      return imageAssets.reduce((acc: KeyedCountList, asset: ImageAsset) => {
        const { tags } = asset;

        // This code is annoying me, I don't like the map mutating this array
        const newTagCounts: KeyedCountList = {};

        tags.map((tag: ImageTag) => {
          newTagCounts[tag.name] = Object.keys(acc).includes(tag.name)
            ? acc[tag.name] + 1
            : 1;
        });

        return {
          ...acc,
          ...newTagCounts,
        };
      }, {});
    }),
  },
});

export const { reducer: assetsReducer } = imagesSlice;
export const { addTag, deleteTag, resetTags } = imagesSlice.actions;
export const { selectLoadState, selectImages, selectImageSizes, selectTags } =
  imagesSlice.selectors;
