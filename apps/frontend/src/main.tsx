import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store/store';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './app/app';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
        <Toaster richColors position="top-right" closeButton />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);