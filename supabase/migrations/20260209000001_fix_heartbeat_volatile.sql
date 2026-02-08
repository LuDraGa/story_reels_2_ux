-- Fix heartbeat function to be VOLATILE (allow INSERT)
-- Previous version was STABLE (read-only) which blocked the INSERT

CREATE OR REPLACE FUNCTION public.heartbeat()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypasses RLS, runs as function owner
VOLATILE  -- Explicitly allow data modification (INSERT)
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
