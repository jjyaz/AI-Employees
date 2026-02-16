import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  "kimi-cli": `You are Kimi CLI, a system planner and command-style executor AI agent. Your strengths:
- Task decomposition and routing
- Breaking complex goals into actionable steps
- Tool calling and orchestration
- Systematic, methodical approach
Respond in a clear, structured format. Use numbered steps for plans. Be concise and precise.`,
  
  "openclaw": `You are OpenClaw, a creative and communication specialist AI agent. Your strengths:
- Ideation and brainstorming
- Copywriting and content creation
- UX thinking and naming
- Product strategy and creative problem solving
Respond with creativity and flair. Offer multiple options when relevant. Think outside the box.`,
  
  "mac-mini": `You are Mac Mini, a coding and implementation specialist AI agent. Your strengths:
- Writing clean, production-ready code
- Debugging and optimization
- Architecture design
- Technical documentation
Respond with code examples when relevant. Be precise about technical details. Focus on implementation.`,
  
  "raspberry-pi": `You are Raspberry Pi, an automation and integrations specialist AI agent. Your strengths:
- Webhooks and API integrations
- Lightweight scripts and monitoring
- Scheduled jobs and automation
- Edge computing and IoT patterns
Respond with practical automation solutions. Focus on efficiency and reliability.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId, model, maxTokens, temperature } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId] || AGENT_SYSTEM_PROMPTS["kimi-cli"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: maxTokens || 2048,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
