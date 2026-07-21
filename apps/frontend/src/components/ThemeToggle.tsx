import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';

/**
 * Cycles through: system → light → dark → system
 * Shows an icon reflecting the *resolved* (actual) theme.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  function cycle() {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  }

  const label =
    theme === 'system' ? 'System theme' : theme === 'light' ? 'Light theme' : 'Dark theme';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      title={label}
      aria-label={label}
      className="h-8 w-8 shrink-0"
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4 transition-transform duration-200" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      )}
    </Button>
  );
}
