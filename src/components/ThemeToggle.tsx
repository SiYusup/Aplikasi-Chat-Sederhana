import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../hooks/useTheme';

// Toggle dark/light di header (T-17). Ikon-only -> wajib aria-label (T-22).
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const Dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={Dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={Dark ? 'Mode terang' : 'Mode gelap'}
      className="nb-btn-icon"
    >
      {Dark ? <Sun weight="bold" /> : <Moon weight="bold" />}
    </button>
  );
}
