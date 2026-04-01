import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { store } from '@/stores/index.ts';
import { Provider } from 'react-redux';
import './lib/axios-setup';
import { Toaster } from '@/components/ui/sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster position="top-center" richColors theme="light" duration={3000} />
      <App />
    </Provider>
  </StrictMode>,
);
