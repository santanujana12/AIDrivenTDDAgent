import { useState, useCallback } from 'react';
import type { JiraTransition } from '@ticket-tdd/shared-types';
import { useAppSelector } from '../store/store';
import * as apiClient from '../api/apiClient';

interface TransitionsState {
  transitions: JiraTransition[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

/**
 * Lazily fetches the available workflow transitions for a Jira ticket.
 *
 * Call fetchTransitions() only when the dropdown is actually opened so we
 * don't fire N requests for every visible card on mount.
 */
export function useTransitions(issueId: string) {
  const credentials = useAppSelector((state) => state.jiraAuth);
  const [state, setState] = useState<TransitionsState>({
    transitions: [],
    loading: false,
    error: null,
    hasFetched: false,
  });

  const fetchTransitions = useCallback(async () => {
    // Only fetch once per card lifetime; the dropdown shows the cached result on re-open
    if (state.hasFetched || state.loading) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.fetchTransitions(credentials, issueId);
      setState({ transitions: data.transitions, loading: false, error: null, hasFetched: true });
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load transitions.',
      }));
    }
  }, [issueId, credentials, state.hasFetched, state.loading]);

  return { ...state, fetchTransitions };
}
