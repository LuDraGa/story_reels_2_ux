# Hydration Error Fix - localStorage on SSR

**Date**: 2025-02-08
**Issue**: React hydration mismatches causing errors in browser console

---

## 🐛 Problem Explained

### What is Hydration?

1. **Server (SSR)**: Next.js renders HTML on server → sends to browser
2. **Client**: React "hydrates" (attaches event listeners to existing HTML)
3. **React checks**: "Does this HTML match what I would render?"
4. **If mismatch**: Hydration error!

### Why Did It Happen?

```typescript
// Server render:
sessionId: generateSessionId() → "abc-123"
Renders: <div><span>abc-123</span></div>

// Client hydration:
sessionId: generateSessionId() → "xyz-789"  // Different!
Expects: <div><span>xyz-789</span></div>

// React: "Wait! abc-123 ≠ xyz-789"
// Error: "Expected server HTML to contain matching <span>"
```

---

## 🔍 Root Causes Found

### Cause 1: `useStudioState` Hook

**File**: `hooks/useStudioState.ts`

**Problem**:
```typescript
function getInitialState(): StudioState {
  const stored = loadStateFromStorage() // null on server

  if (stored) return stored

  return {
    sessionId: generateSessionId(), // ⚠️ Different every time!
    ...
  }
}
```

- Server generates: `"abc-123"`
- Client generates: `"xyz-789"`
- Result: **Hydration mismatch!**

### Cause 2: `TTSModule` Component

**File**: `components/studio/TTSModule.tsx`

**Problem**:
```typescript
useEffect(() => {
  const cached = localStorage.getItem('tts_speakers_cache') // Crashes on server!
  // ... use cached data
}, [])
```

- Server: `localStorage` doesn't exist
- Client: `localStorage` exists, different state
- Result: **Hydration mismatch!**

---

## ✅ Solutions Implemented

### Fix 1: Delay State Initialization

**File**: `hooks/useStudioState.ts`

**Before** (Bad):
```typescript
function getInitialState(): StudioState {
  return {
    sessionId: generateSessionId(), // Runs on server AND client
    ...
  }
}
```

**After** (Good):
```typescript
function getInitialState(): StudioState {
  // Always return SAME state for server and first client render
  return {
    sessionId: '', // Empty - will be populated after mount
    sourceText: '',
    script: '',
    audioUrl: null,
    storagePath: null,
    selectedSpeakerId: null,
    videoUrl: null,
  }
}

export function useStudioState() {
  const [state, setState] = useState<StudioState>(getInitialState)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage AFTER hydration
  useEffect(() => {
    const stored = loadStateFromStorage()

    if (stored) {
      setState(stored) // Restore saved session
    } else if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        sessionId: generateSessionId() // Generate only on client
      }))
    }

    setIsHydrated(true)
  }, []) // Run once on mount

  // Save only AFTER hydration complete
  useEffect(() => {
    if (isHydrated && state.sessionId) {
      saveStateToStorage(state)
    }
  }, [state, isHydrated])

  // ... rest of hook
}
```

**Key Changes**:
1. ✅ Initial state is **consistent** (empty sessionId)
2. ✅ sessionId generated **only on client** in useEffect
3. ✅ localStorage loaded **after** hydration complete
4. ✅ Save blocked until hydration done

---

### Fix 2: Guard localStorage Access

**File**: `components/studio/TTSModule.tsx`

**Before** (Bad):
```typescript
useEffect(() => {
  const cached = localStorage.getItem('tts_speakers_cache') // ❌ Crashes on server
  // ...
}, [])
```

**After** (Good):
```typescript
useEffect(() => {
  async function fetchSpeakers() {
    setIsLoadingSpeakers(true)

    // Check localStorage ONLY on client
    if (!forceRefresh && typeof window !== 'undefined') {
      const cached = localStorage.getItem('tts_speakers_cache') // ✅ Safe
      if (cached) {
        // ... use cache
      }
    }

    // Fetch from API...
  }

  fetchSpeakers()
}, [])
```

