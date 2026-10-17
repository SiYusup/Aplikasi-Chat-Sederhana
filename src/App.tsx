import { BrowserRouter, Route, Routes } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalChatPage } from './pages/GlobalChatPage';
import { LoginPage } from './pages/LoginPage';
import { PrivateChatPage } from './pages/PrivateChatPage';
import { SignUpPage } from './pages/SignUpPage';

// Router + guard auth (T-15). T-32: /onboarding dihapus, diganti kartu
// nama di GlobalChatPage. T-35: /sign-up di aplikasi (bukan hosted Clerk).
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in/*" element={<LoginPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <PrivateChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GlobalChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
