// /**
//TODO: Выполнить рефакторинг под актуальное API библиотеки
//  * Адаптер для библиотеки quantum-tensors
//  * Корректная квантовая механика, partial trace для сферы Блоха
//  */

// import * as qt from 'quantum-tensors';
// import type { ISimulator } from './simulator.interface';
// import type {
//   Circuit,
//   Gate,
//   SimulationResult,
//   SimulationParams,
//   Complex,
//   BlochVector,
// } from '@core/quantum/types';
// import { CONSTRAINTS } from '@core/quantum/types';

// /** Матрицы базовых гейтов (кэшируем для производительности) */
// const GATE_MATRICES: Record<string, qt.Operator> = {
//   x: qt.Operator.fromMatrix([
//     [0, 1],
//     [1, 0],
//   ]),
//   y: qt.Operator.fromMatrix([
//     [0, [0, -1]],
//     [[0, 1], 0],
//   ]),
//   z: qt.Operator.fromMatrix([
//     [1, 0],
//     [0, -1],
//   ]),
//   h: qt.Operator.fromMatrix([
//     [1 / Math.sqrt(2), 1 / Math.sqrt(2)],
//     [1 / Math.sqrt(2), -1 / Math.sqrt(2)],
//   ]),
//   s: qt.Operator.fromMatrix([
//     [1, 0],
//     [0, [0, 1]], // i
//   ]),
//   t: qt.Operator.fromMatrix([
//     [1, 0],
//     [0, [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)]], // e^(iπ/4)
//   ]),
// };

// /** Матрица Паули для расчета сферы Блоха */
// const PAULI_X = qt.Operator.fromMatrix([
//   [0, 1],
//   [1, 0],
// ]);

// const PAULI_Y = qt.Operator.fromMatrix([
//   [0, [0, -1]],
//   [[0, 1], 0],
// ]);

// const PAULI_Z = qt.Operator.fromMatrix([
//   [1, 0],
//   [0, -1],
// ]);

// export class QuantumTensorsAdapter implements ISimulator {
//   canSimulate(circuit: Circuit): boolean {
//     return (
//       circuit.qubitCount <= CONSTRAINTS.MAX_QUBITS &&
//       circuit.gates.length <= CONSTRAINTS.MAX_GATES
//     );
//   }

//   simulate(circuit: Circuit, params: SimulationParams = { shots: 1024 }): SimulationResult {
//     if (!this.canSimulate(circuit)) {
//       throw new Error('Circuit exceeds simulation constraints');
//     }

//     const qubitCount = circuit.qubitCount;

//     // Инициализация: |00...0>
//     let stateVector = new qt.Vector(qubitCount);
//     const initialIndex = Array(qubitCount).fill(0);
//     stateVector.set(initialIndex, [1, 0]);

//     // Применение гейтов
//     for (const gate of circuit.gates) {
//       const operator = this.buildOperator(gate, qubitCount);
//       stateVector = operator.mulVec(stateVector);
//     }

//     // Извлечение результатов
//     const statevector = this.extractStateVector(stateVector);
//     const probabilities = this.calculateProbabilities(statevector);

//     // Расчет векторов Блоха для каждого кубита (partial trace)
//     const blochVectors = this.calculateBlochVectors(stateVector, qubitCount);

//     // Monte Carlo для гистограммы (опционально)
//     const counts = params.shots > 0 ? this.runMeasurement(stateVector, qubitCount, params.shots) : undefined;

//     return {
//       statevector,
//       probabilities,
//       blochVectors,
//       counts,
//     };
//   }

//   /** Построение оператора для гейта */
//   private buildOperator(gate: Gate, qubitCount: number): qt.Operator {
//     switch (gate.type) {
//       case 'x':
//       case 'y':
//       case 'z':
//       case 'h':
//       case 's':
//       case 't': {
//         const baseOp = GATE_MATRICES[gate.type];
//         return this.tensorWithIdentity(baseOp, qubitCount, (gate as { qubit: number }).qubit);
//       }

//       case 'rx':
//       case 'ry':
//       case 'rz': {
//         const { qubit, angle } = gate as { qubit: number; angle: number };
//         const rotationOp = this.createRotationOperator(gate.type, angle);
//         return this.tensorWithIdentity(rotationOp, qubitCount, qubit);
//       }

//       case 'cnot': {
//         const { control, target } = gate as { control: number; target: number };
//         return qt.Operator.controlled(GATE_MATRICES.x, qubitCount, control, target);
//       }

//       case 'cz': {
//         const { control, target } = gate as { control: number; target: number };
//         return qt.Operator.controlled(GATE_MATRICES.z, qubitCount, control, target);
//       }

//       case 'swap': {
//         const { control: q1, target: q2 } = gate as { control: number; target: number };
//         return qt.Operator.swap(qubitCount, q1, q2);
//       }

//       case 'measure': {
//         // Измерение не применяется в симуляции (только для визуализации)
//         // Возвращаем identity
//         return qt.Operator.identity(qubitCount);
//       }

