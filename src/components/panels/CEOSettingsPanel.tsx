import { useState } from 'react';
import { X, Shield, Monitor, Fingerprint } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/agents';
import { Switch } from '@/components/ui/switch';

interface CEOSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CEOSettingsPanel({ isOpen, onClose }: CEOSettingsProps) {
  const [ceoModel, setCeoModel] = useState('google/gemini-3-flash-preview');
  const [workerModelOverride, setWorkerModelOverride] = useState('');
  const [browserAutomation, setBrowserAutomation] = useState(false);
  const [devicePairing, setDevicePairing] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="ceo-modal w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ceo-gold/20">
          <div className="flex items-center gap-2">
            <div className="ceo-icon-ring w-7 h-7">
              <span className="text-sm">⚙</span>
            </div>
            <div>
              <h2 className="neural-subtitle text-xs ceo-title-glow">CEO SETTINGS</h2>
              <p className="text-muted-foreground/40 text-[8px] font-mono mt-0.5">KIMICLAW ORCHESTRATION CONFIG</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* CEO Model */}
          <div>
            <label className="ceo-label">CEO Orchestration Model</label>
            <select value={ceoModel} onChange={e => setCeoModel(e.target.value)} className="ceo-select">
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.category}</option>
              ))}
            </select>
            <p className="text-muted-foreground/40 text-[9px] mt-1">Model used by KimiClaw for orchestration decisions</p>
          </div>

          {/* Worker Model Override */}
          <div>
            <label className="ceo-label">Worker Model Override</label>
            <select value={workerModelOverride} onChange={e => setWorkerModelOverride(e.target.value)} className="ceo-select">
              <option value="">Same as CEO model</option>
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.category}</option>
              ))}
            </select>
            <p className="text-muted-foreground/40 text-[9px] mt-1">Override the model workers use (optional)</p>
          </div>

          {/* Browser Automation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor size={14} className="text-muted-foreground" />
              <div>
                <span className="text-foreground text-xs">Browser Automation</span>
                <p className="text-muted-foreground/40 text-[9px]">screenshot, extractText, runSteps</p>
              </div>
            </div>
            <Switch checked={browserAutomation} onCheckedChange={setBrowserAutomation} className="scale-75" />
          </div>

          {/* Device Pairing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint size={14} className="text-muted-foreground" />
              <div>
                <span className="text-foreground text-xs">Device Pairing Required</span>
                <p className="text-muted-foreground/40 text-[9px]">Block CEO runs from unapproved devices</p>
              </div>
            </div>
            <Switch checked={devicePairing} onCheckedChange={setDevicePairing} className="scale-75" />
          </div>

          {/* Auto-approve */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-muted-foreground" />
              <div>
                <span className="text-foreground text-xs">Auto-Approve External Actions</span>
                <p className="text-muted-foreground/40 text-[9px]">Skip approval for GitHub pushes, webhooks, etc.</p>
              </div>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} className="scale-75" />
          </div>

          {/* Gateway Status */}
          <div className="p-3 rounded-lg bg-muted/15 border border-ceo-gold/15">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="neural-subtitle text-[9px] ceo-title-glow">GATEWAY STATUS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div>
                <span className="text-muted-foreground/50">Type</span>
                <span className="block text-foreground">Built-in (Cloud)</span>
              </div>
              <div>
                <span className="text-muted-foreground/50">Endpoint</span>
                <span className="block text-foreground truncate">/ceo-orchestrator</span>
              </div>
              <div>
                <span className="text-muted-foreground/50">Auth</span>
                <span className="block text-accent">Active</span>
              </div>
              <div>
                <span className="text-muted-foreground/50">Pairing</span>
                <span className="block text-foreground">{devicePairing ? 'Required' : 'Off'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
