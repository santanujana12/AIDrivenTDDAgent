import { useActionState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ThemeToggle } from './ThemeToggle';
import { useAppDispatch } from '../store/store';
import { setCredentials } from '../store/jiraAuthSlice';
import * as apiClient from '../api/apiClient';
import type { JiraAuthState } from '../store/jiraAuthSlice';

interface ConnectFormState {
  error: string | null;
}

export function JiraConnectForm() {
  const dispatch = useAppDispatch();

  const [formState, connectAction, isPending] = useActionState(
    async (_prevState: ConnectFormState, formData: FormData): Promise<ConnectFormState> => {
      const domain = (formData.get('domain') as string | null)?.trim() ?? '';
      const email = (formData.get('email') as string | null)?.trim() ?? '';
      const token = (formData.get('token') as string | null)?.trim() ?? '';

      if (!domain || !email || !token) {
        return { error: 'All three fields are required.' };
      }

      // Use fetchMyTickets as a connectivity check — no separate verify route needed
      const tempCredentials: JiraAuthState = { domain, email, token, isConnected: false };
      try {
        await apiClient.fetchMyTickets(tempCredentials);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not connect to Jira.';
        toast.error(message);
        return { error: message };
      }

      dispatch(setCredentials({ domain, email, token }));
      toast.success('Connected to Jira!');
      return { error: null };
    },
    { error: null }
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme toggle — top-right corner */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect to Jira</CardTitle>
          <CardDescription>
            Credentials are kept in memory only — never stored in the browser.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={connectAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Jira Domain</Label>
              <Input
                id="domain"
                name="domain"
                placeholder="yourcompany.atlassian.net"
                autoComplete="off"
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Without https:// prefix or trailing slash
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">API Token</Label>
              <Input
                id="token"
                name="token"
                type="password"
                placeholder="Your Jira API token"
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Generate at{' '}
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  id.atlassian.com
                </a>
              </p>
            </div>

            {formState.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {formState.error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
