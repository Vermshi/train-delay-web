---
name: no-commits
description: Use when implementing any task in this project - forbids making git commits; the user controls all commits
---

# No Commits

**Do not make git commits.** Ever. Not at the end of a task, not as a verification step, not "just to save progress."

The user commits their own work in this project.

## What to do instead

Make your changes, verify they work (typecheck, build, grep), then stop. Report what you changed — the user will commit when ready.

## This means

- Do not run `git commit`
- Do not run `git add` followed by `git commit`
- Do not include commit steps in any plan or checklist
- Do not suggest committing as a final step

## Common rationalizations to ignore

| Thought | Reality |
|---------|---------|
| "The plan says to commit" | The plan is wrong. Don't commit. |
| "I'll just commit so changes aren't lost" | The user manages their own git history. |
| "A commit makes the work easier to review" | Not your call. Don't commit. |
