import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GenerateTestsResponse, GenerateImplementationResponse } from '@ticket-tdd/shared-types';

export interface TicketWorkflowState {
  activeTicketId: string | null;
  generatedTests: Record<string, GenerateTestsResponse>;
  generatedImplementations: Record<string, GenerateImplementationResponse>;
  // Incrementing this value forces useMyTickets to refetch, replacing React Query invalidation.
  ticketsVersion: number;
}

const initialState: TicketWorkflowState = {
  activeTicketId: null,
  generatedTests: {},
  generatedImplementations: {},
  ticketsVersion: 0,
};

const ticketWorkflowSlice = createSlice({
  name: 'ticketWorkflow',
  initialState,
  reducers: {
    setActiveTicket(state, action: PayloadAction<string | null>) {
      state.activeTicketId = action.payload;
    },
    storeGeneratedTests(
      state,
      action: PayloadAction<{ ticketId: string; result: GenerateTestsResponse }>
    ) {
      state.generatedTests[action.payload.ticketId] = action.payload.result;
    },
    storeGeneratedImplementation(
      state,
      action: PayloadAction<{ ticketId: string; result: GenerateImplementationResponse }>
    ) {
      state.generatedImplementations[action.payload.ticketId] = action.payload.result;
    },
    incrementTicketsVersion(state) {
      state.ticketsVersion += 1;
    },
  },
});

export const {
  setActiveTicket,
  storeGeneratedTests,
  storeGeneratedImplementation,
  incrementTicketsVersion,
} = ticketWorkflowSlice.actions;
export default ticketWorkflowSlice.reducer;
