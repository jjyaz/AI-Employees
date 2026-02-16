export type AgentId = 'kimi-cli' | 'openclaw' | 'mac-mini' | 'raspberry-pi';

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  strengths: string[];
  description: string;
  color: string;
  deskIndex: number;
}

export const AGENTS: AgentProfile[] = [
  {
    id: 'kimi-cli',
    name: 'Kimi CLI',
    role: 'Planner',
    strengths: ['Task decomposition', 'Routing', 'Tool calling', 'Orchestration'],
    description: 'System planner & command-style executor. Breaks complex goals into actionable steps.',
    color: '#3b82f6',
    deskIndex: 0,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    role: 'Creative',
    strengths: ['Ideation', 'Copywriting', 'UX thinking', 'Product strategy'],
    description: 'Creative & communication specialist. Generates ideas, names, copy, and product concepts.',
    color: '#ef4444',
    deskIndex: 1,
  },
  {
    id: 'mac-mini',
    name: 'Mac Mini',
    role: 'Coder',
    strengths: ['Clean code', 'Architecture', 'Debugging', 'Documentation'],
    description: 'Coding & implementation specialist. Writes production-ready code and solves technical challenges.',
    color: '#10b981',
    deskIndex: 2,
  },
  {
    id: 'raspberry-pi',
    name: 'Raspberry Pi',
    role: 'Edge Automator',
    strengths: ['Webhooks', 'Automation', 'Monitoring', 'IoT patterns'],
    description: 'Automation & integrations specialist. Builds scripts, monitors, and connects systems.',
    color: '#8b5cf6',
    deskIndex: 3,
  },
];

export type AgentState = 'idle' | 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed';

export interface AgentEvent {
  id: string;
  timestamp: number;
  agentId: AgentId;
  type: 'planning' | 'research' | 'tool_call' | 'generating' | 'reviewing' | 'complete' | 'error';
  label: string;
  detail?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', category: 'Fast', provider: 'lovable' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Balanced', provider: 'lovable' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', category: 'Reasoning', provider: 'lovable' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'Cheap', provider: 'lovable' },
  { id: 'openai/gpt-5', name: 'GPT-5', category: 'Reasoning', provider: 'lovable' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', category: 'Balanced', provider: 'lovable' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', category: 'Cheap', provider: 'lovable' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', category: 'Reasoning', provider: 'lovable' },
];
