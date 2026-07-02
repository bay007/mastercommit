# Implementation Plan: SCM Commit Generator

**Branch**: `001-scm-commit-generator` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-scm-commit-generator/spec.md`

## Summary

Add a star button to the VS Code Source Control panel that, on click, reads only
the staged diff of the active repository, sends it to an OpenRouter-compatible AI
endpoint, and writes a Conventional Commits v1.1 message (English) back into the
SCM commit input. Configuration (base URL, model, API key) is managed via three
command palette commands. The API key is stored in SecretStorage; base URL and
model are stored in `settings.json`. Button is disabled when no files are staged
or when a request is in flight. All errors are surfaced visibly; no silent failures.

## Technical Context

**Language/Version**: TypeScript 6.0.3 — `strict: true`, `target: ES2022`,
`module: Node16`

**Primary Dependencies**: `@types/vscode ^1.125.0` (already installed, dev-only).
No new production dependencies — native `fetch` (Node 24 global) handles HTTP.

**Storage**:
- `vscode.SecretStorage` (`context.secrets`) — API key
- VS Code `settings.json` (user scope, `workspace.getConfiguration('mastercommit')`) — base URL, model

**Testing**: None — per constitution (no tests required)

**Target Platform**: VS Code ^1.125.0, Node 24.x extension host

**Project Type**: VS Code Extension (esbuild-bundled)

**Performance Goals**:
- Button state reflects staged state within 1 second of git index change
- AI request times out after 30 seconds with visible error

**Constraints**:
- No React, no Webview for core feature
- No new production npm dependencies (YAGNI)
- Screaming Architecture: domain folders at `src/` root
- API key must never appear in `settings.json` or any plaintext store
- Activate lazily on `onCommand:mastercommit.generateCommit`

**Scale/Scope**: Single developer, single active repository at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Screaming Architecture | ✅ Pass | Domain folders: `commit-generation/`, `staged-diff-reader/`, `scm-ui/`, `secret-storage/`, `shared/` |
| II. VS Code SCM Integration (No Webviews) | ✅ Pass | Button in `scm/title` menu; `inputBox.value` for output; no Webview |
| III. Secure Secret Storage | ✅ Pass | API key only in `context.secrets`; base URL and model in `settings.json` (non-sensitive) |
| IV. Conventional Commits Only | ✅ Pass | Prompt enforces CC v1.1 English; non-conforming response triggers warning (FR-016) |
| V. YAGNI | ✅ Pass | No plugin system, no multi-provider strategy, no retry queue, no test suite |

All gates pass. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/001-scm-commit-generator/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── openrouter-api.md
│   └── vscode-contributions.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── commit-generation/
│   ├── prompt-builder.ts      # builds system + user prompt from staged diff
│   └── openrouter-client.ts   # fetch call to OpenRouter, 30s timeout
├── staged-diff-reader/
│   └── git-staged-reader.ts   # VS Code git extension API wrapper
├── scm-ui/
│   ├── generate-button.ts     # context key mgmt, button click handler
│   └── status-bar.ts          # "Generating..." status bar item
├── secret-storage/
│   └── api-key-store.ts       # SecretStorage read/write/clear
├── shared/
│   ├── config.ts              # reads settings.json (baseUrl, model)
│   └── errors.ts              # AppError types
└── extension.ts               # activate / deactivate entry point
```

**Structure Decision**: Single VS Code extension project. Screaming Architecture
applied — all top-level `src/` folders are domain names, not technical roles.
No `utils/` or `helpers/` at the top level. Cross-cutting concerns (`config`,
`errors`) are in `shared/` with explicit justification (referenced by all domains).

## Complexity Tracking

> No constitution violations found — table not required.
