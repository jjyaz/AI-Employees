import type { AgentId, AgentEvent } from './agents';
import { streamAgentChat } from './agentStream';
import type { UseCaseId, UseCaseConfig, WorkflowPhase, WorkflowRun } from './useCases';
import { USE_CASES } from './useCases';
import { supabase } from '@/integrations/supabase/client';

type StateCallback = (run: WorkflowRun) => void;
type EventCallback = (event: AgentEvent) => void;
type BeamCallback = (state: 'idle' | 'collaboration' | 'processing' | 'success') => void;
type StreamCallback = (agentId: AgentId, content: string, done: boolean) => void;

const WORKFLOW_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workflow-runner`;

export class WorkflowEngine {
  private abortController: AbortController | null = null;
  private onState: StateCallback;
  private onEvent: EventCallback;
  private onBeam: BeamCallback;
  private onStream: StreamCallback;

  constructor(onState: StateCallback, onEvent: EventCallback, onBeam: BeamCallback, onStream: StreamCallback) {
    this.onState = onState;
    this.onEvent = onEvent;
    this.onBeam = onBeam;
    this.onStream = onStream;
  }

  abort() {
    this.abortController?.abort();
  }

  private makeEvent(agentId: AgentId, type: AgentEvent['type'], label: string, detail?: string): AgentEvent {
    return { id: crypto.randomUUID(), timestamp: Date.now(), agentId, type, label, detail };
  }

  async run(useCaseId: UseCaseId, config: UseCaseConfig, agents: AgentId[]): Promise<void> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const useCase = USE_CASES.find(u => u.id === useCaseId)!;

    const run: WorkflowRun = {
      id: crypto.randomUUID(),
      useCaseId,
      config,
      assignedAgents: agents,
      status: 'running',
      currentPhase: 'research',
      phaseIndex: 0,
      output: '',
      startedAt: Date.now(),
    };

    this.onState(run);
    this.onBeam('collaboration');

    // Insert run record
    await supabase.from('use_case_runs').insert({
      id: run.id,
      use_case_id: useCaseId,
      config,
      assigned_agents: agents,
      status: 'running',
      started_at: new Date().toISOString(),
    } as any);

    try {
      // Determine orchestrator and workers
      const orchestrator = agents.includes('kimi-cli') ? 'kimi-cli' : agents[0];
      const workers = agents.filter(a => a !== orchestrator);

      // Phase 1: Research / Data Gathering
      run.currentPhase = 'research';
      run.phaseIndex = 0;
      this.onState({ ...run });
      this.onEvent(this.makeEvent(orchestrator, 'planning', `${useCase.phases[0]}...`));

      // Call the workflow-runner edge function for data gathering
      const researchData = await this.callWorkflowRunner(useCaseId, config, 'research', signal);
      if (signal.aborted) return;

      this.onEvent(this.makeEvent(orchestrator, 'complete', `${useCase.phases[0]} complete`));

      // Phase 2: Draft / Analysis (use AI agent)
      run.currentPhase = 'draft';
      run.phaseIndex = 1;
      this.onState({ ...run });
      this.onBeam('processing');

      const draftAgent = workers.includes('openclaw') ? 'openclaw' : orchestrator;
      this.onEvent(this.makeEvent(draftAgent, 'generating', `${useCase.phases[1]}...`));

      const draftPrompt = this.buildDraftPrompt(useCaseId, config, researchData);
      let draftContent = '';
      
      draftContent = await this.streamAgent(draftAgent, draftPrompt, signal, (chunk) => {
        draftContent += chunk;
        this.onStream(draftAgent, draftContent, false);
      });
      if (signal.aborted) return;

      this.onEvent(this.makeEvent(draftAgent, 'complete', `${useCase.phases[1]} complete`));

      // Phase 3: Refine (orchestrator reviews)
      run.currentPhase = 'refine';
      run.phaseIndex = 2;
      this.onState({ ...run });
      this.onBeam('collaboration');
      this.onEvent(this.makeEvent(orchestrator, 'reviewing', `${useCase.phases[2]}...`));

      const refinePrompt = `Review and refine this ${useCase.name} output. Make it more concise, actionable, and well-structured. Add priorities and key takeaways if missing.\n\nDraft:\n${draftContent}`;
      
      let refinedContent = '';
      refinedContent = await this.streamAgent(orchestrator, refinePrompt, signal, (chunk) => {
        refinedContent += chunk;
        this.onStream(orchestrator, refinedContent, false);
      });
      if (signal.aborted) return;

      this.onEvent(this.makeEvent(orchestrator, 'complete', `${useCase.phases[2]} complete`));

      // Phase 4: Deliver
      run.currentPhase = 'deliver';
      run.phaseIndex = 3;
      run.output = refinedContent;
      run.status = 'complete';
      run.completedAt = Date.now();
      this.onState({ ...run });
      this.onStream(orchestrator, refinedContent, true);
      this.onBeam('success');
      this.onEvent(this.makeEvent(orchestrator, 'complete', `${useCase.name} delivered`));

      // Save to Second Brain if configured
      if (config.saveToVault) {
        await supabase.from('memory_vault').insert({
          content: refinedContent,
          source: `workflow:${useCaseId}`,
          tags: [useCaseId, 'auto-saved'],
          metadata: { config, runId: run.id },
        } as any);
      }

      // Update run record
      await supabase.from('use_case_runs').update({
        status: 'complete',
        output: refinedContent,
        completed_at: new Date().toISOString(),
      } as any).eq('id', run.id);

      setTimeout(() => this.onBeam('idle'), 5000);

    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      run.status = 'error';
      run.output = (e as Error).message;
      this.onState({ ...run });
      this.onBeam('idle');
      this.onEvent(this.makeEvent(agents[0], 'error', `Error: ${(e as Error).message}`));
      
      await supabase.from('use_case_runs').update({
        status: 'error',
        output: (e as Error).message,
        completed_at: new Date().toISOString(),
      } as any).eq('id', run.id);
    }
  }

  private async callWorkflowRunner(useCaseId: UseCaseId, config: UseCaseConfig, phase: string, signal: AbortSignal): Promise<string> {
    const resp = await fetch(WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ useCaseId, config, phase }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      throw new Error(err.error || `Workflow runner failed (${resp.status})`);
    }

    const data = await resp.json();
    return data.result || JSON.stringify(data);
  }

  private streamAgent(agentId: AgentId, prompt: string, signal: AbortSignal, onChunk: (chunk: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      let content = '';
      streamAgentChat({
        messages: [{ role: 'user', content: prompt }],
        agentId,
        model: 'google/gemini-3-flash-preview',
        maxTokens: 4096,
        temperature: 0.7,
        onDelta: (chunk) => { content += chunk; onChunk(chunk); },
        onEvent: (ev) => this.onEvent(ev),
        onDone: () => resolve(content),
        onError: (err) => reject(new Error(err)),
        signal,
      });
    });
  }

  private buildDraftPrompt(useCaseId: UseCaseId, config: UseCaseConfig, researchData: string): string {
    switch (useCaseId) {
      case 'morning-brief':
        return `You are creating a Custom Morning Brief. Create a well-structured briefing based on this research data.

