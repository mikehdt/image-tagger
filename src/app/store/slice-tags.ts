import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export enum TagState {
  SAVED = 'Saved',
  TO_DELETE = 'ToDelete',
  TO_ADD = 'ToAdd',
}

const initialState = {
  ioState: 'Uninitialized',
  ioMessage: undefined,
  images: [],
};

const tagsSlice = createSlice({
  name: 'tags',
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

      state.images[imageIndex].tagList.push(tagName);
      state.images[imageIndex].tagStatus[tagName] = TagState.TO_ADD;
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
      const assetIndex = state.images.findIndex(
        (element) => element.fileId === payload,
      );

      state.images[assetIndex].tagList
        // Clear new items
        .filter((tagName) => {
          if (state.images[assetIndex].tagStatus[tagName] === TagState.TO_ADD) {
            delete state.images[assetIndex].tagStatus[tagName];
            return false;
          }

          return true;
        })
        // Clear delete marks
        .map((tagName) => {
          if (
            state.images[assetIndex].tagStatus[tagName] === TagState.TO_DELETE
          )
            state.images[assetIndex].tagStatus[tagName] = TagState.SAVED;
        });
    },
  },

  selectors: {
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

export const { reducer: tagsReducer } = tagsSlice;
export const { addTag, deleteTag, resetTags } = tagsSlice.actions;
export const { selectAllTags, selectTagsByStatus } = tagsSlice.selectors;
