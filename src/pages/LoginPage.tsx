import { Show, SignIn, useAuth } from '@clerk/react';
import { Navigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';

// /sign-in — kartu Clerk bertema AnonChat (T-18/T-35, FR-01/02/03).
// routing="path" agar tetap di aplikasi (bukan hosted accounts.dev).
export function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
      <Show when="signed-in">
        <p className="mt-2 text-sm">Mengalihkan…</p>
      </Show>
    </AuthLayout>
  );
}
