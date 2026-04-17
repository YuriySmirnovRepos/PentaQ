/**
 * Панель управления (кнопки действий)
 */

import { Button } from '@shared/ui/button';
import { useCircuitStore } from '@features/circuit-editor';
import { useTheme } from '@app/providers/theme-provider';
import { downloadFile } from '@shared/lib/utils';

export const ControlPanel: React.FC = () => {
  const { circuit, serializeToUrl, loadFromUrl } = useCircuitStore();
  const { theme, toggleTheme } = useTheme();

  const handleExport = (): void => {
    const json = JSON.stringify(circuit, null, 2);
    downloadFile(json, `${circuit.name.replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleShare = (): void => {
    const urlParam = serializeToUrl();
    const url = `${window.location.origin}${window.location.pathname}?c=${urlParam}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована в буфер обмена!');
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>

      <div className="mx-2 h-6 w-px bg-[var(--border-color)]" />

      <Button variant="default" size="sm" onClick={handleExport}>
        Экспорт JSON
      </Button>

      <Button variant="secondary" size="sm" onClick={handleShare}>
        Поделиться
      </Button>
    </div>
  );
};
