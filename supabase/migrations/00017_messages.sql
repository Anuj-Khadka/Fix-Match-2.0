-- Chat messages between client and provider on an active job
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_job_id_created_at ON public.messages(job_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only the client and provider on the job can read messages
CREATE POLICY "Job participants can read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_id
        AND (jobs.client_id = auth.uid() OR jobs.provider_id = auth.uid())
    )
  );

-- Only the client and provider can send messages while the job is active
CREATE POLICY "Job participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_id
        AND (jobs.client_id = auth.uid() OR jobs.provider_id = auth.uid())
        AND jobs.status IN ('matched', 'en_route', 'arrived', 'in_progress')
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Required for Supabase realtime to evaluate RLS policies against incoming rows
ALTER TABLE public.messages REPLICA IDENTITY FULL;
