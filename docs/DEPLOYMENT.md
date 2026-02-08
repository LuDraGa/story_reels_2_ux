# Deployment

## Vercel Deployment

**Automatic**: Push to `main` triggers deployment

**Manual**:
```bash
npm i -g vercel
vercel          # Preview
vercel --prod   # Production
```

**Build Settings**:
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

## GitHub Actions - Supabase Heartbeat

**Purpose**: Keep Supabase active on free tier (prevent auto-pause)

**Location**: `.github/workflows/supabase-heartbeat.yml`

```yaml
name: Supabase Heartbeat

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  heartbeat:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Required GitHub Secrets**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Set in: GitHub repo → Settings → Secrets and variables → Actions

## Troubleshooting

### Type Errors
```bash
npx tsc --noEmit
pnpm supabase:types  # Regenerate if schema changed
```

### Build Failures
```bash
rm -rf .next
rm -rf node_modules && pnpm install
```

### Supabase Issues
- Check environment variables
- Verify project not paused (heartbeat prevents this)
- Check RLS policies
