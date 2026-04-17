/**
 * Нативный квантовый симулятор для до 5 кубитов
 * Чистая реализация без внешних зависимостей
 */

import type { Circuit, SimulationResult, Complex, BlochVector } from '@core/quantum/types';

export {Complex}; 
/** Умножение комплексных чисел */
const cmult = (a: Complex, b: Complex): Complex => [
  a[0] * b[0] - a[1] * b[1],
  a[0] * b[1] + a[1] * b[0],
];

/** Сложение комплексных чисел */
const cadd = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];

/** Сопряжение */
const cconj = (a: Complex): Complex => [a[0], -a[1]];

/** Модуль в квадрате */
const cabs2 = (a: Complex): number => a[0] * a[0] + a[1] * a[1];

/** Матричное умножение для statevector */
const applyMatrix = (matrix: Complex[][], state: Complex[]): Complex[] => {
  const n = matrix.length;
  const result: Complex[] = Array(n).fill(null).map(() => [0, 0]);

  for (let i = 0; i < n; i++) {
    let sum: Complex = [0, 0];
    for (let j = 0; j < n; j++) {
      sum = cadd(sum, cmult(matrix[i][j], state[j]));
    }
    result[i] = sum;
  }

  return result;
};

/** Тензорное произведение матриц */
const tensorProduct = (a: Complex[][], b: Complex[][]): Complex[][] => {
  const na = a.length;
  const nb = b.length;
  const n = na * nb;
  const result: Complex[][] = Array(n).fill(null).map(() => Array(n).fill(null).map(() => [0, 0]));

  for (let i = 0; i < na; i++) {
    for (let j = 0; j < na; j++) {
      for (let k = 0; k < nb; k++) {
        for (let l = 0; l < nb; l++) {
          result[i * nb + k][j * nb + l] = cmult(a[i][j], b[k][l]);
        }
      }
    }
  }

  return result;
};

/** Построение оператора для всей системы */
const buildFullOperator = (
  singleQubitOp: Complex[][],
  qubitCount: number,
  targetQubit: number
): Complex[][] => {
  // Строим I ⊗ I ⊗ ... ⊗ U ⊗ ... ⊗ I
  const identity: Complex[][] = [
    [[1, 0], [0, 0]],
    [[0, 0], [1, 0]],
  ];

  let result: Complex[][] = targetQubit === 0 ? singleQubitOp : identity;

  for (let i = 1; i < qubitCount; i++) {
    const nextOp = i === targetQubit ? singleQubitOp : identity;
    result = tensorProduct(result, nextOp);
  }

  return result;
};

/** CNOT оператор */
const buildCNOTOperator = (qubitCount: number, control: number, target: number): Complex[][] => {
  const dim = 1 << qubitCount;
  const result: Complex[][] = Array(dim).fill(null).map(() =>
    Array(dim).fill(null).map(() => [0, 0] as Complex)
  );

  for (let i = 0; i < dim; i++) {
    const controlBit = (i >> (qubitCount - 1 - control)) & 1;
    if (controlBit === 1) {
      // Flip target bit
      // const targetBit = (i >> (qubitCount - 1 - target)) & 1;
      // const newTargetBit = 1 - targetBit;
      const j = i ^ (1 << (qubitCount - 1 - target));
      result[j][i] = [1, 0];
    } else {
      result[i][i] = [1, 0];
    }
  }

  return result;
};

/** CZ оператор */
const buildCZOperator = (qubitCount: number, control: number, target: number): Complex[][] => {
  const dim = 1 << qubitCount;
  const result: Complex[][] = Array(dim).fill(null).map(() =>
    Array(dim).fill(null).map(() => [0, 0] as Complex)
  );

  for (let i = 0; i < dim; i++) {
    const controlBit = (i >> (qubitCount - 1 - control)) & 1;
    const targetBit = (i >> (qubitCount - 1 - target)) & 1;
    if (controlBit === 1 && targetBit === 1) {
      result[i][i] = [-1, 0];
    } else {
      result[i][i] = [1, 0];
    }
  }

  return result;
};

