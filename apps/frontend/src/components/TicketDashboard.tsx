import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { JiraTicket } from '@ticket-tdd/shared-types';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { TicketCard } from './TicketCard';
import { RepoConnector } from './RepoConnector';
import { FileSelectionDialog } from './FileSelectionDialog';
import { ThemeToggle } from './ThemeToggle';
import { useMyTickets } from '../hooks/useMyTickets';
import { useAppDispatch } from '../store/store';
import { clearCredentials } from '../store/jiraAuthSlice';

type GenerationMode = 'tests' | 'implementation';

interface ActiveGeneration {
  ticket: JiraTicket;
  mode: GenerationMode;
}

export function TicketDashboard() {
  const { tickets, loading, error, refetch } = useMyTickets();
  const dispatch = useAppDispatch();
  const [activeGeneration, setActiveGeneration] = useState<ActiveGeneration | null>(null);

  function handleGenerateTests(ticket: JiraTicket) {
    setActiveGeneration({ ticket, mode: 'tests' });
  }

  function handleGenerateImplementation(ticket: JiraTicket) {
    setActiveGeneration({ ticket, mode: 'implementation' });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold tracking-tight">TicketTDD</h1>
            {tickets.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <RepoConnector />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearCredentials())}
              className="text-xs text-muted-foreground"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && tickets.length === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-4">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <Skeleton className="h-8 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-medium">No tickets assigned to you</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tickets assigned to your Jira account will appear here.
            </p>
            <Button variant="outline" className="mt-4" onClick={refetch}>
              Refresh
            </Button>
          </div>
        )}

        {/* Ticket grid */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onGenerateTests={handleGenerateTests}
                onGenerateImplementation={handleGenerateImplementation}
              />
            ))}
          </div>
        )}
      </main>

      {/* File selection + generation dialog */}
      {activeGeneration && (
        <FileSelectionDialog
          ticket={activeGeneration.ticket}
          mode={activeGeneration.mode}
          onClose={() => setActiveGeneration(null)}
        />
      )}
    </div>
  );
}
