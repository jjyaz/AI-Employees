import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/lib/agents';
import { API_PROVIDERS, getStoredKeys, saveKey, removeKey, maskKey } from '@/lib/apiKeys';
import { X, Check, Eye, EyeOff, Trash2, ExternalLink, Key } from 'lucide-react';

interface ConnectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionsPanel({ isOpen, onClose }: ConnectionsPanelProps) {
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [revealedProvider, setRevealedProvider] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setStoredKeys(getStoredKeys());
  }, [isOpen]);

  const handleSave = (providerId: string) => {
    saveKey(providerId, inputValue);
    setStoredKeys(getStoredKeys());
    setEditingProvider(null);
    setInputValue('');
    setSavedFeedback(providerId);
    setTimeout(() => setSavedFeedback(null), 2000);
  };

  const handleRemove = (providerId: string) => {
    removeKey(providerId);
    setStoredKeys(getStoredKeys());
    setRevealedProvider(null);
  };

  const handleStartEdit = (providerId: string) => {
    setEditingProvider(providerId);
    setInputValue('');
    setRevealedProvider(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="connections-panel w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div>
            <h2 className="neural-subtitle text-sm">CONNECTIONS</h2>
            <p className="text-muted-foreground/50 text-[10px] mt-0.5">
              Built-in AI + connect your own provider keys
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

          {/* Custom API Keys Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-muted-foreground/60" />
              <span className="neural-subtitle text-[10px]">CUSTOM API KEYS</span>
            </div>
            <p className="text-muted-foreground/50 text-[10px] mb-3">
              Connect your own provider keys to use additional models. Keys are stored locally in your browser.
            </p>

            <div className="space-y-2">
              {API_PROVIDERS.map(provider => {
                const hasStoredKey = !!storedKeys[provider.id];
                const isEditing = editingProvider === provider.id;
                const isRevealed = revealedProvider === provider.id;
                const justSaved = savedFeedback === provider.id;

                return (
                  <div
                    key={provider.id}
                    className={`p-3 rounded-lg border transition-all ${
                      hasStoredKey
                        ? 'bg-muted/20 border-accent/30'
                        : 'bg-muted/10 border-border/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{provider.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground text-xs font-medium">{provider.name}</span>
                            {hasStoredKey && !justSaved && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-mono">
                                CONNECTED
                              </span>
                            )}
                            {justSaved && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-mono flex items-center gap-0.5">
                                <Check size={8} /> SAVED
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground/50 text-[9px]">{provider.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasStoredKey && !isEditing && (
                          <>
                            <button
                              onClick={() => setRevealedProvider(isRevealed ? null : provider.id)}
                              className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                              title={isRevealed ? 'Hide key' : 'Show key'}
                            >
                              {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => handleRemove(provider.id)}
                              className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                              title="Remove key"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                          title="Get API key"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {/* Show stored key (masked or revealed) */}
                    {hasStoredKey && !isEditing && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-[10px] font-mono text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded flex-1">
                          {isRevealed ? storedKeys[provider.id] : maskKey(storedKeys[provider.id])}
                        </code>
                        <button
                          onClick={() => handleStartEdit(provider.id)}
                          className="text-[9px] text-muted-foreground/50 hover:text-foreground px-2 py-1 rounded border border-border/20 hover:border-border/40 transition-colors"
                        >
                          Update
                        </button>
                      </div>
                    )}

                    {/* Add / Edit key input */}
                    {isEditing ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="password"
                          value={inputValue}
                          onChange={e => setInputValue(e.target.value)}
                          placeholder={provider.placeholder}
                          className="flex-1 text-[11px] font-mono bg-background/50 border border-border/30 rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent/50"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && inputValue.trim()) handleSave(provider.id);
                            if (e.key === 'Escape') { setEditingProvider(null); setInputValue(''); }
                          }}
                        />
                        <button
                          onClick={() => handleSave(provider.id)}
                          disabled={!inputValue.trim()}
                          className="text-[9px] px-2 py-1.5 rounded bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingProvider(null); setInputValue(''); }}
                          className="text-[9px] px-2 py-1.5 rounded text-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : !hasStoredKey ? (
                      <button
                        onClick={() => handleStartEdit(provider.id)}
                        className="mt-2 w-full text-[10px] py-1.5 rounded border border-dashed border-border/30 text-muted-foreground/50 hover:text-foreground hover:border-border/50 transition-colors"
                      >
                        + Add API Key
                      </button>
                    ) : null}
                  </div>
                );
              })}
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

          {/* Security note */}
          <div className="p-3 rounded-lg bg-muted/10 border border-border/15">
            <p className="text-muted-foreground/40 text-[9px] leading-relaxed">
              🔒 API keys are stored in your browser's local storage and never sent to our servers. 
              They are only used for direct API calls from the edge functions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
