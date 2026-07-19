import { useOptimistic, useTransition } from 'react';
import { Code2, Loader2, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import type { JiraTicket } from '@ticket-tdd/shared-types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTransitions } from '../hooks/useTransitions';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setActiveTicket, incrementTicketsVersion } from '../store/ticketWorkflowSlice';
import * as apiClient from '../api/apiClient';

interface TicketCardProps {
  ticket: JiraTicket;
  onGenerateTests: (ticket: JiraTicket) => void;
  onGenerateImplementation: (ticket: JiraTicket) => void;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function statusBadgeVariant(status: string): BadgeVariant {
  const lower = status.toLowerCase();
  if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) return 'default';
  if (lower.includes('progress') || lower.includes('review')) return 'secondary';
  return 'outline';
}

function priorityBadgeVariant(priority: string): BadgeVariant {
  const lower = priority.toLowerCase();
  if (lower === 'highest' || lower === 'blocker') return 'destructive';
  if (lower === 'high') return 'secondary';
  return 'outline';
}

export function TicketCard({ ticket, onGenerateTests, onGenerateImplementation }: TicketCardProps) {
  const dispatch = useAppDispatch();
  const credentials = useAppSelector((state) => state.jiraAuth);
  const hasGeneratedTests = useAppSelector(
    (state) => !!state.ticketWorkflow.generatedTests[ticket.id]
  );

  const { transitions, loading: transitionsLoading, fetchTransitions } = useTransitions(ticket.id);
  const [isTransitioning, startTransition] = useTransition();

  // Optimistic status updates — shows the selected transition name immediately.
  // Reverts to the real ticket.status value once ticketsVersion increments and
  // the parent refetches new ticket data.
  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    ticket.status,
    (_currentStatus: string, newStatus: string) => newStatus
  );

  function handleTransitionSelect(transitionId: string) {
    const transition = transitions.find((t) => t.id === transitionId);
    if (!transition) return;

    startTransition(async () => {
      addOptimisticStatus(transition.name);
      try {
        const result = await apiClient.postTransition(credentials, ticket.id, { transitionId });
        if (result.success) {
          dispatch(incrementTicketsVersion());
          toast.success(`Moved "${ticket.key}" to "${transition.name}"`);
        } else {
          toast.error(result.error ?? 'Transition failed.');
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Transition failed.');
      }
    });
  }

  function handleGenerateTestsClick() {
    dispatch(setActiveTicket(ticket.id));
    onGenerateTests(ticket);
  }

  function handleGenerateImplementationClick() {
    dispatch(setActiveTicket(ticket.id));
    onGenerateImplementation(ticket);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs font-medium text-muted-foreground">{ticket.key}</span>
          {isTransitioning && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">
          {ticket.summary}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-3">
        {/* Status, issue type, and priority badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={statusBadgeVariant(optimisticStatus)} className="text-xs">
            {optimisticStatus}
          </Badge>
          {ticket.issueType && (
            <Badge variant="outline" className="text-xs">
              {ticket.issueType}
            </Badge>
          )}
          {ticket.priority && (
            <Badge variant={priorityBadgeVariant(ticket.priority)} className="text-xs">
              {ticket.priority}
            </Badge>
          )}
        </div>

        {/* Description preview */}
        {ticket.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {ticket.description}
          </p>
        )}

        {/* Workflow transition select — lazy-loads on first open */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Move to</p>
          <Select
            onOpenChange={(isOpen) => { if (isOpen) void fetchTransitions(); }}
            onValueChange={handleTransitionSelect}
            disabled={isTransitioning}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select transition..." />
            </SelectTrigger>
            <SelectContent>
              {transitionsLoading && (
                <div className="flex items-center justify-center p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {transitions.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleGenerateTestsClick}
        >
          <TestTube2 className="h-3.5 w-3.5" />
          {hasGeneratedTests ? 'Regenerate Tests' : 'Generate Tests'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs"
          disabled={!hasGeneratedTests}
          onClick={handleGenerateImplementationClick}
          title={!hasGeneratedTests ? 'Generate tests first' : undefined}
        >
          <Code2 className="h-3.5 w-3.5" />
          Generate Impl
        </Button>
      </CardFooter>
    </Card>
  );
}
