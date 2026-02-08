# Code Search Guide

## Search Priority

1. **Known path?** → `Read` tool
2. **Finding files?** → `Glob` tool
3. **Code structure?** → `ast-grep`
4. **Text search?** → `rg` (ripgrep)
5. **Complex?** → `Task` tool

## AST-Grep (Preferred for Code)

**React Components**:
```bash
ast-grep --pattern 'export default function $COMPONENT() { $$$ }' --lang tsx
```

**API Routes**:
```bash
ast-grep --pattern 'export async function $METHOD(req, res) { $$$ }' --lang typescript
```

**Hooks**:
```bash
ast-grep --pattern 'const $VAR = use$HOOK($$$)' --lang typescript
```

**Supabase Queries**:
```bash
ast-grep --pattern 'supabase.from($TABLE).$$$' --lang typescript
```

## Ripgrep (Fallback for Text)

**Text search**:
```bash
rg "createClientComponentClient" --type ts
```

**With context**:
```bash
rg "supabase.auth" --type tsx -C 3
```

**Find imports**:
```bash
rg "^import.*from '@/lib/supabase'" --type typescript
```

## Never Use

❌ Plain `grep` - Always use `rg` or `ast-grep`
