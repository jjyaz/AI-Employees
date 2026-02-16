import { useState } from 'react';
import { AVAILABLE_MODELS } from '@/lib/agents';
import { X, Check, AlertCircle } from 'lucide-react';

interface ConnectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionsPanel({ isOpen, onClose }: ConnectionsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="connections-panel w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div>
            <h2 className="neural-subtitle text-sm">CONNECTIONS</h2>
            <p className="text-muted-foreground/50 text-[10px] mt-0.5">
              AI is powered by Lovable Cloud — no API key needed!
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Built-in provider */}
          <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neural-green" />
                <span className="neural-subtitle text-xs">STANDARD AI GATEWAY</span>
              </div>
              <span className="neural-badge-green text-[9px]">CONNECTED</span>
            </div>
            <p className="text-muted-foreground text-[11px] mb-3">
              Pre-configured AI models — works immediately. Includes Gemini & GPT-5 models.
            </p>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_MODELS.map(m => (
                <span key={m.id} className="text-[8px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          {/* Info about custom providers */}
          <div className="p-4 rounded-lg bg-muted/10 border border-border/20">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground/60 text-[11px] leading-relaxed">
                  <strong className="text-muted-foreground">Custom API Keys</strong> — Want to use your own OpenAI, Anthropic, or other provider keys? 
                  This feature is coming in Phase 2. For now, all agents use the built-in Lovable AI models which include 
                  Gemini and GPT-5 families.
                </p>
              </div>
            </div>
          </div>

          {/* Model defaults */}
          <div className="p-4 rounded-lg bg-muted/10 border border-border/20">
            <h3 className="neural-subtitle text-[10px] mb-3">DEFAULT MODEL</h3>
            <p className="text-muted-foreground text-[11px] mb-2">
              Each agent uses the model you select in the Task Console. You can change models per-task.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Fast', 'Balanced', 'Reasoning', 'Cheap'].map(cat => {
                const model = AVAILABLE_MODELS.find(m => m.category === cat);
                return model ? (
                  <div key={cat} className="text-[10px] p-2 rounded bg-muted/20 border border-border/20">
                    <span className="text-muted-foreground/50 block mb-0.5">{cat}</span>
                    <span className="text-foreground">{model.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
