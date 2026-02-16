import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { useCaseId, config, phase } = await req.json();
    console.log(`Workflow: ${useCaseId}, phase: ${phase}`);

    let result = "";

    switch (useCaseId) {
      case "morning-brief":
        result = await handleMorningBrief(config);
        break;
      case "inbox-declutter":
        result = await handleInboxDeclutter(config);
        break;
      case "reddit-digest":
        result = await handleRedditDigest(config);
        break;
      case "youtube-digest":
        result = await handleYoutubeDigest(config);
        break;
      case "second-brain":
        result = await handleSecondBrain(config);
        break;
      case "n8n-orchestration":
        result = await handleN8nOrchestration(config);
        break;
      default:
        result = "Unknown use case";
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("workflow-runner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleMorningBrief(config: any): Promise<string> {
  const topics = config.topics || ["news", "tech"];
  const results: string[] = [];

  // Use Firecrawl to search for latest news on each topic
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  for (const topic of topics) {
    const query = buildSearchQuery(topic, config.timeWindow);
    
    if (FIRECRAWL_API_KEY) {
      try {
        const resp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 5,
            tbs: config.timeWindow === "today" ? "qdr:d" : config.timeWindow === "yesterday" ? "qdr:d" : "qdr:w",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        const data = await resp.json();
        if (data.data && Array.isArray(data.data)) {
          results.push(`### ${topic.toUpperCase()}\n` + data.data.map((r: any) =>
            `- **${r.title || "Untitled"}**: ${r.description || r.markdown?.slice(0, 200) || "No description"}\n  Source: ${r.url || "unknown"}`
          ).join("\n"));
        }
      } catch (e) {
        console.error(`Firecrawl search error for ${topic}:`, e);
        results.push(`### ${topic.toUpperCase()}\nSearch failed: ${(e as Error).message}`);
      }
    } else {
      // Fallback: use AI gateway for search-augmented response
      results.push(await aiSearch(query));
    }
  }

  return results.join("\n\n");
}

async function handleInboxDeclutter(config: any): Promise<string> {
  if (config.manualContent) {
    return `Email content provided by user:\n\n${config.manualContent}`;
  }
  return "No email content provided. Please paste newsletter content in the configuration or connect an email provider.";
}

async function handleRedditDigest(config: any): Promise<string> {
  const subreddits = (config.subreddits || "technology").split(",").map((s: string) => s.trim());
  const results: string[] = [];
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  for (const sub of subreddits) {
    // Try RSS first
    try {
      const rssUrl = `https://www.reddit.com/r/${sub}/top.json?limit=${config.postCount || 10}&t=${config.timeframe || "day"}`;
      const resp = await fetch(rssUrl, {
        headers: { "User-Agent": "NeuralBedroomLab/1.0" },
      });
      
      if (resp.ok) {
        const data = await resp.json();
        if (data.data?.children) {
          const posts = data.data.children.map((p: any) => p.data);
          results.push(`### r/${sub}\n` + posts.map((p: any) =>
            `- **${p.title}** (↑${p.score}, ${p.num_comments} comments)\n  ${p.selftext?.slice(0, 200) || p.url || ""}`
          ).join("\n"));
          continue;
        }
      }
    } catch (e) {
      console.log(`Reddit JSON failed for r/${sub}, trying Firecrawl`);
    }

    // Fallback: Firecrawl search
    if (FIRECRAWL_API_KEY) {
      try {
        const resp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `site:reddit.com/r/${sub} top posts`,
            limit: parseInt(config.postCount) || 10,
            tbs: config.timeframe === "week" ? "qdr:w" : "qdr:d",
          }),
        });
        const data = await resp.json();
        if (data.data) {
          results.push(`### r/${sub}\n` + data.data.map((r: any) =>
            `- **${r.title || "Untitled"}**: ${r.description || ""}\n  ${r.url || ""}`
          ).join("\n"));
        }
      } catch (e) {
        results.push(`### r/${sub}\nFetch failed: ${(e as Error).message}`);
      }
    } else {
      results.push(await aiSearch(`Reddit r/${sub} top posts today`));
    }
  }

  return results.join("\n\n");
}

