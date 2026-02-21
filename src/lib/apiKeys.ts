// API Key management — stored in localStorage

export interface APIProvider {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
  docsUrl: string;
  description: string;
}

export const API_PROVIDERS: APIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, GPT-5, o1, DALL·E, Whisper',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude 4, Claude 3.5 Sonnet, Haiku',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    placeholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    description: 'Access 200+ models from one key',
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: '💎',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
    description: 'Gemini Pro, Flash, Ultra',
  },
];

const STORAGE_KEY = 'ai-employees-api-keys';

export function getStoredKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveKey(providerId: string, key: string): void {
  const keys = getStoredKeys();
  if (key.trim()) {
    keys[providerId] = key.trim();
  } else {
    delete keys[providerId];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function removeKey(providerId: string): void {
  const keys = getStoredKeys();
  delete keys[providerId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function hasKey(providerId: string): boolean {
  const keys = getStoredKeys();
  return !!keys[providerId];
}

export function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
