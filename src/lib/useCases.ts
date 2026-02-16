import type { AgentId } from './agents';

export type UseCaseId = 'morning-brief' | 'inbox-declutter' | 'reddit-digest' | 'youtube-digest' | 'second-brain' | 'n8n-orchestration';

export type WorkflowPhase = 'idle' | 'research' | 'draft' | 'refine' | 'deliver' | 'complete' | 'error';

export interface UseCaseConfig {
  [key: string]: any;
}

export interface UseCaseDef {
  id: UseCaseId;
  name: string;
  icon: string;
  description: string;
  color: string;
  defaultAgents: AgentId[];
  phases: string[];
  configFields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'toggle';
  options?: { value: string; label: string }[];
  defaultValue?: any;
  placeholder?: string;
}

export interface WorkflowRun {
  id: string;
  useCaseId: UseCaseId;
  config: UseCaseConfig;
  assignedAgents: AgentId[];
  status: 'pending' | 'running' | 'complete' | 'error';
  currentPhase: WorkflowPhase;
  phaseIndex: number;
  output: string;
  startedAt?: number;
  completedAt?: number;
}

export const USE_CASES: UseCaseDef[] = [
  {
    id: 'morning-brief',
    name: 'Custom Morning Brief',
    icon: '☀',
    description: 'AI-generated briefing: headlines, priorities, suggested actions from news, tech, and personal data.',
    color: '#f59e0b',
    defaultAgents: ['kimi-cli', 'openclaw', 'mac-mini', 'raspberry-pi'],
    phases: ['Research', 'Draft', 'Refine', 'Deliver'],
    configFields: [
      {
        key: 'topics', label: 'Topics', type: 'multiselect',
        options: [
          { value: 'news', label: 'World News' },
          { value: 'tech', label: 'Tech & AI' },
          { value: 'business', label: 'Business' },
          { value: 'science', label: 'Science' },
          { value: 'personal', label: 'Personal Tasks' },
        ],
        defaultValue: ['news', 'tech'],
      },
      {
        key: 'timeWindow', label: 'Time Window', type: 'select',
        options: [
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'week', label: 'This Week' },
        ],
        defaultValue: 'today',
      },
      {
        key: 'format', label: 'Format', type: 'select',
        options: [
          { value: 'short', label: 'Short (3-5 min read)' },
          { value: 'long', label: 'Long (10-15 min read)' },
        ],
        defaultValue: 'short',
      },
    ],
  },
  {
    id: 'inbox-declutter',
    name: 'Inbox De-clutter Digest',
    icon: '📧',
    description: 'Summarize and cluster newsletters into themes with Keep/Unsubscribe/Ignore recommendations.',
    color: '#3b82f6',
    defaultAgents: ['kimi-cli', 'openclaw'],
    phases: ['Scan Inbox', 'Cluster Themes', 'Generate Digest', 'Deliver'],
    configFields: [
      {
        key: 'emailProvider', label: 'Email Provider', type: 'select',
        options: [
          { value: 'gmail', label: 'Gmail' },
          { value: 'outlook', label: 'Outlook' },
          { value: 'manual', label: 'Paste Content' },
        ],
        defaultValue: 'manual',
      },
      {
        key: 'digestFormat', label: 'Digest Format', type: 'select',
        options: [
          { value: 'summary', label: 'Summary Only' },
          { value: 'detailed', label: 'Detailed with Quotes' },
        ],
        defaultValue: 'summary',
      },
      {
        key: 'manualContent', label: 'Paste Newsletter Content', type: 'text',
        placeholder: 'Paste email/newsletter content here...',
      },
    ],
  },
  {
    id: 'reddit-digest',
    name: 'Daily Reddit Digest',
    icon: '🔴',
    description: 'Curated digest from selected subreddits: top posts, key comments, and "why it matters".',
    color: '#ef4444',
    defaultAgents: ['kimi-cli', 'openclaw'],
    phases: ['Fetch Posts', 'Analyze', 'Synthesize', 'Deliver'],
    configFields: [
      {
        key: 'subreddits', label: 'Subreddits', type: 'text',
        placeholder: 'e.g. machinelearning, programming, technology',
        defaultValue: 'machinelearning, technology',
      },
      {
        key: 'timeframe', label: 'Timeframe', type: 'select',
        options: [
          { value: 'day', label: 'Last 24 hours' },
          { value: 'week', label: 'Last 7 days' },
        ],
        defaultValue: 'day',
      },
      {
        key: 'postCount', label: 'Max Posts', type: 'select',
        options: [
          { value: '5', label: '5 posts' },
          { value: '10', label: '10 posts' },
          { value: '20', label: '20 posts' },
        ],
        defaultValue: '10',
      },
    ],
  },
  {
    id: 'youtube-digest',
    name: 'Daily YouTube Digest',
    icon: '▶',
    description: 'Summaries per video with watch/skip scores and key takeaways from your channels.',
    color: '#dc2626',
    defaultAgents: ['kimi-cli', 'openclaw', 'mac-mini'],
    phases: ['Fetch Feeds', 'Extract Transcripts', 'Summarize', 'Deliver'],
    configFields: [
      {
        key: 'channels', label: 'YouTube Channels or Topics', type: 'text',
        placeholder: 'e.g. 3Blue1Brown, Fireship, Lex Fridman',
        defaultValue: '',
      },
      {
        key: 'since', label: 'Since', type: 'select',
        options: [
          { value: '24h', label: 'Last 24 hours' },
          { value: '7d', label: 'Last 7 days' },
          { value: '30d', label: 'Last 30 days' },
        ],
        defaultValue: '7d',
      },
    ],
  },
  {
    id: 'second-brain',
    name: 'Second Brain',
    icon: '🧠',
    description: 'Memory Vault with semantic search. Save text, URLs, or agent outputs. Ask your vault anything.',
    color: '#8b5cf6',
    defaultAgents: ['kimi-cli', 'mac-mini'],
    phases: ['Index', 'Search', 'Retrieve', 'Respond'],
    configFields: [
      {
        key: 'action', label: 'Action', type: 'select',
        options: [
          { value: 'save', label: 'Save to Vault' },
          { value: 'search', label: 'Search Vault' },
          { value: 'ask', label: 'Ask My Vault' },
        ],
        defaultValue: 'ask',
      },
      {
        key: 'content', label: 'Content / Query', type: 'text',
        placeholder: 'Paste content to save, or type a search query...',
      },
      {
        key: 'tags', label: 'Tags (comma-separated)', type: 'text',
        placeholder: 'e.g. ai, research, project-x',
      },
    ],
  },
  {
    id: 'n8n-orchestration',
    name: 'n8n Workflow Orchestration',
    icon: '⚡',
    description: 'Trigger real-world automations via n8n webhooks. Agents POST structured payloads and receive responses.',
    color: '#f59e0b',
    defaultAgents: ['raspberry-pi', 'kimi-cli'],
    phases: ['Prepare Payload', 'Call Webhook', 'Process Response', 'Report'],
    configFields: [
      {
        key: 'webhookUrl', label: 'n8n Webhook URL', type: 'text',
        placeholder: 'https://your-n8n.app.n8n.cloud/webhook/...',
      },
      {
        key: 'payload', label: 'Payload Description', type: 'text',
        placeholder: 'Describe what data to send to n8n...',
      },
      {
        key: 'method', label: 'HTTP Method', type: 'select',
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
        ],
        defaultValue: 'POST',
      },
    ],
  },
];

export const AGENT_ROLES: Record<AgentId, string> = {
  'kimi-cli': 'Orchestrator + Planner + Final Synthesis',
  'openclaw': 'Narrative, Summaries, Content Formatting, Tone Control',
  'mac-mini': 'Code Generation, Data Parsing, Building Exports',
  'raspberry-pi': 'Integrations, Webhooks, Scheduling, Connector Reliability',
};
