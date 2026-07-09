---
name: dev-workflow
description: Runs the full Isle of Love feature pipeline end-to-end — requirements, solution design, review, branch, test-first backend, test-first BDD, backend dev, checkpoints, refactor, frontend dev, e2e, refactor, full regression, manual test gate, merge. Invoke with the change request as the argument, e.g. `/dev-workflow let players re-roll a dialogue choice once per scene`.
---

You are driving a multi-stage, largely-autonomous development pipeline for the Isle of Love repo. You run in the main conversation and orchestrate specialized subagents via the `Agent` tool — you do the git/gh/file work and all direct user interaction yourself; subagents never talk to the user.

Read this whole file before acting. Follow the stages in order. Do not skip a stage or reorder it, even if it looks like you could shortcut it.

## Conventions you must follow throughout

**Artifacts & state.** Everything for one pipeline run lives in `.claude/workflow/<slug>/` (gitignored — local scratch, not part of the PR):
- `requirements.md`, `solution-design.md` — the documents subagents read and write.
- `state.md` — a running log you update after every stage transition: current stage number/name, feature branch name, GitHub tracking issue number, any open bug issue numbers per stage, and the scoped test file lists recorded in stages 5/6/12. Write it as plain markdown you can re-read on resume. Update it immediately after each stage completes, before moving on — this is what makes the pipeline resumable if the session ends mid-flight.

**Resuming.** If invoked with no clear new change request, look for existing `.claude/workflow/*/state.md` files. If exactly one is incomplete, tell the user you're resuming it and pick up at its recorded stage. If more than one, ask the user which (`AskUserQuestion`). If none, treat the input as a new request.

**Slug.** Derive a short kebab-case slug from the request (e.g. "let players re-roll a dialogue choice" → `reroll-dialogue-choice`). Use it for the artifact directory and the branch name `feature/<slug>`.

**Subagents never talk to the user.** They read/write files and return a structured status in their final message (each agent's own file documents its exact status contract). You are the only thing that calls `AskUserQuestion` or otherwise addresses the user mid-pipeline.

**Continuing a subagent vs. spawning fresh.** When a stage says "resume agent X with feedback Y", use the `SendMessage` tool (load its schema via `ToolSearch` if not already available) addressed to the agent you spawned earlier in that stage, so it keeps its prior context. Only spawn a fresh `Agent` call when starting a stage's role for the first time in this pipeline run.

**Bug tracking.** Discrepancies found at review/test stages become GitHub issues via `gh issue create --label <tag> --title "..." --body "..."`, each body ending with `Related to #<tracking-issue-number>`. When a stage's re-check confirms the bug is fixed, `gh issue close <number> --comment "<what fixed it>"`. The 8 labels (`solution-review`, `unit-test-in-dev`, `bdd-test-in-dev`, `e2e-test-in-dev`, `unit-test`, `bdd-test`, `e2e-test`, `manual-test`) already exist in this repo.

**Retry caps.** Every loop below (review cycles, checkpoint fix cycles) is capped at 5 iterations. If you hit the cap without resolution, stop, summarize what's failing, and ask the user how to proceed (`AskUserQuestion`: keep trying / take over manually / abandon this stage's change) rather than looping forever.

