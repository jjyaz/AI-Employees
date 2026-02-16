import { useState, useRef, useCallback } from 'react';
import { Send, Square, Loader2 } from 'lucide-react';
import { AGENTS, AVAILABLE_MODELS, type AgentId, type Message, type AgentEvent } from '@/lib/agents';
import { streamAgentChat } from '@/lib/agentStream';

interface TaskConsoleProps {
  primaryAgent: AgentId;
  onAgentEvent: (event: AgentEvent) => void;
  onStreamUpdate: (agentId: AgentId, content: string, done: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskConsole({ primaryAgent, onAgentEvent, onStreamUpdate, isOpen, onClose }: TaskConsoleProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const agent = AGENTS.find(a => a.id === primaryAgent)!;

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isRunning) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = '';

    await streamAgentChat({
      messages: updatedMessages,
      agentId: primaryAgent,
      model: selectedModel,
      onDelta: (chunk) => {
        assistantContent += chunk;
        onStreamUpdate(primaryAgent, assistantContent, false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { role: 'assistant', content: assistantContent }];
        });
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      },
      onEvent: (event) => {
        onAgentEvent(event);
      },
      onDone: () => {
        setIsRunning(false);
        abortRef.current = null;
        onStreamUpdate(primaryAgent, assistantContent, true);
      },
      onError: (error) => {
        setIsRunning(false);
        abortRef.current = null;
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${error}` }]);
        onAgentEvent({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          agentId: primaryAgent,
          type: 'error',
          label: error,
        });
      },
      signal: controller.signal,
    });
  }, [input, isRunning, messages, primaryAgent, selectedModel, onAgentEvent, onStreamUpdate]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-4 bottom-20 z-40 w-[420px] max-h-[70vh] flex flex-col task-console-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
          <span className="neural-subtitle text-xs">{agent.name}</span>
          <span className="text-muted-foreground/40 text-[9px]">TASK CONSOLE</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>

      {/* Model selector */}
      <div className="px-4 py-2 border-b border-border/20">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-muted/30 text-xs text-foreground border border-border/30 rounded px-2 py-1.5 outline-none"
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.category}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div ref={outputRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground/40 text-xs py-8">
            <p className="neural-subtitle text-[10px] mb-1">READY</p>
            <p>Enter a task for {agent.name}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'text-foreground' : 'text-muted-foreground'}`}>
            <span className="text-[9px] uppercase tracking-wider opacity-50 block mb-0.5">
              {msg.role === 'user' ? 'YOU' : agent.name}
            </span>
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        ))}
        {isRunning && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={`Ask ${agent.name}...`}
            disabled={isRunning}
            className="flex-1 bg-muted/20 border border-border/30 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 disabled:opacity-50"
          />
          {isRunning ? (
            <button onClick={handleStop} className="cam-control-btn w-8 h-8 !rounded" title="Stop">
              <Square size={12} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!input.trim()} className="cam-control-btn w-8 h-8 !rounded disabled:opacity-30" title="Send">
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
