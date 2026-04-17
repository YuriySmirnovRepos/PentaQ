import { CircuitEditor } from '@features/circuit-editor';
import { GateLibrary } from '@features/gate-library';
import { BlochSphereView } from '@features/visualization/bloch-sphere';
import { Histogram } from '@features/visualization/histogram';
import { ControlPanel } from '@features/control-panel';

export const ComposerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">PentaQ</h1>
          <span className="text-sm text-[var(--text-secondary)]">5-кубитный конструктор</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-65px)]">
        {/* Left Panel - Gate Library */}
        <aside className="w-64 border-r border-[var(--border-color)] p-4">
          <GateLibrary />
        </aside>

        {/* Center - Circuit Editor */}
        <section className="flex-1 p-4">
          <div className="mb-4">
            <ControlPanel />
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <CircuitEditor />
          </div>
        </section>

        {/* Right Panel - Visualization */}
        <aside className="w-80 border-l border-[var(--border-color)] p-4">
          <div className="space-y-4">
            <BlochSphereView />
            <Histogram />
          </div>
        </aside>
      </main>
    </div>
  );
};