async function handleYoutubeDigest(config: any): Promise<string> {
  const channels = (config.channels || "tech news").split(",").map((s: string) => s.trim());
  const results: string[] = [];
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  for (const channel of channels) {
    if (FIRECRAWL_API_KEY) {
      try {
        const resp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `site:youtube.com ${channel} new video`,
            limit: 5,
            tbs: config.since === "24h" ? "qdr:d" : config.since === "30d" ? "qdr:m" : "qdr:w",
          }),
        });
        const data = await resp.json();
        if (data.data) {
          results.push(`### ${channel}\n` + data.data.map((r: any) =>
            `- **${r.title || "Untitled"}**\n  ${r.url || ""}\n  ${r.description || ""}`
          ).join("\n"));
        }
      } catch (e) {
        results.push(`### ${channel}\nFetch failed: ${(e as Error).message}`);
      }
    } else {
      results.push(await aiSearch(`YouTube ${channel} latest videos`));
    }
  }

  return results.join("\n\n");
}

async function handleSecondBrain(config: any): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return "Database not configured";
  }

  if (config.action === "save") {
    // Save to memory vault
    const tags = (config.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/memory_vault`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        content: config.content,
        source: "manual",
        tags,
        metadata: {},
      }),
    });
    
    if (resp.ok) {
      return `Saved to Memory Vault with tags: [${tags.join(", ")}]\n\nContent preview: ${config.content?.slice(0, 200)}...`;
    }
    return `Failed to save: ${await resp.text()}`;
  }

  if (config.action === "search" || config.action === "ask") {
    // Text search (simplified - no embedding for now, use LIKE search)
    const query = config.content || "";
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/memory_vault?content=ilike.*${encodeURIComponent(query)}*&order=created_at.desc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (resp.ok) {
      const memories = await resp.json();
      if (memories.length === 0) {
        return "No matching memories found in the vault.";
      }
      return memories.map((m: any, i: number) =>
        `### Memory ${i + 1} (${new Date(m.created_at).toLocaleDateString()})\nTags: ${(m.tags || []).join(", ")}\nSource: ${m.source || "unknown"}\n\n${m.content}`
      ).join("\n\n---\n\n");
    }
    return `Search failed: ${await resp.text()}`;
  }

  return "Unknown action";
}

async function handleN8nOrchestration(config: any): Promise<string> {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) {
    return "No webhook URL configured. Please provide an n8n webhook URL.";
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: config.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: config.method !== "GET" ? JSON.stringify({
        source: "neural-bedroom-lab",
        description: config.payload || "Automated trigger",
        timestamp: new Date().toISOString(),
      }) : undefined,
    });

    const text = await resp.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }

    return `Webhook response (${resp.status}):\n${typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : parsed}`;
  } catch (e) {
    return `Webhook call failed: ${(e as Error).message}`;
  }
}

function buildSearchQuery(topic: string, timeWindow: string): string {
  const timeLabel = timeWindow === "today" ? "today" : timeWindow === "yesterday" ? "yesterday" : "this week";
  const queries: Record<string, string> = {
    news: `latest world news headlines ${timeLabel}`,
    tech: `latest technology and AI news ${timeLabel}`,
    business: `latest business and finance news ${timeLabel}`,
    science: `latest science discoveries ${timeLabel}`,
    personal: `productivity tips and task management ${timeLabel}`,
  };
  return queries[topic] || `latest ${topic} news ${timeLabel}`;
}

async function aiSearch(query: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return `No search tools available for: ${query}`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a research assistant. Provide factual, up-to-date information based on your knowledge. Structure your response with bullet points." },
          { role: "user", content: query },
        ],
        max_tokens: 1024,
      }),
    });

    if (!resp.ok) return `AI search failed (${resp.status})`;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "No results";
  } catch (e) {
    return `AI search error: ${(e as Error).message}`;
  }
}
