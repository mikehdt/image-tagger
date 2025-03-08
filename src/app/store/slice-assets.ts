import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { getImageFiles, writeTagsToDisk } from '../utils/asset-actions';

export type IoState =
  | 'Uninitialized'
  | 'Loading'
  | 'Saving'
  | 'Complete'
  | 'IoError';

export type TagState = 'Active' | 'ToDelete' | 'ToAdd';

export type ImageAsset = {
  ioState: 'Saving' | 'Complete'; // For individual items?
  fileId: string;
  fileExtension: string;
  dimensions: {
    width: number;
    height: number;
    composed: string;
  };
  tags: ImageTag[];
};

export const loadAssets = createAsyncThunk(
  'assets/loadAssets',
  async () => await getImageFiles(),
);

export const saveAssets = createAsyncThunk(
  'assets/saveImages',
  async (fileId: string, { getState /*, dispatch*/ }) => {
    // dispatch save state for image

    const {
      assets: { images },
    } = getState() as { assets: ImageAssets };

    const assetIndex = images.findIndex((element) => element.fileId === fileId);

    const updateTags = images[assetIndex].tags
      .filter((tag) => tag.state !== 'ToDelete')
      .map((tag) => ({
        ...tag,
        state: 'Active',
      }));

    const flattenedTags = updateTags.map((tag) => tag.name).join(', ');

    const success = await writeTagsToDisk(fileId, flattenedTags);

    if (success) {
      return { assetIndex, tags: updateTags /* ioState? */ };
    }

    throw new Error(`Unable to save the asset ${assetIndex}`);
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
    // Loading
    builder.addCase(loadAssets.pending, (state) => {
      state.ioState = 'Loading';
      state.ioMessage = undefined;
    });

    builder.addCase(loadAssets.fulfilled, (state, action) => {
      state.ioState = 'Complete';
      state.ioMessage = undefined;
      state.images = action.payload as ImageAsset[];
    });

    builder.addCase(loadAssets.rejected, (state, action) => {
      state.ioState = 'IoError';
      state.ioMessage = action.error.message;
      state.images = [];
    });

    // Saving
    builder.addCase(saveAssets.pending, (state, action) => {
      const { arg } = action.meta;

      const imageIndex = state.images.findIndex((item) => item.fileId === arg);

      state.images[imageIndex].ioState = 'Saving';
      state.ioState = 'Saving';
      state.ioMessage = undefined;
    });

    builder.addCase(saveAssets.fulfilled, (state, action) => {
      state.ioState = 'Complete';
      state.ioMessage = undefined;

      const { arg } = action.meta;
      const { tags } = action.payload as {
        tags: ImageTag[];
      };

      const imageIndex = state.images.findIndex((item) => item.fileId === arg);

      state.images[imageIndex].ioState = 'Complete';
      state.images[imageIndex].tags = tags;
    });

    builder.addCase(saveAssets.rejected, (state, action) => {
      state.ioState = 'IoError';
      state.ioMessage = action.error.message;
    });
  },

  selectors: {
    selectIoState: (state) => {
      return state.ioState;
    },

    selectImages: (state) => {
      return state.images;
    },

    selectImageSizes: createSelector([(state) => state.images], (images) => {
      // Could sort first but I'm lazy
      return images.reduce(
        (
          acc: {
            [key: string]: { width: number; height: number; count: number };
          },
          item: ImageAsset,
        ) => {
          const { composed, width, height } = item.dimensions;
          if (typeof acc[composed] !== 'undefined') {
            return {
              ...acc,
              [composed]: {
                ...acc[composed],
                count: (acc[composed].count += 1),
              },
            };
          } else {
            return { ...acc, [composed]: { width, height, count: 1 } };
          }
        },
        {},
      );
    }),

    // @TODO: Although this is a derived state, it may be more performant to
    // consider keeping the global tag state in sync?
    selectTags: createSelector([(state) => state.images], (imageAssets) => {
      if (!imageAssets) return {};

      return imageAssets.reduce((acc: KeyedCountList, asset: ImageAsset) => {
        const { tagOrder } = asset;

        // This code is annoying me, I don't like the map mutating this array
        const newTagCounts: KeyedCountList = {};

        tagOrder.map((tag: ImageTag) => {
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
export const { selectIoState, selectImages, selectImageSizes, selectTags } =
  imagesSlice.selectors;
