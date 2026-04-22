/**
 * Визуализация сферы Блоха
 * Placeholder для React Three Fiber
 */

import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/card';
import { useCircuitStore } from '@features/circuit-editor';

export const BlochSphereView: React.FC = () => {
  const { circuit, selectedQubit } = useCircuitStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сфера Блоха</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-48 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]"
          style={{
            background: 'radial-gradient(circle at 30% 30%, var(--bg-tertiary), var(--bg-secondary))',
          }}
        >
          <div className="text-center">
            <p className="mb-2 text-[var(--text-secondary)]">
              3D визуализация (React Three Fiber)
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {selectedQubit !== null
                ? `Кубит ${selectedQubit} выбран`
                : 'Выберите кубит для визуализации'}
            </p>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              {circuit.qubitCount} кубитов в схеме
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
