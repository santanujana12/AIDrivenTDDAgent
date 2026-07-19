import { useAppSelector } from '../store/store';
import { JiraConnectForm } from '../components/JiraConnectForm';
import { TicketDashboard } from '../components/TicketDashboard';

/**
 * Root component — renders the connect screen when credentials are not set,
 * and the ticket dashboard once the user has connected. No routing library
 * needed for this two-screen app.
 */
export function App() {
  const isConnected = useAppSelector((state) => state.jiraAuth.isConnected);
  return isConnected ? <TicketDashboard /> : <JiraConnectForm />;
}

export default App;
