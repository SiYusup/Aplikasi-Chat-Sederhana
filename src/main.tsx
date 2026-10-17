import { ClerkProvider } from '@clerk/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { clerkAppearance, clerkLocalization } from './lib/clerkAppearance';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={clerkAppearance}
      localization={clerkLocalization}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
