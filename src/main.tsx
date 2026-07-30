import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import {configureErrorReporting, installGlobalErrorHandlers} from './lib/errorReporting.ts';
import {submitErrorReport} from './lib/supabase.ts';
import './index.css';

configureErrorReporting(submitErrorReport);
const removeGlobalErrorHandlers = installGlobalErrorHandlers();
if (import.meta.hot) import.meta.hot.dispose(removeGlobalErrorHandlers);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