Topics requested: ${(config.topics || []).join(', ')}
Time window: ${config.timeWindow || 'today'}
Format: ${config.format || 'short'}

Research data:
${researchData}

Structure your brief as:
## 📰 Headlines
[Top 3-5 headlines with 1-sentence summaries]

## 💡 What Matters
[Key insights and trends]

## ✅ Suggested Actions
[3-5 actionable items]

## 🎯 Top 3 Priorities
[Numbered priorities for the day]`;

      case 'inbox-declutter':
        return `You are creating an Inbox De-clutter Digest. Analyze and organize this email/newsletter content.

Content to analyze:
${config.manualContent || researchData}

Create a digest with:
## 📋 Newsletter Clusters
[Group newsletters by theme]

## 📊 Recommendations
For each newsletter/sender, provide:
- **Keep** ✅ — Worth reading
- **Skim** ⚡ — Quick glance only
- **Unsubscribe** ❌ — Low value

## 🔑 Key Takeaways
[Most important points across all newsletters]`;

      case 'reddit-digest':
        return `You are creating a Daily Reddit Digest. Analyze these subreddit discussions.

Subreddits: ${config.subreddits || 'technology'}
Timeframe: ${config.timeframe || 'day'}

Research data:
${researchData}

Create a curated digest:
## 🔥 Top Posts
[For each post: title, score, key discussion points]

## 💬 Key Comments
[Most insightful comments]

## 🧠 Why It Matters
[Trends and implications]

## 📌 Save-Worthy
[Posts worth bookmarking]`;

      case 'youtube-digest':
        return `You are creating a Daily YouTube Digest. Analyze these videos and channels.

Channels/Topics: ${config.channels || 'general tech'}
Since: ${config.since || '7d'}

Research data:
${researchData}

Create a digest:
## 📺 Video Summaries
For each video:
- **Title & Channel**
- **Watch/Skip Score** (1-10)
- **Key Takeaways** (2-3 bullets)
- **Best Quote**

## 🏆 Must Watch
[Top 3 recommended videos]

## 📊 Weekly Trends
[Patterns across channels]`;

      case 'second-brain':
        if (config.action === 'save') {
          return `Summarize and tag this content for storage in a knowledge vault:\n\n${config.content}\n\nProvide:\n- A concise summary\n- Suggested tags\n- Key concepts\n- Related topics`;
        }
        return `You are a knowledge retrieval assistant. Answer this query using the following memories from the vault:\n\nQuery: ${config.content}\n\nMemories:\n${researchData}\n\nProvide a comprehensive answer with citations to specific memories.`;

      case 'n8n-orchestration':
        return `You are preparing an n8n webhook call. Based on this description, create a structured JSON payload.\n\nDescription: ${config.payload}\nWebhook URL: [MASKED]\nMethod: ${config.method || 'POST'}\n\nResponse data:\n${researchData}\n\nSummarize what happened and the response received.`;

      default:
        return `Process this workflow:\n${researchData}`;
    }
  }
}
