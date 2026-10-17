import { Show, SignUp, useAuth } from '@clerk/react';
import { Navigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';

// /sign-up — kartu daftar bertema AnonChat (T-35).
// routing="path" agar tetap di aplikasi (bukan hosted accounts.dev).
export function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
      <Show when="signed-in">
        <p className="mt-2 text-sm">Mengalihkan…</p>
      </Show>
    </AuthLayout>
  );
}
