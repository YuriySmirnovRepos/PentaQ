/**
 * Класс для работы с квантовой схемой
 * Immutable операции, валидация, сериализация
 */

import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  Circuit,
  Gate,
  SingleQubitGate,
  RotationGate,
  TwoQubitGate,
  MeasurementGate,
  GatePosition,
  ValidationResult,
  CircuitValidationError,
} from './types';
import { CONSTRAINTS } from './types';

/** Создание новой схемы */
export const createCircuit = (qubitCount: number, name = 'Новая схема'): Circuit => {
  const now = Date.now();
  return {
    id: uuidv4(),
    name,
    qubitCount: Math.min(Math.max(qubitCount, CONSTRAINTS.MIN_QUBITS), CONSTRAINTS.MAX_QUBITS),
    gates: [],
    createdAt: now,
    updatedAt: now,
  };
};

/** Добавление гейта в схему (immutable) */
export const addGate = (circuit: Circuit, gate: Omit<Gate, 'id'>): Circuit => {
  return produce(circuit, (draft) => {
    const newGate: Gate = {
      ...gate,
      id: uuidv4(),
    } as Gate;
    draft.gates.push(newGate);
    draft.updatedAt = Date.now();
  });
};

/** Удаление гейта по ID */
export const removeGate = (circuit: Circuit, gateId: string): Circuit => {
  return produce(circuit, (draft) => {
    draft.gates = draft.gates.filter((g) => g.id !== gateId);
    draft.updatedAt = Date.now();
  });
};

/** Перемещение гейта */
export const moveGate = (circuit: Circuit, gateId: string, newPosition: GatePosition): Circuit => {
  return produce(circuit, (draft) => {
    const gate = draft.gates.find((g) => g.id === gateId);
    if (gate) {
      gate.position = newPosition;
      draft.updatedAt = Date.now();
    }
  });
};

/** Изменение количества кубитов (с удалением orphaned гейтов) */
export const setQubitCount = (circuit: Circuit, newCount: number): Circuit => {
  const validCount = Math.min(
    Math.max(newCount, CONSTRAINTS.MIN_QUBITS),
    CONSTRAINTS.MAX_QUBITS
  );

  return produce(circuit, (draft) => {
    draft.qubitCount = validCount;
    // Удаляем гейты, которые выходят за пределы нового количества кубитов
    draft.gates = draft.gates.filter((g) => {
      if ('qubit' in g) return g.qubit < validCount;
      if ('control' in g) return g.control < validCount && g.target < validCount;
      return true;
    });
    draft.updatedAt = Date.now();
  });
};

/** Валидация схемы */
export const validateCircuit = (circuit: Circuit): ValidationResult => {
  const errors: CircuitValidationError[] = [];

  // Проверка количества гейтов
  if (circuit.gates.length > CONSTRAINTS.MAX_GATES) {
    errors.push({
      type: 'MAX_GATES_EXCEEDED',
      current: circuit.gates.length,
      max: CONSTRAINTS.MAX_GATES,
    });
  }

  // Проверка каждого гейта
  const usedPositions = new Set<string>();

  for (const gate of circuit.gates) {
    // Проверка перекрытия позиций
    const posKey = `${gate.position.qubitIndex}-${gate.position.stepIndex}`;
    if (usedPositions.has(posKey)) {
      errors.push({ type: 'OVERLAPPING_GATES', position: gate.position });
    }
    usedPositions.add(posKey);

    // Валидация по типу гейта
    if ('qubit' in gate) {
      if (gate.qubit >= circuit.qubitCount) {
        errors.push({
          type: 'INVALID_QUBIT_INDEX',
          qubit: gate.qubit,
          maxAllowed: circuit.qubitCount - 1,
        });
      }

      // Проверка угла для ротаций
      if ('angle' in gate) {
        if (gate.angle < 0 || gate.angle > 2 * Math.PI) {
          errors.push({
            type: 'INVALID_ANGLE',
            angle: gate.angle,
            gate: gate.type,
          });
        }
      }
    }

    if ('control' in gate) {
      // Проверка control !== target
      if (gate.control === gate.target) {
        errors.push({
          type: 'SAME_CONTROL_TARGET',
          gate: gate.type,
          qubit: gate.control,
        });
      }

      // Проверка индексов
      if (gate.control >= circuit.qubitCount) {
        errors.push({
          type: 'INVALID_QUBIT_INDEX',
          qubit: gate.control,
          maxAllowed: circuit.qubitCount - 1,
        });
      }
      if (gate.target >= circuit.qubitCount) {
        errors.push({
          type: 'INVALID_QUBIT_INDEX',
          qubit: gate.target,
          maxAllowed: circuit.qubitCount - 1,
        });
      }
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
};

/** Сериализация схемы в JSON */
export const serializeCircuit = (circuit: Circuit): string => {
  return JSON.stringify(circuit);
};

/** Десериализация схемы */
export const deserializeCircuit = (json: string): Circuit | null => {
  try {
    const parsed = JSON.parse(json) as Circuit;
    // Базовая валидация структуры
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.qubitCount === 'number' &&
      Array.isArray(parsed.gates)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

/** Создание гейтов (factory functions) */
export const createGate = {
  x: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 'x',
    qubit,
    position,
  }),

  y: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 'y',
    qubit,
    position,
  }),

  z: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 'z',
    qubit,
    position,
  }),

  h: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 'h',
    qubit,
    position,
  }),

  s: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 's',
    qubit,
    position,
  }),

  t: (qubit: number, position: GatePosition): SingleQubitGate => ({
    id: '',
    type: 't',
    qubit,
    position,
  }),

  rx: (qubit: number, angle: number, position: GatePosition): RotationGate => ({
    id: '',
    type: 'rx',
    qubit,
    angle,
    position,
  }),

  ry: (qubit: number, angle: number, position: GatePosition): RotationGate => ({
    id: '',
    type: 'ry',
    qubit,
    angle,
    position,
  }),

  rz: (qubit: number, angle: number, position: GatePosition): RotationGate => ({
    id: '',
    type: 'rz',
    qubit,
    angle,
    position,
  }),

  cnot: (control: number, target: number, position: GatePosition): TwoQubitGate => ({
    id: '',
    type: 'cnot',
    control,
    target,
    position,
  }),

  cz: (control: number, target: number, position: GatePosition): TwoQubitGate => ({
    id: '',
    type: 'cz',
    control,
    target,
    position,
  }),

  swap: (qubit1: number, qubit2: number, position: GatePosition): TwoQubitGate => ({
    id: '',
    type: 'swap',
    control: qubit1,
    target: qubit2,
    position,
  }),

  measure: (qubit: number, classicalBit: number, position: GatePosition): MeasurementGate => ({
    id: '',
    type: 'measure',
    qubit,
    classicalBit,
    position,
  }),
};
