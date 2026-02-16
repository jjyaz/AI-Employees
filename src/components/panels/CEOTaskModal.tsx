import { useState } from 'react';
import { AVAILABLE_MODELS } from '@/lib/agents';
import type { CEOConfig, DepthMode } from '@/lib/ceoSwarm';

interface CEOTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEngage: (config: CEOConfig) => void;
}

const DEPTH_OPTIONS: { value: DepthMode; label: string; desc: string }[] = [
  { value: 'fast', label: 'Fast Strategy', desc: 'Quick parallel sweep — minimal review' },
  { value: 'balanced', label: 'Balanced', desc: 'Full 4-phase orchestration' },
  { value: 'deep', label: 'Deep Executive', desc: 'Maximum depth — extended review cycles' },
];

export function CEOTaskModal({ isOpen, onClose, onEngage }: CEOTaskModalProps) {
  const [directive, setDirective] = useState('');
  const [depth, setDepth] = useState<DepthMode>('balanced');
  const [model, setModel] = useState(AVAILABLE_MODELS[0].id);
  const [tokenCap, setTokenCap] = useState(8192);
  const [toolCallLimit, setToolCallLimit] = useState(20);
  const [integrations, setIntegrations] = useState({ github: false, slack: false, docs: false });

  if (!isOpen) return null;

  const handleEngage = () => {
    if (!directive.trim()) return;
    onEngage({ directive: directive.trim(), depth, model, tokenCap, toolCallLimit, integrations });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="ceo-modal relative z-10 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-ceo-gold/20">
          <div className="flex items-center gap-3">
            <div className="ceo-icon-ring">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <h2 className="neural-title text-base ceo-title-glow">Executive Directive</h2>
              <p className="text-muted-foreground text-[10px] tracking-wider font-mono mt-0.5">
                FULL SWARM ORCHESTRATION
              </p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Directive Input */}
          <div>
            <label className="ceo-label">Directive</label>
            <textarea
              value={directive}
              onChange={e => setDirective(e.target.value)}
              placeholder="Describe your executive-level task. All four AI employees will collaborate to execute it..."
              rows={4}
              className="ceo-textarea"
            />
          </div>

          {/* Depth Selector */}
          <div>
            <label className="ceo-label">Execution Depth</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {DEPTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDepth(opt.value)}
                  className={`ceo-depth-card ${depth === opt.value ? 'ceo-depth-active' : ''}`}
                >
                  <span className="block text-[10px] font-semibold tracking-wider uppercase">{opt.label}</span>
                  <span className="block text-[8px] text-muted-foreground mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="ceo-label">Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="ceo-select">
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.category}</option>
              ))}
            </select>
          </div>

          {/* Budget Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ceo-label">Token Budget</label>
              <input type="number" value={tokenCap} onChange={e => setTokenCap(+e.target.value)}
                className="ceo-input" min={1024} max={32768} step={1024} />
            </div>
            <div>
              <label className="ceo-label">Tool Call Limit</label>
              <input type="number" value={toolCallLimit} onChange={e => setToolCallLimit(+e.target.value)}
                className="ceo-input" min={1} max={100} />
            </div>
          </div>

          {/* Integration Permissions */}
          <div>
            <label className="ceo-label">Integration Permissions</label>
            <div className="flex gap-3 mt-1.5">
              {(['github', 'slack', 'docs'] as const).map(key => (
                <label key={key} className="ceo-toggle-label">
                  <input
                    type="checkbox"
                    checked={integrations[key]}
                    onChange={() => setIntegrations(p => ({ ...p, [key]: !p[key] }))}
                    className="sr-only"
                  />
                  <div className={`ceo-toggle-chip ${integrations[key] ? 'ceo-toggle-active' : ''}`}>
                    {key === 'github' ? 'GitHub' : key === 'slack' ? 'Slack' : 'Docs'}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handleEngage}
            disabled={!directive.trim()}
            className="ceo-engage-btn"
          >
            <span className="mr-2">⚡</span> Engage Full Swarm
          </button>
        </div>
      </div>
    </div>
  );
}
