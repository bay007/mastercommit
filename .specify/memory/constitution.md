<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial fill) → 1.0.0
Modified principles: All placeholders replaced (initial constitution)
Added sections: Core Principles (5), Tech Stack, Development Workflow, Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (constitution check gates apply)
  - .specify/templates/spec-template.md ✅ aligned (no structural changes needed)
  - .specify/templates/tasks-template.md ✅ aligned (no new task types required)
Follow-up TODOs: None — all fields resolved from user input.
-->

# MasterCommit VS Code Extension Constitution

## Core Principles

### I. Screaming Architecture

The folder structure MUST communicate domain intent at a glance. Top-level source
directories are named after domain concepts, not technical roles. A reader opening
`src/` MUST immediately see what the extension does — not how it is wired.

- Domain folders: `commit-generation/`, `staged-diff-reader/`, `scm-ui/`, `secret-storage/`
- No generic folders like `utils/`, `helpers/`, `common/` at the top level
- Each domain module owns its own types, services, and entry points
- Cross-cutting concerns (e.g., error handling) go in `shared/` with explicit justification

**Rationale**: Screaming Architecture prevents domain logic from dissolving into
technical layers. It makes onboarding, navigation, and feature isolation faster.

### II. VS Code SCM Integration (No Webviews for Core Feature)

The extension MUST integrate exclusively with the VS Code SCM API for its primary
feature. No React, no custom Webview panels, no additional web frameworks for the
commit generation flow.

- Commit message written via `SourceControl.inputBox.value`
- Trigger exposed as a `commands.registerCommand` bound to a star icon button in
  the SCM title menu (`scm/title` contribution point)
- Diff and staged file list read via `git` extension API or `child_process` — never
  assume full working tree, ONLY staged changes
- Webviews are permitted only if a future feature strictly requires rich UI that
  the SCM API cannot support; must be justified per Governance

**Rationale**: SCM API integration is lighter, faster, and fully native. Adding a
Webview for a single button + text operation would violate YAGNI and increase
surface area for bugs.

### III. Secure Secret Storage (NON-NEGOTIABLE)

The OpenRouter API key MUST be stored in VS Code `SecretStorage`. It MUST NOT
appear in `settings.json`, `package.json`, `.env` files, source code, or any
plaintext store.

- On first use: prompt user to enter key, store via `context.secrets.store()`
- Retrieve via `context.secrets.get()` at call time — never cache in memory
  across sessions
- Provide a command to clear / re-enter the key (`mastercommit.setApiKey`)
- If key absent: show actionable error message, do not silently fail

**Rationale**: API keys in settings are readable by other extensions and leaked in
sync/backups. SecretStorage is OS-keychain-backed and extension-scoped.

### IV. Conventional Commits Output Only

The generated commit message MUST conform to the Conventional Commits 1.0.0
specification. No other format is permitted.

- Language: English only
- Format: `<type>(<optional scope>): <description>` with optional body/footer
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`
- Breaking changes: MUST use `!` suffix and/or `BREAKING CHANGE:` footer
- The model prompt MUST enforce this format; output not matching spec is a bug

**Rationale**: Conventional Commits enables automated changelogs, semantic
versioning, and tooling integration. Free-form messages defeat the extension's
purpose.

### V. YAGNI — Build Only What Is Needed Now

No feature, abstraction, or configuration option is added unless it is required
by a current, defined user story. Speculation about future needs MUST not drive
implementation decisions.

- No plugin systems, no strategy pattern for "future AI providers" unless a second
  provider is actively planned
- No settings beyond what is needed today (API key, model selection if required)
- No retry logic, queues, or caching beyond what the current UX demands
- Complexity MUST be justified in the Complexity Tracking table of plan.md

**Rationale**: VS Code extensions accumulate dead code fast. YAGNI keeps the
extension auditable and the activation footprint small.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm (no npm or yarn scripts)
- **Runtime target**: VS Code Extension Host (Node.js)
- **AI API**: OpenRouter — `POST https://openrouter.ai/api/v1/chat/completions`
  with `Authorization: Bearer <key>` (OpenAI-compatible schema)
- **SCM access**: VS Code `vscode.scm` API + built-in `git` extension API
- **Secret storage**: VS Code `ExtensionContext.secrets` (SecretStorage)
- **No web frameworks**: no React, Vue, Angular, or bundlers for Webview
- **Build**: `vsce` / `esbuild` as needed; keep build config minimal

## Development Workflow

- Each domain folder is independently navigable and independently testable
- MUST not Unit tests or any other kind of test required cush as E2E, smoke, mock, or any other.
- No test is required to pass for features excluded from current scope
- All commands registered in `package.json` contribution points; no dynamic
  command registration unless justified
- API calls to OpenRouter MUST pass only staged diff + file list in context —
  never full working tree or unrelated history
- Extension MUST activate lazily (`onCommand:`) — no `*` activation event

## Governance

This constitution supersedes all other documented practices for this project.
Any amendment requires: (1) updating this file with version bump, (2) updating
the Sync Impact Report comment, (3) reviewing affected templates.

- All plan.md "Constitution Check" gates reference the five principles above
- Complexity violations MUST be logged in plan.md Complexity Tracking table
- YAGNI violations require explicit user approval before implementation
- SecretStorage principle admits no exceptions — any alternative storage is a
  security defect regardless of convenience

**Version**: 1.0.0 | **Ratified**: 2026-07-02 | **Last Amended**: 2026-07-02
