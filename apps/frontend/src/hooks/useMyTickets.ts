import { useState, useEffect, useCallback } from 'react';
import type { JiraTicket } from '@ticket-tdd/shared-types';
import { useAppSelector } from '../store/store';
import * as apiClient from '../api/apiClient';

interface TicketsState {
  tickets: JiraTicket[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the current user's assigned Jira tickets.
 *
 * Re-fetches automatically whenever:
 *   - The user connects (isConnected flips to true)
 *   - ticketsVersion increments (e.g. after a successful transition)
 *   - refetch() is called manually (e.g. from the dashboard refresh button)
 */
export function useMyTickets() {
  const credentials = useAppSelector((state) => state.jiraAuth);
  const ticketsVersion = useAppSelector((state) => state.ticketWorkflow.ticketsVersion);
  const [manualRefetchCount, setManualRefetchCount] = useState(0);
  const [state, setState] = useState<TicketsState>({ tickets: [], loading: false, error: null });

  const refetch = useCallback(() => setManualRefetchCount((n) => n + 1), []);

  useEffect(() => {
    if (!credentials.isConnected) return;

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    apiClient
      .fetchMyTickets(credentials, controller.signal)
      .then((data) => setState({ tickets: data.tickets, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load tickets.',
        }));
      });

    return () => controller.abort();
  }, [credentials, ticketsVersion, manualRefetchCount]);

  return { ...state, refetch };
}