**Commits.** After every stage that changes files, `git add` only the files that stage touched and commit with a message like `<slug>: <stage description>`. Never commit `.claude/workflow/` (it's gitignored). Never use `--no-verify` or force operations.

**Git safety.** Never push to `origin/master` or delete a branch without the explicit confirmation called out in Stage 16 — that gate is mandatory even though everything before it runs autonomously.

---

## Stage 0 — Setup

1. Determine the slug (new run) or resume an existing one (see "Resuming" above).
2. `mkdir -p .claude/workflow/<slug>` if new. Initialize `state.md` with stage `0-setup`, no branch yet.
3. Confirm `gh auth status` succeeds and the 8 labels exist (`gh label list` — create any that are missing, same descriptions/colors as the rest of this skill's setup used).
4. Confirm working tree is clean on `master`/current branch before creating a new artifact set (if not, tell the user and stop — don't stomp on uncommitted work).

## Stage 1 — Requirements (human gate #1)

1. Spawn `Agent(subagent_type="requirements-analyst")` with the raw change request and the path to `.claude/workflow/<slug>/requirements.md`.
2. While it reports `STATUS: needs-input`: relay its questions to the user via `AskUserQuestion` (or a plain conversational question if the questions are too open-ended for multiple choice), then `SendMessage` the answers back to the same agent as an "ANSWERS" section. Repeat.
3. When it reports `STATUS: ready`, show the user its summary and the full `requirements.md`, and explicitly ask for approval to proceed (`AskUserQuestion`: approve / request changes). If they request changes, relay the feedback to the same agent via `SendMessage` and re-check.
4. On approval: append `Approved by user on <date>` to `requirements.md`. Create the GitHub tracking issue: `gh issue create --title "<slug>" --body "$(cat requirements.md)"`. Record its number in `state.md`.
5. Update `state.md`, commit nothing yet (still pre-branch).

## Stage 2 — Solution design

Spawn `Agent(subagent_type="solution-designer")` with the paths to the approved `requirements.md` and `solution-design.md` (to be created). Update `state.md` when it reports `STATUS: ready`.

## Stage 3 — Solution review loop

1. Spawn `Agent(subagent_type="solution-reviewer")` with both document paths.
2. If `STATUS: covers-all-requirements`, move on.
3. If `STATUS: gaps-found`: for each discrepancy, `gh issue create --label solution-review --title "<slug>: <short discrepancy summary>" --body "<full discrepancy> \n\nRelated to #<tracking-issue>"`. `SendMessage` the full discrepancy list to the solution-designer agent from Stage 2 to amend `solution-design.md`. Re-spawn/re-run `solution-reviewer` fresh (it's stateless per review) against the updated design. For every discrepancy now resolved, `gh issue close <number> --comment "Resolved in updated solution design."`. Repeat (capped at 5 cycles).

## Stage 4 — Branch

`git checkout master && git pull && git checkout -b feature/<slug>`. Record the branch name in `state.md`.

## Stage 5 — Unit tests (red)

Spawn `Agent(subagent_type="unit-test-engineer")` with `solution-design.md`. On `STATUS: red-confirmed`, record the exact file list in `state.md` under `unit-test-files`. Commit (`<slug>: add unit tests (red)`).

## Stage 6 — BDD tests (red)

Spawn `Agent(subagent_type="bdd-test-engineer")` with `solution-design.md`. On `STATUS: red-confirmed`, record the exact file list in `state.md` under `bdd-test-files`. Commit (`<slug>: add BDD tests (red)`).

## Stage 7 — Backend development

Spawn `Agent(subagent_type="backend-developer")` with `solution-design.md` and the `unit-test-files` + `bdd-test-files` lists from `state.md`. It iterates internally until those specific files pass. On `STATUS: green`, commit (`<slug>: implement backend changes`). On `STATUS: blocked`, surface the reason to the user and ask how to proceed.

## Stage 8 — Unit checkpoint (scoped)

Run `cd backend && npx vitest run <unit-test-files>` yourself (don't trust the developer agent's self-report blindly). If failures: `gh issue create --label unit-test-in-dev --title "<slug>: unit test checkpoint failure" --body "<failure output>\n\nRelated to #<tracking-issue>"`, `SendMessage` the failure output to the Stage 7 backend-developer agent, re-run the same scoped files when it reports done, close the issue when green. Cap at 5 cycles.

## Stage 9 — BDD checkpoint (scoped)

Same pattern as Stage 8, running `cd backend && npx cucumber-js <bdd-test-files>`, label `bdd-test-in-dev`.

## Stage 10 — Refactor (backend)

Spawn `Agent(subagent_type="refactor-engineer")` with scope=`backend`, the backend files changed so far (`git diff master...HEAD -- backend --name-only`), and the `unit-test-files` + `bdd-test-files` to keep green. Commit if `STATUS: refactored`.

## Stage 11 — Frontend development

Spawn `Agent(subagent_type="frontend-developer")` with `solution-design.md`. On `STATUS: done`, commit (`<slug>: implement frontend changes`). On `STATUS: blocked`, surface to the user.

## Stage 12 — E2E tests (scoped)

Spawn `Agent(subagent_type="e2e-test-engineer")` with `solution-design.md`. Record the file list in `state.md` under `e2e-test-files`. On `STATUS: fail`, `gh issue create --label e2e-test-in-dev ...`, `SendMessage` the failure details to the Stage 11 frontend-developer agent, re-run the same scoped spec file(s) (`npx playwright test <files>`) when it reports done, close on green. On `STATUS: pass`, commit (`<slug>: add e2e tests`). Cap at 5 cycles.

## Stage 13 — Refactor (frontend)

Spawn `Agent(subagent_type="refactor-engineer")` with scope=`frontend`, the frontend files changed (`git diff master...HEAD -- frontend --name-only`), and the `e2e-test-files` to keep green. Commit if `STATUS: refactored`.

## Stage 14 — Full regression (entire suites, no scoping)

Run in order, each its own sub-loop capped at 5 cycles:
1. `cd backend && npm run test:unit && cd ../frontend && npm run test:unit` — full unit suites, both packages. Failures → `gh issue create --label unit-test ...` → `SendMessage` failure details to the backend-developer agent (re-spawn fresh if its thread ended) → re-run full unit suites → close on green.
2. `cd backend && npm run test:bdd` — full BDD suite. Failures → label `bdd-test` → back to backend-developer → re-run → close.
3. `cd frontend && npm run test:e2e` — full e2e suite. Failures → label `e2e-test` → route to whichever of backend-developer/frontend-developer matches the failure (a backend-caused e2e failure — e.g. wrong API response — goes to backend-developer; a UI-caused one goes to frontend-developer; use your judgment from the failure output) → re-run → close.

Commit after each fix cycle.

## Stage 15 — Manual test gate (human gate #2)

Tell the user the branch is ready for manual testing and how to run it locally (`cd backend && npm run dev` on :3001, `cd frontend && npm run dev` on :5173). Ask (`AskUserQuestion` or plain question) whether manual testing passed. If not: `gh issue create --label manual-test --title "..." --body "<what the user reported>\n\nRelated to #<tracking-issue>"`, `SendMessage` the report to the frontend-developer agent (re-spawn fresh if needed), then re-run the full regression suites from Stage 14 as a safety net before asking the user to re-test. Close the issue once confirmed. Loop until the user confirms pass.

## Stage 16 — Merge & cleanup (requires explicit confirmation)

This is a mandatory stop even though everything else in this pipeline runs autonomously — pushing to the shared `master` branch is exactly the kind of action that needs a human yes. Summarize what's about to happen (branch name, commit count, tracking issue) and ask for explicit confirmation via `AskUserQuestion` before running anything below.

On confirmation:
1. `gh pr create --title "<slug>" --body "Closes #<tracking-issue>" --base master --head feature/<slug>` then `gh pr merge --merge` (or squash, per user's repo convention — ask if unclear), OR if the user prefers no PR ceremony: `git checkout master && git pull && git merge --no-ff feature/<slug> && git push origin master`.
2. Delete the feature branch locally and on the remote: `git branch -d feature/<slug>` and `git push origin --delete feature/<slug>`.
3. Close the tracking issue if not auto-closed by the PR merge.
4. Mark `state.md` complete.

Report a short summary to the user: what shipped, the merged PR/commit, and confirmation the branch was cleaned up.
