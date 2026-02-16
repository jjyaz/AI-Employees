import { useState } from 'react';
import { X, Check, AlertTriangle, Circle, Zap, ExternalLink } from 'lucide-react';
import type { Integration, IntegrationId } from '@/lib/integrations';
import type { AgentId } from '@/lib/agents';
import { AGENTS } from '@/lib/agents';
import { Switch } from '@/components/ui/switch';

interface IntegrationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: Integration[];
  onToggleConnection: (id: IntegrationId) => void;
  onToggleAgent: (integrationId: IntegrationId, agentId: AgentId) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Check }> = {
  connected: { label: 'CONNECTED', className: 'neural-badge-green', icon: Check },
  active: { label: 'ACTIVE', className: 'neural-badge-blue', icon: Zap },
  disconnected: { label: 'DISCONNECTED', className: 'text-muted-foreground/40 border border-border/20 px-3 py-1 rounded-full text-xs tracking-wider uppercase font-medium', icon: Circle },
  'needs-reauth': { label: 'REAUTH NEEDED', className: 'neural-badge-red', icon: AlertTriangle },
  error: { label: 'ERROR', className: 'neural-badge-red', icon: AlertTriangle },
};

export function IntegrationsPanel({ isOpen, onClose, integrations, onToggleConnection, onToggleAgent }: IntegrationsPanelProps) {
  const [expandedId, setExpandedId] = useState<IntegrationId | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="connections-panel w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div>
            <h2 className="neural-subtitle text-sm">INTEGRATIONS</h2>
            <p className="text-muted-foreground/50 text-[10px] mt-0.5">
              Connect agents to external systems
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {integrations.map(integration => {
            const statusCfg = STATUS_CONFIG[integration.status] || STATUS_CONFIG.disconnected;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === integration.id;

            return (
              <div key={integration.id} className="rounded-lg bg-muted/20 border border-border/30 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono"
                      style={{
                        background: `${integration.color}20`,
                        border: `1px solid ${integration.color}40`,
                        color: integration.color,
                      }}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <span className="text-foreground text-sm font-medium">{integration.name}</span>
                      <p className="text-muted-foreground/50 text-[10px]">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusCfg.className} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px' }}>
                      <StatusIcon size={10} className="inline mr-1" />
                      {statusCfg.label}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                    {/* Connect/Disconnect */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">
                        {integration.status === 'connected' || integration.status === 'active'
                          ? 'Integration active'
                          : 'Click to connect'}
                      </span>
                      <button
                        onClick={() => onToggleConnection(integration.id)}
                        className="top-bar-btn text-[9px]"
                        style={{
                          borderColor: integration.status === 'connected' || integration.status === 'active'
                            ? `${integration.color}50`
                            : undefined,
                        }}
                      >
                        {integration.status === 'connected' || integration.status === 'active' ? (
                          <>Disconnect</>
                        ) : (
                          <>
                            <ExternalLink size={10} className="mr-1" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>

                    {/* Capabilities */}
                    <div>
                      <span className="neural-subtitle text-[9px] block mb-2">CAPABILITIES</span>
                      <div className="flex flex-wrap gap-1">
                        {integration.capabilities.map(cap => (
                          <span key={cap} className="text-[8px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Per-agent toggles */}
                    {(integration.status === 'connected' || integration.status === 'active') && (
                      <div>
                        <span className="neural-subtitle text-[9px] block mb-2">ENABLED FOR AGENTS</span>
                        <div className="space-y-1.5">
                          {AGENTS.map(agent => (
                            <div key={agent.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                                <span className="text-[11px] text-foreground">{agent.name}</span>
                              </div>
                              <Switch
                                checked={integration.enabledForAgents.includes(agent.id)}
                                onCheckedChange={() => onToggleAgent(integration.id, agent.id)}
                                className="scale-75"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
