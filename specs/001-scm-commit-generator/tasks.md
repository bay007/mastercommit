---
description: "Task list for SCM Commit Generator feature"
---

# Tasks: SCM Commit Generator

**Input**: Design documents from `specs/001-scm-commit-generator/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: None — not requested per constitution.

**Organization**: Tasks grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

## Path Conventions

Single VS Code extension project — all source under `src/` at repository root.

---

## Phase 1: Setup

**Purpose**: Wire VS Code contribution points before any domain code is written.
The `package.json` contract must exist first because it defines commands that all
domain modules register against.

- [ ] T001 Update `package.json`: add `contributes.commands` (4 commands: `mastercommit.generateCommit`, `mastercommit.setApiKey`, `mastercommit.setBaseUrl`, `mastercommit.setModel`), `contributes.menus.scm/title` (star button with `enablement: "mastercommit.hasStagedFiles"` and `when: "scmProvider == git"`), `contributes.configuration` schema (baseUrl, model), and `activationEvents` (4 `onCommand:` entries) — per `contracts/vscode-contributions.md`
- [ ] T002 [P] Create domain folder structure under `src/`: `src/commit-generation/`, `src/staged-diff-reader/`, `src/scm-ui/`, `src/secret-storage/`, `src/shared/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that ALL user stories depend on. No story
implementation can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work begins until Phase 2 is complete.

- [ ] T003 [P] Create `src/shared/errors.ts` — define `AppError` base class and subtypes: `MissingConfigError` (holds `string[]` of missing field names), `ApiError` (holds HTTP status + message), `TimeoutError`, `EmptyResponseError`
- [ ] T004 [P] Create `src/shared/config.ts` — export `getConfig()` that reads `mastercommit.baseUrl` and `mastercommit.model` from `vscode.workspace.getConfiguration('mastercommit')`; returns `{ baseUrl: string; model: string }` with empty-string defaults if unset
- [ ] T005 [P] Create `src/secret-storage/api-key-store.ts` — export `storeApiKey(secrets, value)`, `getApiKey(secrets)`, `clearApiKey(secrets)` using `context.secrets.store/get/delete` with key `'mastercommit.apiKey'`
- [ ] T006 [P] Create `src/staged-diff-reader/git-staged-reader.ts` — export `getStagedDiff(repo)` returning `{ diffText: string; stagedFiles: string[] }` using `repo.diff(true)` and `repo.state.indexChanges.map(c => c.uri.fsPath)`; export `hasStagedFiles(repo)` returning `repo.state.indexChanges.length > 0`
- [ ] T007 Update `src/extension.ts` — implement `activate(context)`: get `vscode.git` extension API, get first repository, subscribe to `repo.state.onDidChange` to call `vscode.commands.executeCommand('setContext', 'mastercommit.hasStagedFiles', hasStagedFiles(repo))`, set initial context key value, register all 4 commands as stubs (throw `new Error('not implemented')`) to be replaced in later phases, push all disposables to `context.subscriptions`

**Checkpoint**: Foundation ready — all domain modules can now be implemented.

---

## Phase 3: User Story 1 — Generate Commit Message (Priority: P1) 🎯 MVP

**Goal**: Star button reads staged diff, calls OpenRouter, fills SCM commit input
with a Conventional Commits v1.1 message in English.

**Independent Test**: Stage a file, click the star button (with valid config), verify
the SCM commit input is populated with a CC-format message and status bar clears.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `src/scm-ui/status-bar.ts` — export `createStatusBar()` returning a `vscode.StatusBarItem` initialized with `$(loading~spin) MasterCommit: Generating...` text and `vscode.StatusBarAlignment.Left`; export `showGenerating(bar)` and `hideGenerating(bar)` helper functions
- [ ] T009 [P] [US1] Create `src/commit-generation/prompt-builder.ts` — export `buildMessages(diff: { diffText: string; stagedFiles: string[] })` returning `Array<{role: string; content: string}>` with system message (enforce CC v1.1 English, output message only) and user message (file list + diff text)
- [ ] T010 [US1] Create `src/commit-generation/openrouter-client.ts` — export `generateCommitMessage(baseUrl, model, apiKey, messages)`: POST to `${baseUrl}/chat/completions` with `AbortController` 30s timeout, extract `choices[0].message.content`, validate against CC regex `/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/`, return `{ raw: string; isConforming: boolean }`; throw `TimeoutError` on abort, `ApiError` on non-2xx, `EmptyResponseError` on empty content (depends on T008, T009 types from T003)
- [ ] T011 [US1] Create `src/scm-ui/generate-button.ts` — export `handleGenerateCommit(repo, secrets, statusBar, inputBox)`: read staged diff via `getStagedDiff`, build prompt via `buildMessages`, call `generateCommitMessage`, write `result.raw` to `inputBox.value`, show CC warning notification if `!result.isConforming`; disable status bar show/hide and button re-enable on both success and error paths (depends on T008, T009, T010)
- [ ] T012 [US1] Wire `mastercommit.generateCommit` command in `src/extension.ts`: replace stub with call to `handleGenerateCommit(repo, context.secrets, statusBar, scmInputBox)` where `scmInputBox` is `repo.inputBox`; create status bar via `createStatusBar()` and push to `context.subscriptions` (depends on T011)

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 — Configure AI Provider Settings (Priority: P2)

