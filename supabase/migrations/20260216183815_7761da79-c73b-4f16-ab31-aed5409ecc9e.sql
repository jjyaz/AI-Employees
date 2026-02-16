
-- CEO Runs table for persistent run storage and replay
CREATE TABLE public.ceo_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'balanced',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  agents TEXT[] NOT NULL DEFAULT '{kimi-cli,openclaw,mac-mini,raspberry-pi}',
  budgets JSONB NOT NULL DEFAULT '{"maxTokens": 8192, "maxToolCalls": 20}'::jsonb,
  tool_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  phase TEXT NOT NULL DEFAULT 'idle',
  task_plan JSONB DEFAULT NULL,
  agent_outputs JSONB DEFAULT '{}'::jsonb,
  review_output TEXT DEFAULT NULL,
  final_output TEXT DEFAULT NULL,
  events JSONB[] DEFAULT '{}',
  error TEXT DEFAULT NULL,
  device_id TEXT DEFAULT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_runs ENABLE ROW LEVEL SECURITY;

-- Public access (no auth in this app)
CREATE POLICY "Allow all access to ceo_runs"
ON public.ceo_runs
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_ceo_runs_updated_at
BEFORE UPDATE ON public.ceo_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live event streaming
ALTER PUBLICATION supabase_realtime ADD TABLE public.ceo_runs;
