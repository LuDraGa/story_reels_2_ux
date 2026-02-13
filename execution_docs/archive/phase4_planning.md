# Phase 4: Authentication Flow - Planning

**Date**: 2025-02-07
**Status**: Planning
**Goal**: Implement magic link authentication with Supabase

---

## Context

Phase 3 completed one-off studio. Now building authentication so users can save multiple projects and access the dashboard.

---

## Implementation Plan

### 1. Login Page (`app/login/page.tsx`) - 30 min

**Features:**
- Email input field
- "Send Magic Link" button
- Loading state during submission
- Success message after sending
- Error handling

**Flow:**
```
1. User enters email
2. Click "Send Magic Link"
3. Call supabase.auth.signInWithOtp({ email })
4. Show success message: "Check your email for the magic link"
5. User clicks link in email
6. Redirected to callback handler
```

### 2. Auth Callback Handler (`app/auth/callback/route.ts`) - 20 min

**Purpose:** Handle the magic link callback from Supabase

**Flow:**
```
1. Extract code from URL query params
2. Exchange code for session using supabase.auth.exchangeCodeForSession()
3. Redirect to /app (dashboard)
```

### 3. Sign Out Functionality - 15 min

**Files to update:**
- `app/(app)/app/layout.tsx` - Add sign out button
- Create server action for sign out

**Flow:**
```
1. User clicks "Sign Out" button
2. Call supabase.auth.signOut()
3. Redirect to /login or /
```

### 4. Verify Protected Routes - 10 min

**Test:**
- Visit `/app` without login → Redirects to `/login` ✅ (already works from Phase 1)
- Login → Can access `/app` ✅
- Sign out → Redirected back

---

## Design Decisions

### Why Magic Link?
- ✅ No password management
- ✅ More secure (no passwords to steal)
- ✅ Better UX (one-click login)
- ✅ Easier to implement

### Why Not OAuth (Google, GitHub)?
- Phase 4 focuses on foundation
- OAuth can be added in Phase 8+ (polish)
- Magic link is sufficient for MVP

---

## Files to Create/Modify

**New files:**
- `app/auth/callback/route.ts` - Auth callback handler

**Modified files:**
- `app/login/page.tsx` - Replace placeholder with working form
- `app/(app)/app/layout.tsx` - Add sign out button

---

## Testing Plan

1. **Test magic link flow:**
   - Enter email
   - Receive email (check spam)
   - Click link
   - Land on dashboard

2. **Test sign out:**
   - Click sign out
   - Verify redirected to login
   - Try accessing `/app` → Should redirect to login

3. **Test protected routes:**
   - Without login: `/app` → redirects to `/login`
   - With login: `/app` → loads dashboard

---

## Success Criteria

After Phase 4:
- ✅ User can enter email and receive magic link
- ✅ User can click magic link and be logged in
- ✅ User sees dashboard after login
- ✅ User can sign out
- ✅ Protected routes work correctly
- ✅ Auth state persists across reloads

---

## Estimated Duration

**Total**: 1-1.5 hours

- Login page: 30 min
- Callback handler: 20 min
- Sign out: 15 min
- Testing: 15 min

---

## Next Steps After Phase 4

**Phase 5**: Dashboard with Project CRUD
- Create new projects
- List projects
- Delete projects
- Navigate to project workspace

---

**Ready to implement!**
