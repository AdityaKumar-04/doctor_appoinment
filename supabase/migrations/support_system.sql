-- ============================================================
-- Support System Tables
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jcyhckdwdlsifbmhspuq/sql
-- ============================================================

-- support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'clinic', 'admin')),
  type         TEXT NOT NULL CHECK (type IN ('complaint', 'help')),
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ticket_messages table (chat thread per ticket)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor', 'clinic', 'admin')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket_updated ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status  ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_type    ON public.support_tickets(type);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket  ON public.ticket_messages(ticket_id);

-- Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can CRUD their own tickets
DROP POLICY IF EXISTS "Users can manage own tickets" ON public.support_tickets;
CREATE POLICY "Users can manage own tickets"
  ON public.support_tickets
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS: Service role (admin API) bypasses RLS entirely (already default)

-- RLS: Users can read/write messages for tickets they own
DROP POLICY IF EXISTS "Users can manage messages on own tickets" ON public.ticket_messages;
CREATE POLICY "Users can manage messages on own tickets"
  ON public.ticket_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );
