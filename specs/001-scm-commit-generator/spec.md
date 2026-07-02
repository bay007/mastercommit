# Feature Specification: SCM Commit Generator

**Feature Branch**: `001-scm-commit-generator`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "El generador consta de un boton en el mismo input de 'source control'..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Commit Message from Staged Changes (Priority: P1)

A developer has staged one or more files and wants a commit message generated
automatically. They click the star button in the SCM input area. The extension
reads only the staged diff, sends it to the configured AI provider, and fills the
SCM commit input with a Conventional Commits v1.1 message in English.

**Why this priority**: Core value proposition of the extension. Without this, the
extension has no purpose.

**Independent Test**: Can be fully tested by staging a file, clicking the button,
and verifying the SCM input is populated with a valid Conventional Commits message.

**Acceptance Scenarios**:

1. **Given** one or more files are staged, **When** the user clicks the star button,
   **Then** the star button is immediately disabled, the VS Code status bar shows
   "Generating...", and the SCM commit input is populated with a Conventional
   Commits v1.1 message in English once the response arrives.

2. **Given** the AI provider returns a response, **When** the response is received,
   **Then** the existing content of the commit input is replaced with the generated
   message.

3. **Given** no files are staged, **When** the user looks at the SCM panel,
   **Then** the star button is disabled and cannot be clicked.

---

### User Story 2 - Configure AI Provider Settings (Priority: P2)

A developer needs to set up or update the extension's AI provider configuration
(base URL, model, and API key) before they can use commit generation. They do
this through the command palette.

**Why this priority**: Required for the extension to function, but done once; lower
priority than generation because it is a prerequisite setup step, not the daily
workflow.

**Independent Test**: Can be tested independently by opening the command palette,
running each configuration command, and verifying the values are saved and
retrievable for subsequent generation attempts.

**Acceptance Scenarios**:

1. **Given** the user opens the command palette, **When** they search for
   "MasterCommit", **Then** they see commands for setting Base URL, Model, and
   API Key.

2. **Given** the user runs the Set API Key command, **When** they enter a value,
   **Then** the key is stored securely and not visible in plain settings.

3. **Given** the user runs the Set Base URL command, **When** they enter or select
   a URL, **Then** subsequent generation requests use that URL.

4. **Given** the user runs the Set Model command, **When** they enter or select a
   model identifier, **Then** subsequent generation requests use that model.

---

### User Story 3 - Visible Error on Missing Configuration (Priority: P3)

A developer clicks the star button before completing configuration. The extension
shows a clear, visible error message identifying exactly which configuration values
are missing. No silent failures.

**Why this priority**: Improves developer experience and prevents confusion, but
only relevant in the setup phase; once configured, this path is rarely hit.

**Independent Test**: Can be tested by clearing one or more configuration values
and clicking the star button, verifying an error message names each missing item.

**Acceptance Scenarios**:

1. **Given** API key is not configured, **When** the user clicks the star button,
   **Then** a visible error message states the API key is missing.

2. **Given** both base URL and model are missing, **When** the user clicks the star
   button, **Then** the error message lists both missing items.

3. **Given** all configuration is present but the AI provider returns an error,
   **When** the user clicks the star button, **Then** a visible error message
   describes the failure (not a silent failure).

---

### Edge Cases

- The button is disabled during generation (FR-013), so additional staged files
  do not trigger a new request mid-flight; the next generation will pick up all
  staged files at that point.
- If the AI response does not conform to Conventional Commits v1.1, the raw response
  is written into the commit input and a visible warning is shown (not silently
  accepted, not silently discarded).
- What if the active repository has no git history (initial commit scenario)?
- What if staged diff is extremely large?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a star icon button within the SCM input area of
  the Source Control panel.
- **FR-002**: The star button MUST be disabled when no files are staged in the
  active repository; it MUST become enabled as soon as at least one file is staged.
- **FR-003**: On button click, system MUST read only the staged diff of the active
  repository — never the full working tree or unstaged changes.
- **FR-004**: System MUST validate that base URL, model identifier, and API key are
  all configured before initiating any AI request.
