import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

const suppressionChecks: Array<(e: ErrorEvent | PromiseRejectionEvent) => boolean> = [
  (e) => {
    const err = e instanceof PromiseRejectionEvent ? (e.reason as Error | undefined) : e.error;
    return (
      err?.name === 'AbortError' &&
      String(err?.message).includes('play()')
    );
  },
  (e) => {
    const err = e instanceof PromiseRejectionEvent ? (e.reason as Error | undefined) : e.error;
    const message = String(err?.message ?? '');
    return message.includes("reading 'startTime'");
  },
];

window.addEventListener('error', (event) => {
  if (suppressionChecks.some((check) => check(event))) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (suppressionChecks.some((check) => check(event))) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);