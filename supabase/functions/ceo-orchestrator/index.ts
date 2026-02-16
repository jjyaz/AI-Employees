import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-gateway-token, x-device-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const AGENT_ROLES: Record<string, string> = {
  "kimi-cli":
    "You are Kimi CLI, the orchestration planner. Break goals into structured, actionable sub-tasks. Be systematic and precise.",
  "openclaw":
    "You are OpenClaw, the creative specialist. Focus on ideation, naming, copy, UX strategy. Be bold and inventive.",
  "mac-mini":
    "You are Mac Mini, the technical implementer. Write code, design architecture, solve technical problems. Be precise with examples.",
  "raspberry-pi":
    "You are Raspberry Pi, the automation engineer. Build scripts, webhooks, integrations. Focus on reliability and efficiency.",
};

interface CEORunRequest {
  goal: string;
  mode: string;
  agents: string[];
  model: string;
  budgets: { maxTokens: number; maxToolCalls: number; costCap?: number };
  toolPermissions: Record<string, boolean>;
  deviceId?: string;
  gatewayToken?: string;
}

interface CEOEvent {
  type: "phase" | "agent_message" | "tool_call" | "tool_result" | "error" | "final";
  actor: string;
  ts: number;
  severity: "info" | "warn" | "error";
  safeTrace: string;
  payload?: Record<string, unknown>;
}

function makeEvent(
  type: CEOEvent["type"],
  actor: string,
  safeTrace: string,
  payload?: Record<string, unknown>,
  severity: CEOEvent["severity"] = "info"
): CEOEvent {
  return { type, actor, ts: Date.now(), severity, safeTrace, payload };
}