**Key Changes**:
1. ✅ Check `typeof window !== 'undefined'` before localStorage
2. ✅ Only read cache **after** component mounted (useEffect)
3. ✅ Same check for `localStorage.setItem()`

---

## 🎯 How It Works Now

### Server-Side Rendering (SSR):
```
1. Server renders: sessionId = ""
2. Server HTML: <div><span></span></div>
3. Sends to browser
```

### Client-Side Hydration:
```
1. React hydrates with: sessionId = ""
2. HTML matches! ✅ No error
3. useEffect runs → loads localStorage → sets sessionId
4. Component re-renders with real data
```

### Flow Diagram:
```
Server:  [Render with empty state] → [Send HTML]
           ↓
Browser: [Receive HTML] → [Hydrate with empty state] ✅ Match!
           ↓
         [useEffect runs] → [Load localStorage] → [Update state]
           ↓
         [Re-render with real data]
```

---

## 🧪 Testing

### Before Fix:
```bash
pnpm dev
# Visit http://localhost:3000
# Console shows:
❌ Error: Hydration failed
❌ Expected server HTML to contain matching <span>
❌ Multiple hydration errors
```

### After Fix:
```bash
pnpm dev
# Visit http://localhost:3000
# Console shows:
✅ No hydration errors
✅ Clean console
✅ App works normally
```

### Verify Fix:
1. Open browser console
2. Check for red errors starting with "Hydration"
3. Should see: **No errors** ✅
4. Audio generation still works
5. localStorage caching still works
6. Session persistence works

---

## 📚 Key Learnings

### Rules to Avoid Hydration Errors:

1. **Never use random values during initial render**
   - ❌ `useState(Math.random())`
   - ❌ `useState(Date.now())`
   - ❌ `useState(crypto.randomUUID())`
   - ✅ Use useEffect to set random values after mount

2. **Never access browser APIs during initial render**
   - ❌ `localStorage.getItem()` in useState initializer
   - ❌ `window.innerWidth` in useState initializer
   - ❌ `document.cookie` in useState initializer
   - ✅ Always check `typeof window !== 'undefined'`
   - ✅ Use useEffect to access browser APIs

3. **Ensure server and client render the same initial HTML**
   - ✅ Initial state should be deterministic
   - ✅ Use useEffect for client-only logic
   - ✅ Load dynamic data after hydration

4. **For localStorage patterns**:
   ```typescript
   // ❌ BAD - Different on server/client
   const [data, setData] = useState(() => {
     return localStorage.getItem('key') || 'default'
   })

   // ✅ GOOD - Same initial value, load in useEffect
   const [data, setData] = useState('default')

   useEffect(() => {
     const stored = localStorage.getItem('key')
     if (stored) setData(stored)
   }, [])
   ```

---

## 🔧 Files Changed

1. **`hooks/useStudioState.ts`**
   - Changed `getInitialState()` to return empty sessionId
   - Added `isHydrated` state
   - Load localStorage in useEffect after mount
   - Block saves until after hydration

2. **`components/studio/TTSModule.tsx`**
   - Added `typeof window !== 'undefined'` check before localStorage
   - Both for reading and writing

---

## ✅ Verification

All changes verified:
- [x] Type check passes
- [x] No hydration errors in console
- [x] Audio generation works
- [x] localStorage caching works
- [x] Session persistence works
- [x] One-off studio functional

**Hydration errors fixed!** 🎉

---

## 💡 Future Prevention

### Code Review Checklist:
- [ ] Does this access localStorage/sessionStorage?
- [ ] Does this generate random values?
- [ ] Does this use Date.now() or timestamps?
- [ ] Does this access window/document?
- [ ] Is `typeof window !== 'undefined'` checked?
- [ ] Is dynamic data loaded in useEffect?

### Testing:
- Always test with **dev server** (`pnpm dev`)
- Check browser console for hydration warnings
- Look for red text starting with "Hydration"
- Production build (`pnpm build`) may hide some warnings

---

**Summary**: Fixed hydration errors by ensuring server and client render identical initial HTML, then loading dynamic data (localStorage, random IDs) only after hydration completes.
