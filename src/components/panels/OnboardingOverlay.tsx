import { useState } from 'react';
import { AGENTS, type AgentId } from '@/lib/agents';

interface OnboardingOverlayProps {
  onSelect: (agentId: AgentId) => void;
}

export function OnboardingOverlay({ onSelect }: OnboardingOverlayProps) {
  const [hoveredAgent, setHoveredAgent] = useState<AgentId | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl">
      <div className="w-full max-w-4xl px-6">
        <div className="text-center mb-10">
          <h1 className="neural-title text-3xl md:text-4xl mb-3">Choose Your Employee</h1>
          <p className="neural-subtitle text-sm">Select your primary AI agent to begin</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map((agent) => {
            const isHovered = hoveredAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
                className="onboarding-card group text-left"
                style={{
                  borderColor: isHovered ? agent.color + '80' : undefined,
                  boxShadow: isHovered ? `0 0 30px ${agent.color}20, inset 0 0 30px ${agent.color}08` : undefined,
                }}
              >
                {/* Role badge */}
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"
                  style={{
                    background: agent.color + '20',
                    color: agent.color,
                    border: `1px solid ${agent.color}40`,
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  {agent.role}
                </span>

                <h3
                  className="text-lg font-semibold mb-2 transition-colors"
                  style={{ color: isHovered ? agent.color : undefined, fontFamily: 'Orbitron, sans-serif' }}
                >
                  {agent.name}
                </h3>

                <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {agent.strengths.map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground tracking-wider uppercase">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
                />
              </button>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground/40 text-[10px] mt-8 tracking-widest uppercase">
          You can change your primary agent anytime from the top bar
        </p>
      </div>
    </div>
  );
}
