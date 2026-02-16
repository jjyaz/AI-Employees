
-- Enable pgvector for Second Brain semantic search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Memory Vault for Second Brain
CREATE TABLE public.memory_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT, -- url, manual, agent-output, etc.
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding extensions.vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_vault ENABLE ROW LEVEL SECURITY;

-- Public access for now (no auth in this app yet)
CREATE POLICY "Allow all access to memory_vault" ON public.memory_vault FOR ALL USING (true) WITH CHECK (true);

-- Index for vector similarity search
CREATE INDEX idx_memory_vault_embedding ON public.memory_vault USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100);

-- Index for tag filtering
CREATE INDEX idx_memory_vault_tags ON public.memory_vault USING GIN (tags);

-- Use Case Run History
CREATE TABLE public.use_case_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  use_case_id TEXT NOT NULL, -- 'morning-brief', 'reddit-digest', etc.
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, complete, error
  assigned_agents TEXT[] DEFAULT '{}',
  output TEXT,
  output_metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.use_case_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to use_case_runs" ON public.use_case_runs FOR ALL USING (true) WITH CHECK (true);

-- Use Case Schedules
CREATE TABLE public.use_case_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  use_case_id TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  assigned_agents TEXT[] DEFAULT '{}',
  cron_expression TEXT NOT NULL, -- e.g. '0 7 * * *' for daily at 7am
  output_destination TEXT DEFAULT 'tv', -- tv, email, slack, notion
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.use_case_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to use_case_schedules" ON public.use_case_schedules FOR ALL USING (true) WITH CHECK (true);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION public.search_memory_vault(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  source_url TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mv.id,
    mv.content,
    mv.source,
    mv.source_url,
    mv.tags,
    mv.metadata,
    1 - (mv.embedding <=> query_embedding) AS similarity,
    mv.created_at
  FROM public.memory_vault mv
  WHERE 1 - (mv.embedding <=> query_embedding) > match_threshold
  ORDER BY mv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable realtime for run tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.use_case_runs;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_memory_vault_updated_at
  BEFORE UPDATE ON public.memory_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.use_case_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
