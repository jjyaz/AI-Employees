import type { AgentId, Message, AgentEvent } from './agents';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

interface StreamOptions {
  messages: Message[];
  agentId: AgentId;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  onDelta: (text: string) => void;
  onEvent: (event: AgentEvent) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamAgentChat({
  messages, agentId, model, maxTokens, temperature,
  onDelta, onEvent, onDone, onError, signal,
}: StreamOptions) {
  // Emit planning event
  onEvent({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    agentId,
    type: 'planning',
    label: 'Analyzing request...',
  });

  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, agentId, model, maxTokens, temperature }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      onError(err.error || `Request failed (${resp.status})`);
      return;
    }

    if (!resp.body) {
      onError('No response stream');
      return;
    }

    onEvent({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentId,
      type: 'generating',
      label: 'Generating response...',
    });

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onEvent({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      agentId,
      type: 'complete',
      label: 'Task complete',
    });
    onDone();
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      onEvent({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        agentId,
        type: 'complete',
        label: 'Stopped by user',
      });
      onDone();
      return;
    }
    onError(e instanceof Error ? e.message : 'Unknown error');
  }
}
