import { useState, useCallback } from 'react';
import { USE_CASES, AGENT_ROLES, type UseCaseId, type UseCaseConfig } from '@/lib/useCases';
import { AGENTS, type AgentId } from '@/lib/agents';

interface UseCaseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onRunWorkflow: (useCaseId: UseCaseId, config: UseCaseConfig, agents: AgentId[]) => void;
}

export function UseCaseLibrary({ isOpen, onClose, onRunWorkflow }: UseCaseLibraryProps) {
  const [configuring, setConfiguring] = useState<UseCaseId | null>(null);
  const [configs, setConfigs] = useState<Record<string, UseCaseConfig>>({});
  const [assignedAgents, setAssignedAgents] = useState<Record<string, AgentId[]>>({});
  const [activeTab, setActiveTab] = useState<'library' | 'jobs'>('library');

  const getConfig = (id: UseCaseId): UseCaseConfig => {
    if (configs[id]) return configs[id];
    const uc = USE_CASES.find(u => u.id === id)!;
    const defaults: UseCaseConfig = {};
    uc.configFields.forEach(f => { defaults[f.key] = f.defaultValue || ''; });
    return defaults;
  };

  const getAgents = (id: UseCaseId): AgentId[] => {
    return assignedAgents[id] || USE_CASES.find(u => u.id === id)!.defaultAgents;
  };

  const updateConfig = useCallback((id: UseCaseId, key: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [id]: { ...getConfig(id), ...prev[id], [key]: value },
    }));
  }, [configs]);

  const toggleAgent = useCallback((ucId: UseCaseId, agentId: AgentId) => {
    setAssignedAgents(prev => {
      const current = prev[ucId] || USE_CASES.find(u => u.id === ucId)!.defaultAgents;
      const has = current.includes(agentId);
      const next = has ? current.filter(a => a !== agentId) : [...current, agentId];
      return { ...prev, [ucId]: next.length ? next : [agentId] };
    });
  }, []);

  const handleRun = useCallback((id: UseCaseId) => {
    const config = { ...getConfig(id), ...configs[id] };
    const agents = getAgents(id);
    onRunWorkflow(id, config, agents);
    onClose();
  }, [configs, assignedAgents, onRunWorkflow, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative use-case-panel w-[90vw] max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--neural-green) / 0.15)', border: '1px solid hsl(var(--neural-green) / 0.3)' }}>
              <span className="text-sm">📚</span>
            </div>
            <div>
              <h2 className="neural-title text-sm">Use Case Library</h2>
              <p className="neural-subtitle text-[9px] mt-0.5">Turnkey AI Workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`top-bar-btn text-[9px] ${activeTab === 'library' ? 'top-bar-btn-active' : ''}`}
            >Library</button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`top-bar-btn text-[9px] ${activeTab === 'jobs' ? 'top-bar-btn-active' : ''}`}
            >Jobs</button>
            <button onClick={onClose} className="top-bar-btn text-[9px]">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'library' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {USE_CASES.map(uc => (
                <div key={uc.id} className="use-case-card" style={{ '--uc-color': uc.color } as any}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xl">{uc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>{uc.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{uc.description}</p>
                    </div>
                  </div>

                  {/* Phases */}
                  <div className="flex gap-1 mb-3">
                    {uc.phases.map((phase, i) => (
                      <span key={i} className="text-[7px] px-1.5 py-0.5 rounded-full tracking-wider uppercase" style={{
                        fontFamily: 'Orbitron, sans-serif',
                        background: `${uc.color}15`,
                        color: uc.color,
                        border: `1px solid ${uc.color}30`,
                      }}>{phase}</span>
                    ))}
                  </div>

                  {/* Assigned Agents */}
                  <div className="flex gap-1 mb-3">
                    {AGENTS.map(agent => {
                      const active = getAgents(uc.id).includes(agent.id);
                      return (
                        <button key={agent.id} onClick={() => toggleAgent(uc.id, agent.id)}
                          className="text-[7px] px-1.5 py-0.5 rounded-full transition-all cursor-pointer"
                          style={{
                            fontFamily: 'Orbitron, sans-serif',
                            background: active ? `${agent.color}20` : 'hsl(var(--muted) / 0.15)',
                            color: active ? agent.color : 'hsl(var(--muted-foreground))',
                            border: `1px solid ${active ? agent.color + '50' : 'hsl(var(--border) / 0.2)'}`,
                          }}
                        >{agent.name}</button>
                      );
                    })}
                  </div>

                  {/* Configure Panel */}
                  {configuring === uc.id && (
                    <div className="border-t border-border/15 pt-3 mt-2 space-y-2">
                      {uc.configFields.map(field => (
                        <div key={field.key}>
                          <label className="ceo-label">{field.label}</label>
                          {field.type === 'text' && (
                            <input
                              className="ceo-input text-[10px]"
                              placeholder={field.placeholder}
                              value={(configs[uc.id]?.[field.key] ?? field.defaultValue) || ''}
                              onChange={e => updateConfig(uc.id, field.key, e.target.value)}
                            />
                          )}
                          {field.type === 'select' && (
                            <select className="ceo-select text-[10px]"
                              value={(configs[uc.id]?.[field.key] ?? field.defaultValue) || ''}
                              onChange={e => updateConfig(uc.id, field.key, e.target.value)}
                            >
                              {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          )}
                          {field.type === 'multiselect' && (
                            <div className="flex flex-wrap gap-1">
                              {field.options?.map(o => {
                                const selected = ((configs[uc.id]?.[field.key] ?? field.defaultValue) || []).includes(o.value);
                                return (
                                  <button key={o.value}
                                    className="text-[8px] px-2 py-1 rounded-md transition-all cursor-pointer"
                                    style={{
                                      fontFamily: 'Orbitron, sans-serif',
                                      background: selected ? `${uc.color}20` : 'hsl(var(--muted) / 0.15)',
                                      color: selected ? uc.color : 'hsl(var(--muted-foreground))',
                                      border: `1px solid ${selected ? uc.color + '50' : 'hsl(var(--border) / 0.2)'}`,
                                    }}
                                    onClick={() => {
                                      const current = (configs[uc.id]?.[field.key] ?? field.defaultValue) || [];
                                      const next = selected ? current.filter((v: string) => v !== o.value) : [...current, o.value];
                                      updateConfig(uc.id, field.key, next);
                                    }}
                                  >{o.label}</button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setConfiguring(configuring === uc.id ? null : uc.id)}
                      className="top-bar-btn text-[8px] flex-1"
                    >
                      {configuring === uc.id ? '▲ Hide' : '⚙ Configure'}
                    </button>
                    <button
                      onClick={() => handleRun(uc.id)}
                      className="flex-1 py-1.5 rounded-lg text-[8px] tracking-widest uppercase font-semibold cursor-pointer transition-all"
                      style={{
                        fontFamily: 'Orbitron, sans-serif',
                        background: `linear-gradient(135deg, ${uc.color}30, ${uc.color}15)`,
                        border: `1px solid ${uc.color}50`,
                        color: uc.color,
                      }}
                    >▶ Run Now</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <JobsTab />
          )}
        </div>
      </div>
    </div>
  );
}

function JobsTab() {
  // TODO: fetch from use_case_schedules and use_case_runs
  return (
    <div className="text-center py-12">
      <span className="text-2xl mb-3 block">📋</span>
      <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>No scheduled jobs yet</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">Configure a use case and set a schedule to see jobs here</p>
    </div>
  );
}
