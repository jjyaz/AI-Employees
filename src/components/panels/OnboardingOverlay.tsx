import { useState } from 'react';
import { AGENTS, type AgentId } from '@/lib/agents';
import { Copy, Check } from 'lucide-react';

interface OnboardingOverlayProps {
  onSelect: (agentId: AgentId) => void;
}

export function OnboardingOverlay({ onSelect }: OnboardingOverlayProps) {
  const [hoveredAgent, setHoveredAgent] = useState<AgentId | null>(null);
  const [copied, setCopied] = useState(false);

  const contractAddress = '3c6xH5s8kmguofR83irmr5hmpxPZhiS8NYHhb2Sfpump';

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl">
      <a
        href="https://github.com/jjyaz/AI-Employees"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors z-10"
        title="View on GitHub"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </a>
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

        <div className="flex items-center justify-center mt-4 gap-2">
          <span className="text-muted-foreground/60 text-[10px] font-mono tracking-wider">CA:</span>
          <code className="text-muted-foreground/80 text-[10px] font-mono bg-muted/30 px-2 py-1 rounded">
            {contractAddress}
          </code>
          <button
            onClick={handleCopy}
            className="text-muted-foreground/60 hover:text-white transition-colors p-1"
            title="Copy contract address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
