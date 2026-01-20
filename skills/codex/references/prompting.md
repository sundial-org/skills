# Prompting Codex

Effective prompts for `codex exec`.

## Core Principle

**Treat Codex like a teammate with explicit context and a clear definition of "done."**

Codex works best when you provide:
1. **Repro steps and constraints** - These matter MORE than high-level descriptions
2. **Verification steps** - How to validate the work (tests, lint, manual checks)
3. **Clear scope** - What files/areas to focus on, what NOT to touch

## Non-Interactive Specifics

In `codex exec` (unlike interactive mode):
- Cannot use `@` file references or `/mention` commands
- Must specify file paths directly in the prompt text
- Set up your environment before running (venv, daemons, env vars) to avoid wasting tokens on probing

## Prompt Structure

```text
[Task description]

[Repro steps or context - numbered]

Constraints:
- What NOT to change
- Boundaries and limits

Deliverables:
- Expected outputs

Verification:
- How to check the work
```

## Workflow Examples

### Explain/Analyze

```text
Explain how authentication works in this codebase.

Focus on:
- src/auth/ directory
- Entry points and main components
- Data flow between modules

Include:
- A numbered list of the request flow
- Files involved at each step
- Potential gotchas when modifying this
```

### Fix a Bug

```text
Bug: Clicking "Save" shows success but doesn't persist.

Repro:
1. Run: npm run dev
2. Go to /settings
3. Toggle "Enable alerts"
4. Click Save
5. Refresh - toggle resets

Constraints:
- Don't change the API shape
- Keep fix minimal
- Focus on src/settings/ and src/api/settings.ts

Verification:
- Re-run the repro steps after fix
- Run: npm test -- --grep settings
- Run: npm run lint

Report the test results.
```

**Key insight**: Repro steps and constraints matter more than the bug description.

### Write Tests

```text
Add unit tests for the validateEmail function in src/utils/validation.ts.

Cover:
- Valid formats (standard, with subdomain, with +alias)
- Invalid formats (missing @, no domain, double dots)
- Edge cases (unicode, max length, empty string)

Constraints:
- Follow patterns in src/utils/__tests__/
- Use the existing test utilities

Verification:
- Run: npm test -- src/utils/__tests__/validation.test.ts
```

### Implement Feature

```text
Implement rate limiting for the /api/submit endpoint.

Requirements:
- Max 10 requests per minute per IP
- Return 429 with Retry-After header when exceeded
- Use the existing Redis connection in src/lib/redis.ts

Constraints:
- Only modify files in src/api/
- Don't change other endpoints
- Don't add new dependencies

Deliverables:
- Rate limiter middleware
- Updated endpoint
- Unit tests

Verification:
- Run the test suite: npm test
- Run lint: npm run lint
```

### Refactor

```text
Refactor the auth module to improve testability.

Goals:
- Split token parsing from session loading
- Reduce circular imports between src/auth/*.ts

Constraints:
- No user-visible behavior changes
- Keep public APIs stable (AuthService interface unchanged)
- Don't modify src/api/ files

Verification:
- All existing tests pass: npm test
- No new lint errors: npm run lint
```

### From Screenshot

```text
Create a settings page matching this screenshot.

Constraints:
- Use React + Tailwind (existing stack in src/components/)
- Match spacing and typography closely
- Make it responsive (mobile breakpoint at 640px)

Deliverables:
- New component at src/components/SettingsPage.tsx
- Route added to src/routes.tsx

Verification:
- Tell me how to view it locally after implementation
```

### Planning Complex Tasks

If unsure how to break down a task:

```text
I need to migrate the database from MySQL to PostgreSQL.

Before implementing, propose a step-by-step plan with:
- Order of changes
- Risk assessment for each step
- Rollback strategy
```

## Tips

### Be Specific About Files

```text
Focus only on files in src/api/.
Don't modify anything in src/ui/ or tests/.
```

### Request Incremental Work

```text
Make changes in small steps.
After each change, run tests before continuing.
If tests fail, fix before proceeding.
```

### Ask for Explanation First

```text
Before making changes:
1. Explain what you think the problem is
2. Propose your fix approach
3. Then implement and verify
```

### Include Verification Commands

```text
After implementing, run:
- npm run typecheck
- npm run lint
- npm test

Report results for each.
```

## Anti-Patterns

**Too vague:**
```text
Make the code better.
```

**Missing repro steps:**
```text
Fix the save bug.
```
→ Better: Include numbered repro steps

**No constraints:**
```text
Add authentication.
```
→ Better: Specify what auth type, what files to modify, what NOT to change

**No verification:**
```text
Implement the feature.
```
→ Better: Include how to verify (test commands, manual checks)

**High-level only:**
```text
The settings page is broken, please fix it.
```
→ Better: Specific repro steps matter more than description
