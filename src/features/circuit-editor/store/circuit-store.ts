/**
 * Zustand store для квантовой схемы
 * Command Pattern для Undo/Redo, URL state для sharing
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Circuit, Gate, GatePosition, CircuitValidationError } from '@core/quantum/types';
import { CONSTRAINTS } from '@core/quantum/types';
import {
  createCircuit,
  addGate as addGateToCircuit,
  removeGate as removeGateFromCircuit,
  moveGate as moveGateInCircuit,
  setQubitCount as setCircuitQubitCount,
  validateCircuit,
  createGate,
} from '@core/quantum/circuit';

/** Интерфейс команды (Command Pattern) */
interface Command {
  execute: (circuit: Circuit) => Circuit;
  undo: (circuit: Circuit) => Circuit;
  description: string;
}

/** State store */
interface CircuitState {
  // Данные
  circuit: Circuit;
  history: Command[];
  future: Command[];
  validationErrors: CircuitValidationError[];

  // UI state
  selectedQubit: number | null;
  selectedGateId: string | null;
  isDragging: boolean;

  // Actions
  setCircuit: (circuit: Circuit) => void;
  addGate: (gateType: Gate['type'], qubit: number, stepIndex: number, params?: Record<string, number>) => void;
  removeGate: (gateId: string) => void;
  moveGate: (gateId: string, newPosition: GatePosition) => void;
  selectQubit: (qubit: number | null) => void;
  selectGate: (gateId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  setQubitCount: (count: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Serialization
  serializeToUrl: () => string;
  loadFromUrl: (urlParam: string) => boolean;
}

/** Фабрика команд для гейтов */
const createAddGateCommand = (
  gateType: Gate['type'],
  qubit: number,
  stepIndex: number,
  params?: Record<string, number>
): Command => {
  let addedGateId: string | null = null;

  return {
    execute: (circuit) => {
      const position: GatePosition = { qubitIndex: qubit, stepIndex };
      let gate: Gate;

      switch (gateType) {
        case 'x':
        case 'y':
        case 'z':
        case 'h':
        case 's':
        case 't':
          gate = { ...createGate[gateType](qubit, position), id: '' };
          break;
        case 'rx':
        case 'ry':
        case 'rz':
          gate = { ...createGate[gateType](qubit, params?.angle ?? 0, position), id: '' };
          break;
        case 'cnot':
        case 'cz': {
          const target = params?.target ?? (qubit + 1) % CONSTRAINTS.MAX_QUBITS;
          gate = { ...createGate[gateType](qubit, target, position), id: '' };
          break;
        }
        case 'swap': {
          const qubit2 = params?.qubit2 ?? (qubit + 1) % CONSTRAINTS.MAX_QUBITS;
          gate = { ...createGate.swap(qubit, qubit2, position), id: '' };
          break;
        }
        case 'measure':
          gate = { ...createGate.measure(qubit, qubit, position), id: '' };
          break;
        default:
          throw new Error(`Unknown gate type: ${gateType}`);
      }

      const newCircuit = addGateToCircuit(circuit, gate);
      // Сохраняем ID для undo
      const addedGate = newCircuit.gates[newCircuit.gates.length - 1];
      addedGateId = addedGate?.id ?? null;
      return newCircuit;
    },
    undo: (circuit) => {
      if (!addedGateId) return circuit;
      return removeGateFromCircuit(circuit, addedGateId);
    },
    description: `Добавить гейт ${gateType}`,
  };
};

const createRemoveGateCommand = (gateId: string, circuitBeforeRemove: Circuit): Command => {
  let removedGate: Gate | null = null;

  return {
    execute: (circuit) => {
      removedGate = circuit.gates.find((g) => g.id === gateId) ?? null;
      return removeGateFromCircuit(circuit, gateId);
    },
    undo: (circuit) => {
      if (!removedGate) return circuit;
      return addGateToCircuit(circuit, removedGate);
    },
    description: 'Удалить гейт',
  };
};

const createMoveGateCommand = (gateId: string, newPosition: GatePosition, oldPosition: GatePosition): Command => {
  return {
    execute: (circuit) => moveGateInCircuit(circuit, gateId, newPosition),
    undo: (circuit) => moveGateInCircuit(circuit, gateId, oldPosition),
    description: 'Переместить гейт',
  };
};

/** Zustand store с Immer middleware */
export const useCircuitStore = create<CircuitState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      circuit: createCircuit(2, 'Новая схема'),
      history: [],
      future: [],
      validationErrors: [],
      selectedQubit: null,
      selectedGateId: null,
      isDragging: false,

      // Actions
      setCircuit: (circuit) => {
        set((state) => {
          state.circuit = circuit;
          state.validationErrors = validateCircuit(circuit).errors ?? [];
        });
      },

      addGate: (gateType, qubit, stepIndex, params) => {
        const command = createAddGateCommand(gateType, qubit, stepIndex, params);

        set((state) => {
          state.circuit = command.execute(state.circuit);
          state.history.push(command);
          state.future = []; // Очищаем future при новом действии
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
        });
      },

      removeGate: (gateId) => {
        const { circuit } = get();
        const command = createRemoveGateCommand(gateId, circuit);

        set((state) => {
          state.circuit = command.execute(state.circuit);
          state.history.push(command);
          state.future = [];
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
          if (state.selectedGateId === gateId) {
            state.selectedGateId = null;
          }
        });
      },

      moveGate: (gateId, newPosition) => {
        const { circuit } = get();
        const gate = circuit.gates.find((g) => g.id === gateId);
        if (!gate) return;

        const oldPosition = gate.position;
        const command = createMoveGateCommand(gateId, newPosition, oldPosition);

        set((state) => {
          state.circuit = command.execute(state.circuit);
          state.history.push(command);
          state.future = [];
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
        });
      },

      selectQubit: (qubit) => {
        set((state) => {
          state.selectedQubit = qubit;
        });
      },

      selectGate: (gateId) => {
        set((state) => {
          state.selectedGateId = gateId;
        });
      },

      setDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging;
        });
      },

      setQubitCount: (count) => {
        set((state) => {
          state.circuit = setCircuitQubitCount(state.circuit, count);
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
          // Сбрасываем выделение если кубит вышел за пределы
          if (state.selectedQubit !== null && state.selectedQubit >= count) {
            state.selectedQubit = null;
          }
        });
      },

      // Undo/Redo
      undo: () => {
        const { history } = get();
        if (history.length === 0) return;

        const lastCommand = history[history.length - 1];

        set((state) => {
          state.circuit = lastCommand.undo(state.circuit);
          state.history.pop();
          state.future.unshift(lastCommand);
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
        });
      },

      redo: () => {
        const { future } = get();
        if (future.length === 0) return;

        const nextCommand = future[0];

        set((state) => {
          state.circuit = nextCommand.execute(state.circuit);
          state.future.shift();
          state.history.push(nextCommand);
          state.validationErrors = validateCircuit(state.circuit).errors ?? [];
        });
      },

      canUndo: () => get().history.length > 0,
      canRedo: () => get().future.length > 0,

      // Serialization
      serializeToUrl: () => {
        const { circuit } = get();
        const serialized = JSON.stringify({
          v: 1,
          n: circuit.qubitCount,
          g: circuit.gates.map((g) => ({
            t: g.type,
            p: g.position,
            ...(g.type === 'rx' || g.type === 'ry' || g.type === 'rz'
              ? { q: (g as { qubit: number }).qubit, a: (g as { angle: number }).angle }
              : 'qubit' in g
              ? { q: g.qubit }
              : 'control' in g
              ? { c: g.control, t2: g.target }
              : {}),
          })),
        });
        return compressToEncodedURIComponent(serialized);
      },

      loadFromUrl: (urlParam) => {
        try {
          const decompressed = decompressFromEncodedURIComponent(urlParam);
          if (!decompressed) return false;

          const parsed = JSON.parse(decompressed);
          if (parsed.v !== 1) return false;

          // Восстановление схемы
          const circuit = createCircuit(parsed.n);
          const restoredGates: Gate[] = parsed.g.map((g: Record<string, unknown>) => {
            const position = g.p as GatePosition;

            switch (g.t) {
              case 'x':
              case 'y':
              case 'z':
              case 'h':
              case 's':
              case 't':
                return { ...createGate[g.t as keyof typeof createGate](g.q as number, position), id: generateId() } as Gate;
              case 'rx':
              case 'ry':
              case 'rz':
                return { ...createGate[g.t as keyof typeof createGate](g.q as number, g.a as number, position), id: generateId() } as Gate;
              case 'cnot':
              case 'cz':
                return { ...createGate[g.t as keyof typeof createGate](g.c as number, g.t2 as number, position), id: generateId() } as Gate;
              case 'swap':
                return { ...createGate.swap(g.c as number, g.t2 as number, position), id: generateId() };
              case 'measure':
                return { ...createGate.measure(g.q as number, g.q as number, position), id: generateId() };
              default:
                throw new Error(`Unknown gate type in URL: ${g.t}`);
            }
          });

          set((state) => {
            state.circuit = { ...circuit, gates: restoredGates };
            state.history = [];
            state.future = [];
            state.validationErrors = validateCircuit(state.circuit).errors ?? [];
          });

          return true;
        } catch (e) {
          console.error('Failed to load circuit from URL:', e);
          return false;
        }
      },
    })),
    { name: 'CircuitStore' }
  )
);

// Импорт для generateId
import { generateId } from '@shared/lib/utils';
