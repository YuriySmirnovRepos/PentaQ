/**
 * Интерфейс симулятора (Adapter Pattern)
 * Позволяет легко заменить реализацию (quantum-tensors, WASM, API)
 */

import type { Circuit, SimulationResult, SimulationParams } from '@core/quantum/types';

export interface ISimulator {
  /**
   * Симулирует квантовую схему
   * @param circuit - квантовая схема
   * @param params - параметры симуляции
   * @returns результат симуляции
   */
  simulate(circuit: Circuit, params?: SimulationParams): SimulationResult;

  /**
   * Проверяет, может ли симулятор обработать схему
   */
  canSimulate(circuit: Circuit): boolean;
}
