import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import jiraAuthReducer from './jiraAuthSlice';
import repoReducer from './repoSlice';
import ticketWorkflowReducer from './ticketWorkflowSlice';

export const store = configureStore({
  reducer: {
    jiraAuth: jiraAuthReducer,
    repo: repoReducer,
    ticketWorkflow: ticketWorkflowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks so components never have to specify generics manually
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