function sseWrite(controller: ReadableStreamDefaultController, event: CEOEvent) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  signal?: AbortSignal
): Promise<string> {
  const resp = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    }),
    signal,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI error [${resp.status}]: ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/ceo-orchestrator/, "");

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // POST /api/ceo/run — Start a new CEO run with SSE streaming
    if (req.method === "POST" && (path === "/run" || path === "/api/ceo/run")) {
      const body: CEORunRequest = await req.json();
      const {
        goal,
        mode = "balanced",
        agents = ["kimi-cli", "openclaw", "mac-mini", "raspberry-pi"],
        model = "google/gemini-3-flash-preview",
        budgets = { maxTokens: 8192, maxToolCalls: 20 },
        toolPermissions = {},
        deviceId,
      } = body;

      if (!goal?.trim()) {
        return new Response(JSON.stringify({ error: "goal is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create run record
      const { data: run, error: insertErr } = await supabase
        .from("ceo_runs")
        .insert({
          goal,
          mode,
          model,
          agents,
          budgets,
          tool_permissions: toolPermissions,
          status: "running",
          phase: "strategic-breakdown",
          device_id: deviceId || null,
        })
        .select()
        .single();

      if (insertErr || !run) {
        return new Response(JSON.stringify({ error: insertErr?.message || "Failed to create run" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const runId = run.id;
      const maxTok = Math.min(budgets.maxTokens || 8192, 16384);
      const perAgentTokens = Math.floor(maxTok / (agents.length + 2)); // +2 for review + consolidation
      const events: CEOEvent[] = [];

      const stream = new ReadableStream({
        async start(controller) {
          const emit = (ev: CEOEvent) => {
            events.push(ev);
            sseWrite(controller, ev);
          };

          try {
            // ─── Phase A: Strategic Breakdown (KimiClaw as CEO) ───
            emit(makeEvent("phase", "KimiClaw", "Phase A: Strategic Breakdown — decomposing directive"));
            await supabase.from("ceo_runs").update({ phase: "strategic-breakdown" }).eq("id", runId);

            const breakdownPrompt = `You are KimiClaw, the CEO orchestrator. Decompose this executive directive into exactly ${agents.length} parallel subtasks, one per team member.

Team members: ${agents.map((a) => `${a} (${AGENT_ROLES[a]?.split(".")[0] || "specialist"})`).join(", ")}

Directive: "${goal}"
Depth mode: ${mode}

Format each subtask as:
**[Agent ID]**: [specific, actionable subtask description]

Be precise and ensure no overlap between subtasks.`;

            const breakdown = await callAI(LOVABLE_API_KEY, model, "You are KimiClaw, the supreme AI orchestrator and CEO of a multi-agent swarm.", breakdownPrompt, perAgentTokens);
            emit(makeEvent("agent_message", "KimiClaw", "Task plan created", { breakdown: breakdown.slice(0, 500) }));

            const taskPlan = agents.map((agentId) => ({
              agentId,
              label: AGENT_ROLES[agentId]?.split(".")[0] || agentId,
              status: "pending",
            }));

            await supabase.from("ceo_runs").update({ task_plan: taskPlan, phase: "parallel-work" }).eq("id", runId);

            // ─── Phase B: Parallel Execution ───
            emit(makeEvent("phase", "KimiClaw", "Phase B: Parallel Execution — dispatching to workers"));
            const agentOutputs: Record<string, string> = {};

            for (const agentId of agents) {
              emit(makeEvent("agent_message", agentId, `${agentId} starting work...`));

              const workPrompt = `Based on the CEO's strategic breakdown, execute YOUR assigned subtask.

CEO Directive: "${goal}"
Strategic Plan:
${breakdown}

You are ${agentId}. Focus ONLY on your assigned subtask. Produce comprehensive, actionable output.`;

              const output = await callAI(
                LOVABLE_API_KEY,
                model,
                AGENT_ROLES[agentId] || "You are a specialist AI agent.",
                workPrompt,
                perAgentTokens
              );

              agentOutputs[agentId] = output;
              emit(makeEvent("agent_message", agentId, `${agentId} completed work`, { outputPreview: output.slice(0, 200) }));
            }

            await supabase.from("ceo_runs").update({ agent_outputs: agentOutputs, phase: "internal-review" }).eq("id", runId);

            // ─── Phase C: Internal Critique Round ───
            emit(makeEvent("phase", "KimiClaw", "Phase C: Internal Review — agents cross-review"));

            const allOutputs = Object.entries(agentOutputs)
              .map(([id, out]) => `### ${id}\n${out}`)
              .join("\n\n---\n\n");

            const reviewPrompt = `As KimiClaw CEO, review all agent outputs for the directive: "${goal}"

${allOutputs}

Identify conflicts, gaps, redundancies, and improvements. Provide a structured review with specific recommendations.`;

            const reviewOutput = await callAI(LOVABLE_API_KEY, model, "You are KimiClaw, reviewing your team's work as CEO.", reviewPrompt, perAgentTokens);
            emit(makeEvent("agent_message", "KimiClaw", "Internal review complete", { reviewPreview: reviewOutput.slice(0, 200) }));

            await supabase.from("ceo_runs").update({ review_output: reviewOutput, phase: "consolidation" }).eq("id", runId);

            // ─── Phase D: Final Consolidation ───
            emit(makeEvent("phase", "KimiClaw", "Phase D: Consolidation — producing executive output"));

            const consolidationPrompt = `Produce the FINAL EXECUTIVE OUTPUT for: "${goal}"

Agent outputs:
${allOutputs}

Review notes:
${reviewOutput}

Format as:
## Executive Summary
[2-3 sentence summary]

## Key Decisions
[Bullet list]

## Deliverables
[Numbered deliverables with details]

## Next Steps
[Recommended follow-up actions]

Be comprehensive but concise. This is the final deliverable for the CEO.`;

            const finalOutput = await callAI(LOVABLE_API_KEY, model, "You are KimiClaw. Produce a polished executive deliverable.", consolidationPrompt, perAgentTokens * 2);

            emit(makeEvent("final", "KimiClaw", "Executive output ready", { finalOutput: finalOutput.slice(0, 500) }));

            await supabase.from("ceo_runs").update({
              final_output: finalOutput,
              phase: "complete",
              status: "complete",
              events: events.map((e) => JSON.stringify(e)),
              completed_at: new Date().toISOString(),
            }).eq("id", runId);

            // Send run ID as final event
            sseWrite(controller, { type: "final", actor: "KimiClaw", ts: Date.now(), severity: "info", safeTrace: "Run complete", payload: { runId, finalOutput } });
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            emit(makeEvent("error", "KimiClaw", `Error: ${msg}`, undefined, "error"));
            await supabase.from("ceo_runs").update({ status: "error", error: msg, phase: "aborted" }).eq("id", runId);
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // GET /runs/:runId — Get run metadata
    if (req.method === "GET" && path.match(/^\/runs\/[^/]+$/)) {
      const runId = path.split("/")[2];
      const { data, error } = await supabase.from("ceo_runs").select("*").eq("id", runId).single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Run not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /runs — List runs
    if (req.method === "GET" && (path === "/runs" || path === "")) {
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const { data, error } = await supabase
        .from("ceo_runs")
        .select("id, goal, mode, status, phase, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ceo-orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
