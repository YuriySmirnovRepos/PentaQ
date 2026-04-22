/**
 * Базовые типы для квантовых вычислений
 * Строгая типизация для предотвращения ошибок на уровне компиляции
 */

/** Комплексное число: [real, imag] */
export type Complex = [number, number];

/** Типы однокубитных гейтов */
export type SingleQubitGateType = 'x' | 'y' | 'z' | 'h' | 's' | 't';

/** Типы параметрических вращений */
export type RotationGateType = 'rx' | 'ry' | 'rz';

/** Типы двухкубитных гейтов */
export type TwoQubitGateType = 'cnot' | 'cz' | 'swap';

/** Тип измерения */
export type MeasurementType = 'measure';

/** Все возможные типы гейтов */
export type GateType = SingleQubitGateType | RotationGateType | TwoQubitGateType | MeasurementType;

/** Базовый интерфейс гейта */
interface BaseGate {
  readonly id: string;
  readonly type: GateType;
  readonly position: GatePosition;
}

/** Позиция гейта на схеме */
export interface GatePosition {
  readonly qubitIndex: number;
  readonly stepIndex: number;
}

/** Однокубитный гейт */
export interface SingleQubitGate extends BaseGate {
  readonly type: SingleQubitGateType;
  readonly qubit: number;
}

/** Параметрический гейт вращения */
export interface RotationGate extends BaseGate {
  readonly type: RotationGateType;
  readonly qubit: number;
  readonly angle: number; // в радианах [0, 2π]
}

/** Двухкубитный гейт (контролируемый) */
export interface TwoQubitGate extends BaseGate {
  readonly type: TwoQubitGateType;
  readonly control: number;
  readonly target: number;
}

/** Гейт измерения */
export interface MeasurementGate extends BaseGate {
  readonly type: MeasurementType;
  readonly qubit: number;
  readonly classicalBit: number;
}

/** Объединенный тип всех гейтов (discriminated union) */
export type Gate = SingleQubitGate | RotationGate | TwoQubitGate | MeasurementGate;

/** Квантовая схема */
export interface Circuit {
  readonly id: string;
  readonly name: string;
  readonly qubitCount: number; // 1-5
  readonly gates: readonly Gate[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** Результат симуляции */
export interface SimulationResult {
  readonly statevector: readonly Complex[]; // Длина 2^n
  readonly probabilities: readonly number[]; // |amplitude|^2
  readonly blochVectors: readonly BlochVector[]; // Для каждого кубита
  readonly counts?: Readonly<Record<string, number>>; // Для гистограммы (Monte Carlo)
}

/** Вектор Блоха для визуализации состояния кубита */
export interface BlochVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly magnitude: number; // Длина вектора (для запутанности: < 1)
  readonly isEntangled: boolean;
}

/** Ограничения проекта */
export const CONSTRAINTS = {
  MAX_QUBITS: 5,
  MIN_QUBITS: 1,
  MAX_GATES: 50,
  MAX_SHOTS: 10000,
} as const;

/** История для Undo/Redo */
export interface CircuitHistory {
  readonly past: readonly Circuit[];
  readonly present: Circuit;
  readonly future: readonly Circuit[];
}

/** Параметры симуляции */
export interface SimulationParams {
  readonly shots: number; // Количество измерений для статистики
  readonly seed?: number; // Seed для воспроизводимости
}

/** Ошибки валидации схемы */
export type CircuitValidationError =
  | { type: 'INVALID_QUBIT_INDEX'; qubit: number; maxAllowed: number }
  | { type: 'SAME_CONTROL_TARGET'; gate: TwoQubitGateType; qubit: number }
  | { type: 'MAX_GATES_EXCEEDED'; current: number; max: number }
  | { type: 'INVALID_ANGLE'; angle: number; gate: RotationGateType }
  | { type: 'OVERLAPPING_GATES'; position: GatePosition };

/** Результат валидации */
export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: readonly CircuitValidationError[] };
