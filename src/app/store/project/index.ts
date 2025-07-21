// Main slice definition
import { createSlice } from '@reduxjs/toolkit';

import { coreReducers } from './reducers';
import { ProjectState } from './types';

const initialState: ProjectState = {
  info: {
    projectName: undefined,
    projectPath: undefined,
    projectThumbnail: undefined,
  },
  config: {
    showCropVisualization: false,
  },
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: coreReducers,
  selectors: {
    // Project info selectors
    selectProjectName: (state) => state.info.projectName,
    selectProjectPath: (state) => state.info.projectPath,
    selectProjectThumbnail: (state) => state.info.projectThumbnail,
    selectProjectInfo: (state) => state.info,

    // Project config selectors
    selectShowCropVisualization: (state) => state.config.showCropVisualization,
    selectProjectConfig: (state) => state.config,
  },
});

// Main exports for slice
export const { reducer: projectReducer } = projectSlice;
export const { setProjectInfo, resetProjectState, toggleCropVisualization } =
  projectSlice.actions;

// Export the selectors from the slice
export const {
  selectProjectName,
  selectProjectPath,
  selectProjectThumbnail,
  selectShowCropVisualization,
} = projectSlice.selectors;

// Main exports for project module
export * from './types';
