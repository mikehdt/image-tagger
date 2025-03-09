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
  async (fileId: string, { getState /*, dispatch*/ }) => {
    // dispatch save state for image

    const {
      assets: { images },
    } = getState() as { assets: ImageAssets };

    const assetIndex = images.findIndex((element) => element.fileId === fileId);

    // const updateTags = images[assetIndex].tags
    //   .filter((tag) => tag.state !== 'ToDelete')
    //   .map((tag) => ({
    //     ...tag,
    //     state: 'Active',
    //   }));

    // const flattenedTags = updateTags.map((tag) => tag.name).join(', ');

    // const success = await writeTagsToDisk(fileId, flattenedTags);

    // if (success) {
    //   return { assetIndex, tags: updateTags /* ioState? */ };
    // }

    // throw new Error(`Unable to save the asset ${assetIndex}`);
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

      // state.images
      //   .find((element) => element.fileId === payload.fileId)
      //   ?.tags.push({
      //     name: payload.tag,
      //     state: 'ToAdd',
      //   });
    },

    deleteTag: (
      state,
      { payload }: PayloadAction<{ assetId: string; tag: string }>,
    ) => {
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload.assetId,
      );

      // Stop if no tags to operate on
      if (!state.images[assetIndex]?.tagStatus) return;

      // const tagState = state.images[assetIndex].tagStatus[tagIndex].state;

      // Active and ToDelete toggle states; ToAdd gets removed
      if (tagState === TagState.SAVED) {
        state.images[assetIndex].tagList[tagIndex] = TagState.TO_DELETE;
      } else if (tagState === TagState.TO_DELETE) {
        state.images[assetIndex].tagList[tagIndex] = TagState.SAVED;
      } else if (tagState === TagState.TO_ADD) {
        state.images[assetIndex].tagList.splice(tagIndex);
      }
    },

    resetTags: (state, { payload }: PayloadAction<string>) => {
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload,
      );

      // Could add an `originalIndex` or similar if resetting re-ordering...
      state.images[assetIndex].tags = state.images[assetIndex].tags
        // Clear delete marks
        .map((tag) => {
          if (tag.state === TagState.TO_DELETE) tag.state = TagState.VALID;
          return tag;
        })
        // Clear new items
        .filter((item) => item.state !== TagState.TO_ADD);
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
    // builder.addCase(saveAssets.pending, (state, action) => {
    //   const { arg } = action.meta;

    //   const imageIndex = state.images.findIndex((item) => item.fileId === arg);

    //   state.images[imageIndex].ioState = 'Saving';
    //   state.ioState = 'Saving';
    //   state.ioMessage = undefined;
    // });

    // builder.addCase(saveAssets.fulfilled, (state, action) => {
    //   state.ioState = 'Complete';
    //   state.ioMessage = undefined;

    //   const { arg } = action.meta;
    //   const { tags } = action.payload as {
    //     tags: ImageTag[];
    //   };

    //   const imageIndex = state.images.findIndex((item) => item.fileId === arg);

    //   state.images[imageIndex].ioState = 'Complete';
    //   state.images[imageIndex].tags = tags;
    // });

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
      // Could sort but I'm lazy
      // Probably should move this logic to a helper instead of a selector?
      return images.reduce(
        (
          acc: {
            [key: string]: number;
          },
          item: ImageAsset,
        ) => {
          const composedDimensions = composeDimensions(item.dimensions);

          return typeof acc[composedDimensions] !== 'undefined'
            ? {
                ...acc,
                [composedDimensions]: acc[composedDimensions] + 1,
              }
            : {
                ...acc,
                [composedDimensions]: 1,
              };
        },
        {},
      );
    }),

    selectTagsByStatus: (state, fileId) => {
      const selectedImage = state.images.find((item) => item.fileId === fileId);

      return selectedImage?.tagStatus || {};
    },

    // @TODO: Although this is a derived state, it may be more performant to
    // consider keeping the global tag state in sync?
    selectAllTags: createSelector([(state) => state.images], (imageAssets) => {
      if (!imageAssets) return {};

      return imageAssets.reduce((acc: KeyedCountList, asset: ImageAsset) => {
        const { tagList } = asset;

        // This code is annoying me, I don't like the map mutating this array
        const newTagCounts: KeyedCountList = {};

        tagList.map((tag) => {
          newTagCounts[tag] = acc[tag] ? acc[tag] + 1 : 1;
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
export const {
  selectIoState,
  selectAllImages,
  selectImageCount,
  selectImageSizes,
  selectAllTags,
  selectTagsByStatus,
} = imagesSlice.selectors;
