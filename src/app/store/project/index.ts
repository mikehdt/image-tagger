// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { coreReducers } from './reducers';
import { ProjectState, TagSortDirection, TagSortType } from './types';

const initialState: ProjectState = {
  info: {
    projectName: undefined,
    projectPath: undefined,
    projectFolderName: undefined,
    projectThumbnail: undefined,
  },
  config: {
    showCropVisualization: false,
    tagSortType: TagSortType.SORTABLE,
    tagSortDirection: TagSortDirection.ASC,
  },
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: coreReducers,
  selectors: {
    // Project info selectors
    selectProjectName: (state) => state.info.projectName,
    selectProjectFolderName: (state) => state.info.projectFolderName,
    selectProjectThumbnail: (state) => state.info.projectThumbnail,
    selectProjectInfo: (state) => state.info,

    // Project config selectors
    selectShowCropVisualization: (state) => state.config.showCropVisualization,
    selectTagSortType: (state) => state.config.tagSortType,
    selectTagSortDirection: (state) => state.config.tagSortDirection,
    selectProjectConfig: (state) => state.config,
  },
});

// Main exports for slice
export const { reducer: projectReducer } = projectSlice;
export const {
  setProjectInfo,
  resetProjectState,
  toggleCropVisualization,
  setTagSortType,
  setTagSortDirection,
  toggleTagSortDirection,
} = projectSlice.actions;

// Export the selectors from the slice
export const {
  selectProjectName,
  selectProjectFolderName,
  selectProjectThumbnail,
  selectProjectInfo,
  selectShowCropVisualization,
  selectTagSortType,
  selectTagSortDirection,
} = projectSlice.selectors;

// Main exports for project module
export * from './types';
