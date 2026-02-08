# Supabase Heartbeat Keep-Alive System

## Overview

Supabase Free tier pauses databases after **7 days of inactivity**. This project uses a GitHub Actions workflow to automatically ping the database every **5 days** to prevent pausing.

## How It Works

### 1. Database Function
- **File**: `supabase/migrations/20260209000000_heartbeat.sql`
- **Function**: `public.heartbeat()`
- **What it does**:
  - Logs a ping in the `heartbeat_log` table
  - Returns JSON with status and last 5 pings
  - Uses `SECURITY DEFINER` to bypass RLS policies

### 2. GitHub Actions Workflow
- **File**: `.github/workflows/supabase-heartbeat.yml`
- **Schedule**: Every 5 days at 12:00 UTC
- **What it does**:
  - Calls `/rest/v1/rpc/heartbeat` endpoint
  - Validates HTTP 200 response
  - Logs success/failure to GitHub Actions

### 3. Cost & Resources
- ✅ **GitHub Actions**: FREE (runs ~15 minutes/month, well within 2,000 free minutes)
- ✅ **Vercel Bandwidth**: NOT USED (GitHub → Supabase direct)
- ✅ **Supabase**: Minimal database writes (~6 rows/month)

---

## Setup Instructions

### Prerequisites
✅ Already completed (migration deployed):
- Database migration applied to remote Supabase
- Function `public.heartbeat()` exists
- Table `heartbeat_log` created

### Required: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add two secrets:

#### Secret 1: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- **Where to find**: Supabase Dashboard → Project Settings → API → Project URL

#### Secret 2: SUPABASE_ANON_KEY
- **Name**: `SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key
- **Where to find**: Supabase Dashboard → Project Settings → API → `anon` `public` key

---

## Testing the Heartbeat

### Manual Test (via GitHub Actions UI)

1. Go to: **Actions** tab in GitHub
2. Click: **"Supabase Heartbeat"** workflow
3. Click: **"Run workflow"** dropdown → **"Run workflow"** button
4. Wait ~10 seconds for completion
5. Check for ✅ green checkmark

### Manual Test (via curl)

```bash
# Replace with your actual values
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"

curl -X POST "$SUPABASE_URL/rest/v1/rpc/heartbeat" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "ok": true,
  "ts": "2026-02-09T12:00:00.000Z",
  "message": "Database is alive",
  "last_5_pings": [
    "2026-02-09T12:00:00.000Z",
    "2026-02-04T12:00:00.000Z",
    ...
  ]
}
```

---

## Monitoring

### Check Recent Heartbeats

Run this SQL in Supabase SQL Editor:

```sql
SELECT
  pinged_at,
  pinged_at AT TIME ZONE 'UTC' as utc_time,
  now() - pinged_at as time_ago
FROM heartbeat_log
ORDER BY pinged_at DESC
LIMIT 10;
```

### View Workflow Run History

1. Go to: **Actions** tab in GitHub
2. Click: **"Supabase Heartbeat"** workflow
3. See all past runs with timestamps and status

---

## Troubleshooting

### Workflow Fails with 401 Unauthorized
**Cause**: GitHub secrets are missing or incorrect

**Fix**:
1. Verify secrets exist: Settings → Secrets and variables → Actions
2. Check values match your Supabase dashboard
3. Re-add secrets if needed

### Workflow Fails with 404 Not Found
**Cause**: Migration not applied or function doesn't exist

**Fix**:
```bash
# Check migration status
supabase migration list --linked

# Re-apply migration if needed
supabase db push
```

### No Recent Heartbeats in Database
**Cause**: Workflow is disabled or not running

**Fix**:
1. Check if workflow file exists: `.github/workflows/supabase-heartbeat.yml`
2. Manually trigger workflow to test
3. Check GitHub Actions are enabled for repo

### GitHub Actions Disabled After 60 Days
**Cause**: GitHub disables workflows after 60 days of no repo activity

**Fix**:
1. Make a commit (even a minor one) every 2 months
2. OR manually re-enable workflow in Actions tab

---

## Architecture Diagram

```
GitHub Actions
   (every 5 days)
        |
        | POST /rest/v1/rpc/heartbeat
        |
        v
   Supabase REST API
        |
        | calls function
        |
        v
   public.heartbeat()
        |
        | inserts row
        |
        v
   heartbeat_log table
        |
        | returns
        |
        v
   JSON response → GitHub Actions logs
```

---

## Security Notes

### Safe to Use Anon Key
✅ **The anon key is safe for public access** because:
- It's designed to be exposed (client-side apps use it)
- Row-level security (RLS) restricts data access
- The heartbeat function uses `SECURITY DEFINER` (no RLS bypass risk)
- Function only logs a timestamp (no sensitive data)

### Secrets Best Practices
- ✅ Secrets are encrypted by GitHub
- ✅ Never exposed in logs or code
- ✅ Only accessible during workflow runs
- ⚠️ Do NOT commit secrets to `.env` or code

---

## FAQ

### Q: Will this use my Vercel bandwidth?
**A**: No. GitHub Actions calls Supabase directly (GitHub → Supabase), bypassing Vercel entirely.

### Q: How much does this cost?
**A**: $0. GitHub Actions is free for public repos and includes 2,000 free minutes/month for private repos. This workflow uses <1 minute per run.

### Q: Can I change the schedule?
**A**: Yes. Edit `.github/workflows/supabase-heartbeat.yml` and change the cron expression:
```yaml
- cron: '0 12 */5 * *'  # Every 5 days
```

To every 3 days:
```yaml
- cron: '0 12 */3 * *'  # Every 3 days
```

### Q: What if I want to disable it?
**A**: Either:
1. Delete `.github/workflows/supabase-heartbeat.yml`
2. Or add `# ` before the `schedule:` line to comment it out

### Q: Does this work on Supabase Pro tier?
**A**: Pro tier doesn't pause, so this is unnecessary. But it won't hurt if you keep it running.

---

## Related Files

- **Migration**: `supabase/migrations/20260209000000_heartbeat.sql`
- **Workflow**: `.github/workflows/supabase-heartbeat.yml`
- **Environment**: `.env.example` (GitHub secrets instructions)

---

## Support

If heartbeat fails consistently:
1. Check migration applied: `supabase migration list --linked`
2. Test function manually with curl (see Testing section)
3. Verify GitHub secrets are set correctly
4. Check workflow runs in Actions tab

For Supabase-specific issues, see [Supabase Status](https://status.supabase.com/).