//       default:
//         throw new Error(`Unknown gate type: ${(gate as { type: string }).type}`);
//     }
//   }

//   /** Тензорное произведение с identity для остальных кубитов */
//   private tensorWithIdentity(
//     operator: qt.Operator,
//     totalQubits: number,
//     targetQubit: number
//   ): qt.Operator {
//     // Строим оператор для всей системы
//     // Оптимизация: используем методы quantum-tensors для построения разреженных операторов
//     const ops: qt.Operator[] = [];

//     for (let i = 0; i < totalQubits; i++) {
//       if (i === targetQubit) {
//         ops.push(operator);
//       } else {
//         ops.push(qt.Operator.identity(1));
//       }
//     }

//     // Тензорное произведение всех операторов
//     return ops.reduce((acc, op) => acc.tensor(op));
//   }

//   /** Создание оператора вращения */
//   private createRotationOperator(type: 'rx' | 'ry' | 'rz', angle: number): qt.Operator {
//     const cos = Math.cos(angle / 2);
//     const sin = Math.sin(angle / 2);

//     switch (type) {
//       case 'rx':
//         return qt.Operator.fromMatrix([
//           [cos, [0, -sin]],
//           [[0, -sin], cos],
//         ]);

//       case 'ry':
//         return qt.Operator.fromMatrix([
//           [cos, -sin],
//           [sin, cos],
//         ]);

//       case 'rz':
//         return qt.Operator.fromMatrix([
//           [[Math.cos(-angle / 2), Math.sin(-angle / 2)], 0],
//           [0, [Math.cos(angle / 2), Math.sin(angle / 2)]],
//         ]);

//       default:
//         throw new Error(`Unknown rotation type: ${type}`);
//     }
//   }

//   /** Извлечение вектора состояния */
//   private extractStateVector(vector: qt.Vector): Complex[] {
//     const dim = vector.dim;
//     const result: Complex[] = [];

//     for (let i = 0; i < dim; i++) {
//       const indices = this.indexToBinaryArray(i, Math.log2(dim));
//       const amplitude = vector.get(indices);
//       result.push([amplitude[0], amplitude[1]]);
//     }

//     return result;
//   }

//   /** Вычисление вероятностей */
//   private calculateProbabilities(statevector: Complex[]): number[] {
//     return statevector.map(([re, im]) => re * re + im * im);
//   }

//   /** Расчет векторов Блоха через partial trace */
//   private calculateBlochVectors(stateVector: qt.Vector, qubitCount: number): BlochVector[] {
//     const vectors: BlochVector[] = [];

//     for (let qubit = 0; qubit < qubitCount; qubit++) {
//       // Partial trace: трассируем все кубиты кроме целевого
//       const otherQubits = Array.from({ length: qubitCount }, (_, i) => i).filter((i) => i !== qubit);
//       const reducedDensityMatrix = stateVector.partialTrace(otherQubits);

//       // Ожидаемые значения Паули: Tr(ρσ)
//       const x = reducedDensityMatrix.expectationValue(PAULI_X);
//       const y = reducedDensityMatrix.expectationValue(PAULI_Y);
//       const z = reducedDensityMatrix.expectationValue(PAULI_Z);

//       // Длина вектора (для чистого состояния = 1, для смешанного < 1)
//       const magnitude = Math.sqrt(x * x + y * y + z * z);

//       // Запутанность: вектор внутри сферы
//       const isEntangled = magnitude < 0.99;

//       vectors.push({ x, y, z, magnitude, isEntangled });
//     }

//     return vectors;
//   }

//   /** Monte Carlo симуляция измерений для гистограммы */
//   private runMeasurement(
//     stateVector: qt.Vector,
//     qubitCount: number,
//     shots: number
//   ): Record<string, number> {
//     const probabilities = this.calculateProbabilities(this.extractStateVector(stateVector));
//     const counts: Record<string, number> = {};

//     for (let i = 0; i < shots; i++) {
//       const random = Math.random();
//       let cumulative = 0;
//       let measuredState = 0;

//       for (let j = 0; j < probabilities.length; j++) {
//         cumulative += probabilities[j];
//         if (random <= cumulative) {
//           measuredState = j;
//           break;
//         }
//       }

//       // Форматирование как бинарная строка
//       const binaryKey = measuredState.toString(2).padStart(qubitCount, '0');
//       counts[binaryKey] = (counts[binaryKey] || 0) + 1;
//     }

//     return counts;
//   }

//   /** Вспомогательная функция: число в массив битов */
//   private indexToBinaryArray(index: number, numBits: number): number[] {
//     const result: number[] = [];
//     for (let i = numBits - 1; i >= 0; i--) {
//       result.push((index >> i) & 1);
//     }
//     return result;
//   }
// }

// /** Singleton instance */
// export const quantumSimulator = new QuantumTensorsAdapter();
