-- Heartbeat function and log table for GitHub Actions keep-alive
-- This prevents Supabase Free tier from pausing after 7 days of inactivity

-- Create heartbeat log table to track pings
CREATE TABLE IF NOT EXISTS public.heartbeat_log (
  id BIGSERIAL PRIMARY KEY,
  pinged_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add index for faster queries on recent pings
CREATE INDEX IF NOT EXISTS idx_heartbeat_log_pinged_at
  ON public.heartbeat_log (pinged_at DESC);

-- Create heartbeat function that logs and returns status
CREATE OR REPLACE FUNCTION public.heartbeat()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS, runs as function owner
STABLE
AS $$
BEGIN
  -- Log this heartbeat
  INSERT INTO public.heartbeat_log (pinged_at) VALUES (now());

  -- Return status with last 5 pings
  RETURN json_build_object(
    'ok', true,
    'ts', now(),
    'message', 'Database is alive',
    'last_5_pings', (
      SELECT json_agg(pinged_at ORDER BY pinged_at DESC)
      FROM (
        SELECT pinged_at FROM public.heartbeat_log
        ORDER BY pinged_at DESC
        LIMIT 5
      ) recent
    )
  );
END;
$$;

-- Grant execute permission to anon role (used by GitHub Actions)
GRANT EXECUTE ON FUNCTION public.heartbeat() TO anon;

-- Optional: Add comment for documentation
COMMENT ON FUNCTION public.heartbeat() IS
  'Keep-alive function called by GitHub Actions every 5 days to prevent database pausing';

COMMENT ON TABLE public.heartbeat_log IS
  'Logs heartbeat pings from GitHub Actions for monitoring';
