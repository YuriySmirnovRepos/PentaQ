/**
 * Компонент редактора квантовой схемы
 * Placeholder для реализации на Konva.js
 */

import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { useCircuitStore } from '../store/circuit-store';

export const CircuitEditor: React.FC = () => {
  const {
    circuit,
    addGate,
    removeGate,
    selectGate,
    selectedGateId,
    selectedQubit,
    selectQubit,
    undo,
    redo,
    canUndo,
    canRedo,
    setQubitCount,
  } = useCircuitStore();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Редактор схемы</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()}>
            ← Отменить
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()}>
            Повторить →
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Настройки схемы */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-[var(--text-secondary)]">
            Кубитов:
            <select
              value={circuit.qubitCount}
              onChange={(e) => setQubitCount(Number(e.target.value))}
              className="ml-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-[var(--text-tertiary)]">
            {circuit.gates.length} гейтов
          </span>
        </div>

        {/* Плейсхолдер для Canvas редактора */}
        <div
          className="relative flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border-color) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        >
          <div className="text-center">
            <p className="mb-2 text-[var(--text-secondary)]">
              Canvas редактор будет здесь (Konva.js)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addGate('h', 0, circuit.gates.length)}
                disabled={circuit.gates.length >= 50}
              >
                + H
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addGate('x', 0, circuit.gates.length)}
                disabled={circuit.gates.length >= 50}
              >
                + X
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (circuit.qubitCount > 1) {
                    addGate('cnot', 0, circuit.gates.length, { target: 1 });
                  }
                }}
                disabled={circuit.gates.length >= 50 || circuit.qubitCount < 2}
              >
                + CNOT
              </Button>
            </div>
          </div>
        </div>

        {/* Список гейтов для отладки */}
        <div className="mt-4 max-h-32 overflow-auto">
          <h4 className="mb-2 text-sm font-medium">Гейты:</h4>
          <div className="space-y-1">
            {circuit.gates.map((gate) => (
              <div
                key={gate.id}
                className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm ${
                  selectedGateId === gate.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-[var(--bg-tertiary)]'
                }`}
                onClick={() => selectGate(gate.id)}
              >
                <span>
                  {gate.type.toUpperCase()}
                  {'qubit' in gate && ` [${gate.qubit}]`}
                  {'control' in gate && ` [${gate.control}→${gate.target}]`}
                </span>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGate(gate.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
