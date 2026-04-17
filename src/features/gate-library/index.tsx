/**
 * Библиотека гейтов (левая панель)
 */

import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/card';
import { useCircuitStore } from '@features/circuit-editor';

const GATE_CATEGORIES = [
  {
    name: 'Паули',
    gates: [
      { type: 'x', name: 'X', desc: 'Паули-X (NOT)' },
      { type: 'y', name: 'Y', desc: 'Паули-Y' },
      { type: 'z', name: 'Z', desc: 'Паули-Z' },
    ],
  },
  {
    name: 'Адамар',
    gates: [{ type: 'h', name: 'H', desc: 'Адамар (суперпозиция)' }],
  },
  {
    name: 'Фазовые',
    gates: [
      { type: 's', name: 'S', desc: 'Фазовый π/2' },
      { type: 't', name: 'T', desc: 'Фазовый π/4' },
    ],
  },
  {
    name: 'Вращения',
    gates: [
      { type: 'rx', name: 'Rx', desc: 'Вращение вокруг X' },
      { type: 'ry', name: 'Ry', desc: 'Вращение вокруг Y' },
      { type: 'rz', name: 'Rz', desc: 'Вращение вокруг Z' },
    ],
  },
  {
    name: 'Контролируемые',
    gates: [
      { type: 'cnot', name: 'CNOT', desc: 'Контролируемый NOT' },
      { type: 'cz', name: 'CZ', desc: 'Контролируемый Z' },
      { type: 'swap', name: 'SWAP', desc: 'Обмен состоянием' },
    ],
  },
] as const;

export const GateLibrary: React.FC = () => {
  const { addGate, circuit } = useCircuitStore();

  const handleAddGate = (gateType: string): void => {
    // Добавляем на первый кубит, в конец
    addGate(gateType as typeof GATE_CATEGORIES[number]['gates'][number]['type'], 0, circuit.gates.length);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Библиотека гейтов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {GATE_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--text-tertiary)]">
              {category.name}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {category.gates.map((gate) => (
                <button
                  key={gate.type}
                  onClick={() => handleAddGate(gate.type)}
                  className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-3 text-center text-sm font-medium transition-all hover:bg-[var(--bg-tertiary)] hover:shadow-sm active:scale-95"
                  title={gate.desc}
                >
                  {gate.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
