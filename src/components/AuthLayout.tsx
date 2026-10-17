import {
  ChatCircleDots,
  ClockCountdown,
  EyeSlash,
  Ghost,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

// Halaman auth (T-35): SATU panel — kolom brand + kolom form Clerk menyatu.
// Dipakai LoginPage & SignUpPage agar keduanya satu tema.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="nb-auth">
      <div className="nb-auth-toggle">
        <ThemeToggle />
      </div>
      <div className="nb-auth-panel">
        <section className="nb-auth-brand" aria-label="Tentang AnonChat">
          <span className="nb-auth-badge" aria-hidden="true">
            <Ghost weight="bold" />
          </span>
          <div className="nb-auth-brand-text">
            <h1 className="font-head">AnonChat</h1>
            <p className="nb-auth-tagline">Chat tanpa nama, tanpa drama.</p>
          </div>
          <ul className="nb-auth-points">
            <li>
              <EyeSlash weight="bold" aria-hidden="true" />
              <span>Tanpa nama asli — hanya nama tampilan</span>
            </li>
            <li>
              <ChatCircleDots weight="bold" aria-hidden="true" />
              <span>Chat global + private 1-on-1</span>
            </li>
            <li>
              <ClockCountdown weight="bold" aria-hidden="true" />
              <span>Sesi tercatat 3 hari</span>
            </li>
          </ul>
        </section>
        <section className="nb-auth-card" aria-label="Formulir akun">
          {children}
        </section>
      </div>
    </main>
  );
}
