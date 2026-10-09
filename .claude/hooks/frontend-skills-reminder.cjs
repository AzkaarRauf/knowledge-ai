#!/usr/bin/env node
// SessionStart hook. Injects a standing reminder to route frontend work through the
// frontend-skills skill. Node (not jq/echo) so it runs identically on Windows and bash.

const out = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext:
      'This monorepo has a `frontend-skills` router skill. When working on the frontend ' +
      '(files under apps/frontend/), invoke `frontend-skills` first and load the frontend-* ' +
      'skills its table matches before writing code. Skip it for backend-only work.',
  },
}
process.stdout.write(JSON.stringify(out))
