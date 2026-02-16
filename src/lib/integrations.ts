export type IntegrationId = 'github' | 'slack' | 'google-drive' | 'webhook' | 'local-workspace';

export type IntegrationStatus = 'disconnected' | 'connected' | 'needs-reauth' | 'error' | 'active';

export type IntegrationEventType = 'idle' | 'preparing' | 'calling' | 'awaiting' | 'success' | 'failure';

export interface Integration {
  id: IntegrationId;
  name: string;
  icon: string; // emoji or short label
  description: string;
  color: string;
  capabilities: string[];
  status: IntegrationStatus;
  enabledForAgents: string[]; // agent IDs
}

export interface IntegrationEvent {
  id: string;
  timestamp: number;
  integrationId: IntegrationId;
  type: IntegrationEventType;
  label: string;
  detail?: string;
}

export const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '⌥',
    description: 'Create repos, branches, commits, PRs, and comment on issues.',
    color: '#f0f0f0',
    capabilities: ['Create repos', 'Create branches', 'Commit changes', 'Open PRs', 'Comment on issues'],
    status: 'disconnected',
    enabledForAgents: [],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '◈',
    description: 'Send messages, post summaries, and respond to commands.',
    color: '#e01e5a',
    capabilities: ['Send messages', 'Post summaries', 'Slash commands', 'Channel notifications'],
    status: 'disconnected',
    enabledForAgents: [],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: '△',
    description: 'Create, update, and read documents and project knowledge.',
    color: '#4285f4',
    capabilities: ['Create documents', 'Update documents', 'Read knowledge base', 'Share files'],
    status: 'disconnected',
    enabledForAgents: [],
  },
  {
    id: 'webhook',
    name: 'Webhook Bridge',
    icon: '⟁',
    description: 'Send structured POST requests and trigger automations.',
    color: '#f59e0b',
    capabilities: ['POST requests', 'Trigger automations', 'Receive callbacks', 'Custom payloads'],
    status: 'disconnected',
    enabledForAgents: [],
  },
  {
    id: 'local-workspace',
    name: 'Local Workspace',
    icon: '◻',
    description: 'Create, edit, and diff files with user approval.',
    color: '#10b981',
    capabilities: ['Create files', 'Edit files', 'Show diffs', 'Require approval'],
    status: 'connected',
    enabledForAgents: ['kimi-cli', 'openclaw', 'mac-mini', 'raspberry-pi'],
  },
];
