/**
 * Гистограмма результатов измерений
 */

import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { useCircuitStore } from '@features/circuit-editor';
import { simulateCircuit } from '@core/simulation';
import { useState } from 'react';
import type { SimulationResult } from '@core/quantum/types';

export const Histogram: React.FC = () => {
  const { circuit } = useCircuitStore();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = (): void => {
    setIsSimulating(true);
    // Используем setTimeout для имитации асинхронности
    setTimeout(() => {
      try {
        const simResult = simulateCircuit(circuit);
        setResult(simResult);
      } catch (e) {
        console.error('Simulation error:', e);
      } finally {
        setIsSimulating(false);
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Результаты</CardTitle>
        <Button size="sm" onClick={runSimulation} isLoading={isSimulating}>
          Запустить
        </Button>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Вероятности:</h4>
            <div className="max-h-40 space-y-1 overflow-auto">
              {result.counts &&
                Object.entries(result.counts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([state, count]) => (
                    <div key={state} className="flex items-center gap-2">
                      <span className="w-12 font-mono text-sm">|{state}⟩</span>
                      <div className="flex-1">
                        <div
                          className="h-4 rounded bg-blue-500 transition-all"
                          style={{ width: `${(count / 1024) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-[var(--text-secondary)]">
                        {((count / 1024) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
            </div>

            {result.blochVectors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Векторы Блоха:</h4>
                <div className="mt-1 space-y-1 text-xs">
                  {result.blochVectors.map((vec, i) => (
                    <div
                      key={i}
                      className={`flex justify-between rounded px-2 py-1 ${
                        vec.isEntangled ? 'bg-yellow-100 dark:bg-yellow-900' : ''
                      }`}
                    >
                      <span>Кубит {i}:</span>
                      <span className="font-mono">
                        x={vec.x.toFixed(2)}, y={vec.y.toFixed(2)}, z={vec.z.toFixed(2)}
                        {vec.isEntangled && ' ⚠️'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Нажмите "Запустить" для симуляции
          </p>
        )}
      </CardContent>
    </Card>
  );
};