/** SWAP оператор */
const buildSWAPOperator = (qubitCount: number, q1: number, q2: number): Complex[][] => {
  const dim = 1 << qubitCount;
  const result: Complex[][] = Array(dim).fill(null).map(() =>
    Array(dim).fill(null).map(() => [0, 0] as Complex)
  );

  for (let i = 0; i < dim; i++) {
    const bit1 = (i >> (qubitCount - 1 - q1)) & 1;
    const bit2 = (i >> (qubitCount - 1 - q2)) & 1;
    if (bit1 !== bit2) {
      const j = i ^ (1 << (qubitCount - 1 - q1)) ^ (1 << (qubitCount - 1 - q2));
      result[j][i] = [1, 0];
    } else {
      result[i][i] = [1, 0];
    }
  }

  return result;
};

/** Базовые матрицы гейтов */
const GATES: Record<string, Complex[][]> = {
  x: [
    [[0, 0], [1, 0]],
    [[1, 0], [0, 0]],
  ],
  y: [
    [[0, 0], [0, -1]],
    [[0, 1], [0, 0]],
  ],
  z: [
    [[1, 0], [0, 0]],
    [[0, 0], [-1, 0]],
  ],
  h: [
    [[1 / Math.sqrt(2), 0], [1 / Math.sqrt(2), 0]],
    [[1 / Math.sqrt(2), 0], [-1 / Math.sqrt(2), 0]],
  ],
  s: [
    [[1, 0], [0, 0]],
    [[0, 0], [0, 1]],
  ],
  t: [
    [[1, 0], [0, 0]],
    [[0, 0], [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)]],
  ],
};

/** Матрица вращения Rx */
const rxMatrix = (angle: number): Complex[][] => {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  return [
    [[cos, 0], [0, -sin]],
    [[0, -sin], [cos, 0]],
  ];
};

/** Матрица вращения Ry */
const ryMatrix = (angle: number): Complex[][] => {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  return [
    [[cos, 0], [-sin, 0]],
    [[sin, 0], [cos, 0]],
  ];
};

/** Матрица вращения Rz */
const rzMatrix = (angle: number): Complex[][] => {
  const cos = Math.cos(angle / 2);
  const sin = Math.sin(angle / 2);
  return [
    [[cos, -sin], [0, 0]],
    [[0, 0], [cos, sin]],
  ];
};

/** Partial trace для расчета сферы Блоха */
const partialTrace = (statevector: Complex[], qubitCount: number, keepQubit: number): Complex[][] => {
  const dim = 1 << qubitCount;
  const reducedDim = 2;
  const tracedOutCount = qubitCount - 1;
  const tracedOutDim = 1 << tracedOutCount;

  // ρ = |ψ⟩⟨ψ|
  const density: Complex[][] = Array(dim).fill(null).map(() =>
    Array(dim).fill(null).map(() => [0, 0] as Complex)
  );

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      density[i][j] = cmult(statevector[i], cconj(statevector[j]));
    }
  }

  // Partial trace over all qubits except keepQubit
  const reduced: Complex[][] = [
    [[0, 0], [0, 0]],
    [[0, 0], [0, 0]],
  ];

  for (let i = 0; i < reducedDim; i++) {
    for (let j = 0; j < reducedDim; j++) {
      for (let k = 0; k < tracedOutDim; k++) {
        // Конструируем полные индексы
        const bitKeep = (i << (qubitCount - 1 - keepQubit)) & (1 << (qubitCount - 1 - keepQubit)) ? 1 : 0;
        // const fullI = (k & ((1 << (qubitCount - 1 - keepQubit)) - 1)) |
                      (bitKeep << (qubitCount - 1 - keepQubit)) |
                      ((k >> (qubitCount - 1 - keepQubit)) << (qubitCount - keepQubit));
        // const fullJ = fullI; // Для диагональных элементов при упрощенном подходе

        // Упрощенный partial trace
        let sum: Complex = [0, 0];
        for (let tracedState = 0; tracedState < tracedOutDim; tracedState++) {
          const idx = (tracedState >= (1 << (qubitCount - 1 - keepQubit)))
            ? (tracedState + 1) << (qubitCount - 1 - keepQubit)
            : tracedState;
          const fullIdx = idx | (i << (qubitCount - 1 - keepQubit));
          const fullIdx2 = idx | (j << (qubitCount - 1 - keepQubit));
          sum = cadd(sum, density[fullIdx][fullIdx2]);
        }
        reduced[i][j] = sum;
      }
    }
  }

  return reduced;
};

