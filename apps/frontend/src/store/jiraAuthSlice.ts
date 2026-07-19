import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface JiraAuthState {
  domain: string;
  email: string;
  token: string;
  isConnected: boolean;
}

const initialState: JiraAuthState = {
  domain: '',
  email: '',
  token: '',
  isConnected: false,
};

const jiraAuthSlice = createSlice({
  name: 'jiraAuth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ domain: string; email: string; token: string }>
    ) {
      state.domain = action.payload.domain;
      state.email = action.payload.email;
      state.token = action.payload.token;
      state.isConnected = true;
    },
    clearCredentials() {
      return initialState;
    },
  },
});

export const { setCredentials, clearCredentials } = jiraAuthSlice.actions;
export default jiraAuthSlice.reducer;
