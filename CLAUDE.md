# Claude Development Instructions

## CRITICAL: Post-Edit Workflow

After EVERY file edit, update, or code change, you MUST:

1. **Run TypeScript type checking:**
   ```bash
   bunx tsc --noEmit
   ```

2. **Run ESLint:**
   ```bash
   bunx eslint .
   ```

3. **Fix ALL warnings and errors** - Zero tolerance

4. **Restart the dev server:**
   ```bash
   lsof -ti:3001 | xargs kill -9 2>/dev/null; bun run dev
   ```
   (Use Bash tool with `run_in_background: true`)

Never skip these steps. Always complete them before ending your turn.
