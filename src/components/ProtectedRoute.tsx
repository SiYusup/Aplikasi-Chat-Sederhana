import { useAuth, useClerk } from '@clerk/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import {
  clearSessionActivity,
  isSessionStale,
  touchSessionActivity,
} from '../lib/sessionActivity';

// Guard route privat (T-15): belum login -> /sign-in.
// T-31: login tercatat 3 hari; lewat 3 hari tanpa aktivitas -> keluar,
// wajib login ulang.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const location = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (isSessionStale()) {
      clearSessionActivity();
      void signOut({ redirectUrl: '/sign-in' });
      return;
    }
    touchSessionActivity();
  }, [isLoaded, isSignedIn, location.pathname, signOut]);

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    );
  }
  return <>{children}</>;
}