/** Расчет вектора Блоха из матрицы плотности */
const blochVectorFromDensity = (rho: Complex[][]): BlochVector => {
  // σx = [[0, 1], [1, 0]]
  const sigmaX: Complex[][] = [[[0, 0], [1, 0]], [[1, 0], [0, 0]]];
  // σy = [[0, -i], [i, 0]]
  const sigmaY: Complex[][] = [[[0, 0], [0, -1]], [[0, 1], [0, 0]]];
  // σz = [[1, 0], [0, -1]]
  const sigmaZ: Complex[][] = [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]];

  // Tr(ρσ) = Σᵢⱼ ρᵢⱼ σⱼᵢ
  const trace = (a: Complex[][], b: Complex[][]): number => {
    let sum = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const prod = cmult(a[i][j], b[j][i]);
        sum += prod[0]; // Берем действительную часть
      }
    }
    return sum;
  };

  const x = trace(rho, sigmaX);
  const y = trace(rho, sigmaY);
  const z = trace(rho, sigmaZ);

  const magnitude = Math.sqrt(x * x + y * y + z * z);

  return {
    x: Math.round(x * 1000) / 1000,
    y: Math.round(y * 1000) / 1000,
    z: Math.round(z * 1000) / 1000,
    magnitude: Math.round(magnitude * 1000) / 1000,
    isEntangled: magnitude < 0.99,
  };
};

/** Симуляция квантовой схемы */
export const simulateCircuit = (circuit: Circuit): SimulationResult => {
  const qubitCount = circuit.qubitCount;
  const dim = 1 << qubitCount;

  // Инициализация |00...0⟩
  let statevector: Complex[] = Array(dim).fill(null).map(() => [0, 0]);
  statevector[0] = [1, 0];

  // Применение гейтов
  for (const gate of circuit.gates) {
    let operator: Complex[][];

    switch (gate.type) {
      case 'x':
      case 'y':
      case 'z':
      case 'h':
      case 's':
      case 't': {
        const qubit = (gate as { qubit: number }).qubit;
        operator = buildFullOperator(GATES[gate.type], qubitCount, qubit);
        break;
      }

      case 'rx': {
        const { qubit, angle } = gate as { qubit: number; angle: number };
        operator = buildFullOperator(rxMatrix(angle), qubitCount, qubit);
        break;
      }

      case 'ry': {
        const { qubit, angle } = gate as { qubit: number; angle: number };
        operator = buildFullOperator(ryMatrix(angle), qubitCount, qubit);
        break;
      }

      case 'rz': {
        const { qubit, angle } = gate as { qubit: number; angle: number };
        operator = buildFullOperator(rzMatrix(angle), qubitCount, qubit);
        break;
      }

      case 'cnot': {
        const { control, target } = gate as { control: number; target: number };
        operator = buildCNOTOperator(qubitCount, control, target);
        break;
      }

      case 'cz': {
        const { control, target } = gate as { control: number; target: number };
        operator = buildCZOperator(qubitCount, control, target);
        break;
      }

      case 'swap': {
        const { control: q1, target: q2 } = gate as { control: number; target: number };
        operator = buildSWAPOperator(qubitCount, q1, q2);
        break;
      }

      case 'measure':
        // Пропускаем измерения в симуляции
        continue;

      default:
        console.warn(`Unknown gate type: ${(gate as { type: string }).type}`);
        continue;
    }

    statevector = applyMatrix(operator, statevector);
  }

  // Вероятности
  const probabilities = statevector.map(cabs2);

  // Векторы Блоха для каждого кубита
  const blochVectors: BlochVector[] = [];
  for (let i = 0; i < qubitCount; i++) {
    const rho = partialTrace(statevector, qubitCount, i);
    blochVectors.push(blochVectorFromDensity(rho));
  }

  // Monte Carlo для гистограммы
  const counts: Record<string, number> = {};
  const shots = 1024;
  for (let s = 0; s < shots; s++) {
    const rand = Math.random();
    let cumsum = 0;
    let measured = 0;
    for (let i = 0; i < dim; i++) {
      cumsum += probabilities[i];
      if (rand <= cumsum) {
        measured = i;
        break;
      }
    }
    const key = measured.toString(2).padStart(qubitCount, '0');
    counts[key] = (counts[key] || 0) + 1;
  }

  return {
    statevector,
    probabilities,
    blochVectors,
    counts,
  };
};