- **FR-005**: If one or more configuration values are missing, system MUST display
  a visible error notification that names each missing value; it MUST NOT fail
  silently.
- **FR-006**: System MUST send the staged diff (and file list) to the configured AI
  provider and receive a commit message in response.
- **FR-007**: The generated commit message MUST conform to Conventional Commits
  v1.1 in English.
- **FR-008**: System MUST write the generated commit message into the SCM commit
  input field, replacing any existing content.
- **FR-013**: While an AI request is in flight, the star button MUST be disabled
  to prevent concurrent requests, and the VS Code status bar MUST display a
  "Generating..." indicator. Both MUST be restored to their normal state when the
  request completes (success or failure).
- **FR-014**: The AI request MUST time out after 30 seconds. On timeout, the system
  MUST cancel the request, restore the button and status bar, and display a visible
  error message indicating the request timed out.
- **FR-009**: If the AI provider call fails (network error, auth error, empty
  response), system MUST display a visible error message describing the failure.
- **FR-016**: If the AI response does not conform to Conventional Commits v1.1,
  system MUST still write the raw response into the commit input field AND display
  a visible warning indicating the format may not be valid. It MUST NOT silently
  accept or discard the response.
- **FR-010**: User MUST be able to configure base URL via command palette.
- **FR-011**: User MUST be able to configure model identifier via command palette.
- **FR-012**: User MUST be able to configure API key via command palette; the key
  MUST be stored in SecretStorage and MUST NOT appear in `settings.json` or any
  plain storage.
- **FR-015**: Base URL and model identifier MUST be stored in VS Code
  `settings.json` (user scope) and MUST be readable/writable via the command
  palette configuration commands.

### Key Entities

- **Configuration**: Composed of base URL, model identifier, and API key. All
  three are required for generation to proceed. Base URL and model are stored in
  VS Code `settings.json` (user scope); the API key is stored in SecretStorage
  and never appears in plain settings.
- **Staged Diff**: The set of changes currently indexed (staged) in the active
  repository. Includes file names and their diffs. This is the sole input to the
  AI prompt.
- **Commit Message**: Output of the generation step. A text string conforming to
  Conventional Commits v1.1 in English, written into the SCM input field.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with full configuration can generate a valid Conventional
  Commits message with a single click, without leaving the Source Control panel.
  The request times out and surfaces a visible error if no response arrives within
  30 seconds.
- **SC-002**: The star button reflects staged state within 1 second of staging or
  unstaging files.
- **SC-003**: Missing configuration errors are surfaced to the user within 1 second
  of button click, with no ambiguity about which values are absent.
- **SC-004**: 100% of successfully generated messages conform to Conventional
  Commits v1.1 format and are written in English.
- **SC-005**: No error scenario results in a silent failure — every failure path
  surfaces a user-visible notification.

## Clarifications

### Session 2026-07-02

- Q: What happens to the button and UI while the AI request is in flight? → A: Button disabled during request + VS Code status bar shows "Generating..." message; both restored on completion (success or failure).
- Q: How long should the extension wait for the AI response before cancelling? → A: 30 seconds, then surface a visible timeout error.
- Q: Where are base URL and model identifier stored? → A: VS Code `settings.json` (user scope); API key remains in SecretStorage.
- Q: What if AI response does not conform to Conventional Commits v1.1? → A: Write raw response into commit input anyway, and show a visible warning that the format may not be valid.

## Assumptions

- The extension targets developers with an active git repository open in VS Code.
- Only one repository is considered at a time (the active/focused repository in
  the SCM panel).
- The AI provider is OpenRouter-compatible (OpenAI-style chat completions API);
  base URL defaults to `https://openrouter.ai/api/v1` but is user-configurable to
  support other compatible endpoints.
- Model selection is free-form text (user types or selects a model identifier);
  no model list is fetched from the provider in v1.
- The extension does not support multi-root workspaces with simultaneous generation
  across multiple repositories in v1.
- Large staged diffs are passed as-is; truncation or chunking strategies are out
  of scope for v1.
- Repositories with no prior commits (initial commit scenario) are out of scope
  for v1. The extension targets repos with at least one existing commit; behavior
  on a zero-history repo is undefined and not validated.
