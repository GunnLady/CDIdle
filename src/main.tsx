import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import {configureErrorReporting, installGlobalErrorHandlers} from './lib/errorReporting.ts';
import {submitErrorReport} from './lib/supabase.ts';
import {shouldRenderUiCatalog} from './ui/catalog/catalogAccess.ts';
import './index.css';

const root = createRoot(document.getElementById('root')!);

if (import.meta.env.DEV && shouldRenderUiCatalog(true, window.location.search)) {
  void import('./ui/catalog/UiCatalog.tsx').then(({default: UiCatalog}) => {
    root.render(<StrictMode><UiCatalog /></StrictMode>);
  });
} else {
  configureErrorReporting(submitErrorReport);
  const removeGlobalErrorHandlers = installGlobalErrorHandlers();
  if (import.meta.hot) import.meta.hot.dispose(removeGlobalErrorHandlers);
  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}