**Goal**: Three command palette commands let the developer set base URL, model,
and API key. Values persist across VS Code sessions.

**Independent Test**: Run each command, enter a value, re-open VS Code, verify
`settings.json` has baseUrl and model, and API key is retrievable but not in
settings.json.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Wire `mastercommit.setApiKey` command in `src/extension.ts`: replace stub with `vscode.window.showInputBox({ prompt: 'Enter your API key', password: true })` then call `storeApiKey(context.secrets, value)` (depends on T005)
- [ ] T014 [P] [US2] Wire `mastercommit.setBaseUrl` command in `src/extension.ts`: replace stub with `vscode.window.showInputBox({ prompt: 'Enter base URL', value: current baseUrl from config })` then call `vscode.workspace.getConfiguration('mastercommit').update('baseUrl', value, true)` (depends on T004)
- [ ] T015 [P] [US2] Wire `mastercommit.setModel` command in `src/extension.ts`: replace stub with `vscode.window.showInputBox({ prompt: 'Enter model identifier', value: current model from config })` then call `vscode.workspace.getConfiguration('mastercommit').update('model', value, true)` (depends on T004)

**Checkpoint**: User Stories 1 AND 2 independently functional.

---

## Phase 5: User Story 3 — Visible Error on Missing Configuration (Priority: P3)

**Goal**: Clicking the star button with incomplete config shows a visible error
notification naming exactly which values (baseUrl, model, apiKey) are missing.
No silent failures for any error path.

**Independent Test**: Clear one or more config values, click star button, verify
error notification names the missing items specifically.

### Implementation for User Story 3

- [ ] T016 [US3] Add `validateConfig(baseUrl, model, apiKey)` function in `src/scm-ui/generate-button.ts` — collect all missing field names into an array, throw `MissingConfigError(missingFields)` if any are absent (depends on T003, T004, T005)
- [ ] T017 [US3] Add error notification dispatch in `handleGenerateCommit` in `src/scm-ui/generate-button.ts` — catch and map each `AppError` subtype to a `vscode.window.showErrorMessage` call: `MissingConfigError` → `"MasterCommit: Missing configuration: {fields.join(', ')}"`, `TimeoutError` → `"MasterCommit: Request timed out after 30 seconds."`, `ApiError` → `"MasterCommit: Provider error ({status}): {message}"`, `EmptyResponseError` → `"MasterCommit: AI returned an empty response."`; call `validateConfig` at the start of the handler before reading staged diff (depends on T016, T003)

**Checkpoint**: All three user stories independently functional. No error path is silent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Build verification and end-to-end validation.

- [ ] T018 [P] Run `pnpm run package` and verify `dist/extension.js` is produced without type errors or lint warnings; fix any type errors surfaced by strict TypeScript
- [ ] T019 Validate all 7 scenarios in `specs/001-scm-commit-generator/quickstart.md` manually in VS Code Extension Development Host (`F5`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001, T002) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational complete — no dependency on US2 or US3
- **User Story 2 (Phase 4)**: Depends on Foundational complete — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on T010, T011 (generate-button and openrouter-client) from US1
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: After Phase 2 — independent of US1 and US3
- **US3 (P3)**: After T010 + T011 (US1) — validation extends generate-button handler

### Within Each User Story

- T008, T009 parallelizable (different files, no cross-dependency)
- T010 depends on error types from T003
- T011 depends on T008, T009, T010
- T012 depends on T011
- T013, T014, T015 fully parallelizable (different command stubs, different settings keys)
- T016 depends on T003, T004, T005
- T017 depends on T016

---

## Parallel Example: User Story 1

```bash
# Run these tasks in parallel (different files):
T008: Create src/scm-ui/status-bar.ts
T009: Create src/commit-generation/prompt-builder.ts

# Then sequentially:
T010: Create src/commit-generation/openrouter-client.ts
T011: Create src/scm-ui/generate-button.ts   (needs T008, T009, T010)
T012: Wire command in src/extension.ts        (needs T011)
```

## Parallel Example: User Story 2

```bash
# All three can run in parallel (different command stubs, different settings keys):
T013: mastercommit.setApiKey
T014: mastercommit.setBaseUrl
T015: mastercommit.setModel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T007)
3. Complete Phase 3: User Story 1 (T008–T012)
4. **STOP and VALIDATE**: Run quickstart Scenarios 2–4
5. Star button generates Conventional Commits message — MVP shipped

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation
2. Phase 3 (US1) → MVP: Generate commit message ✅
3. Phase 4 (US2) → Config commands ✅
4. Phase 5 (US3) → Precise error messages ✅
5. Phase 6 → Build + full quickstart validation ✅

---

## Notes

- `[P]` tasks = different files, no cross-dependencies — safe to implement concurrently
- `[Story]` label maps each task to its user story for traceability
- No test tasks — constitution explicitly excludes all test types
- All command stubs in T007 are replaced (not modified) in later phases
- Commit after each checkpoint to keep rollback surface small
