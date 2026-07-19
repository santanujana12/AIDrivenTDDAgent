import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RepoFileMetadata {
  path: string;
  size: number;
}

export interface RepoState {
  directoryName: string | null;
  files: RepoFileMetadata[];
  selectedPaths: string[];
}

const initialState: RepoState = {
  directoryName: null,
  files: [],
  selectedPaths: [],
};

const repoSlice = createSlice({
  name: 'repo',
  initialState,
  reducers: {
    setRepository(
      state,
      action: PayloadAction<{ directoryName: string; files: RepoFileMetadata[] }>
    ) {
      state.directoryName = action.payload.directoryName;
      state.files = action.payload.files;
      state.selectedPaths = [];
    },
    setSelectedPaths(state, action: PayloadAction<string[]>) {
      state.selectedPaths = action.payload;
    },
    toggleFilePath(state, action: PayloadAction<string>) {
      const path = action.payload;
      const index = state.selectedPaths.indexOf(path);
      if (index === -1) {
        state.selectedPaths.push(path);
      } else {
        state.selectedPaths.splice(index, 1);
      }
    },
    clearRepository() {
      return initialState;
    },
  },
});

export const { setRepository, setSelectedPaths, toggleFilePath, clearRepository } = repoSlice.actions;
export default repoSlice.reducer;
