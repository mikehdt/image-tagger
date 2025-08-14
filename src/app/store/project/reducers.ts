// Core reducers for the project slice
import { PayloadAction } from '@reduxjs/toolkit';

import { ProjectState, TagSortDirection, TagSortType } from './types';

export const coreReducers = {
  // Set project information
  setProjectInfo: (
    state: ProjectState,
    {
      payload,
    }: PayloadAction<{ name: string; path: string; thumbnail?: string }>,
  ) => {
    state.info.projectName = payload.name;
    state.info.projectPath = payload.path;
    state.info.projectThumbnail = payload.thumbnail;
  },

  // Reset project to initial state (useful when switching projects)
  resetProjectState: (state: ProjectState) => {
    state.info.projectName = undefined;
    state.info.projectPath = undefined;
    state.info.projectThumbnail = undefined;
    // Reset config to defaults when switching projects
    state.config.showCropVisualization = false;
    state.config.tagSortType = TagSortType.SORTABLE;
    state.config.tagSortDirection = TagSortDirection.ASC;
  },

  // Toggle crop visualization
  toggleCropVisualization: (state: ProjectState) => {
    state.config.showCropVisualization = !state.config.showCropVisualization;
  },

  // Set crop visualization state explicitly
  setCropVisualization: (
    state: ProjectState,
    { payload }: PayloadAction<boolean>,
  ) => {
    state.config.showCropVisualization = payload;
  },

  // Set tag sort type
  setTagSortType: (
    state: ProjectState,
    { payload }: PayloadAction<TagSortType>,
  ) => {
    state.config.tagSortType = payload;
  },

  // Set tag sort direction
  setTagSortDirection: (
    state: ProjectState,
    { payload }: PayloadAction<TagSortDirection>,
  ) => {
    state.config.tagSortDirection = payload;
  },

  // Toggle tag sort direction
  toggleTagSortDirection: (state: ProjectState) => {
    state.config.tagSortDirection =
      state.config.tagSortDirection === TagSortDirection.ASC
        ? TagSortDirection.DESC
        : TagSortDirection.ASC;
  },
};
