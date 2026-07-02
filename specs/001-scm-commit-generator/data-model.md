# Data Model: SCM Commit Generator

**Feature**: `001-scm-commit-generator` | **Date**: 2026-07-02

## Entities

### Configuration

Represents all settings required before commit generation can proceed.

| Field | Type | Storage | Required | Notes |
|-------|------|---------|----------|-------|
| `baseUrl` | `string` | `settings.json` (`mastercommit.baseUrl`) | Yes | Defaults to `https://openrouter.ai/api/v1` |
| `model` | `string` | `settings.json` (`mastercommit.model`) | Yes | Free-form model identifier (e.g., `openai/gpt-4o`) |
| `apiKey` | `string` | `SecretStorage` (key: `mastercommit.apiKey`) | Yes | Never in plaintext; retrieved fresh on each request |

**Validation rule**: All three fields must be non-empty strings. If any is missing,
the system identifies and reports the specific missing fields (FR-005).

**State transitions**:
- `incomplete` → one or more fields not set → blocks generation
- `complete` → all fields present → generation allowed

---

### StagedDiff

Represents the current staged changes in the active repository at the moment the
generation button is clicked.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `diffText` | `string` | `Repository.diff(true)` | Full unified diff of staged changes |
| `stagedFiles` | `string[]` | `Repository.state.indexChanges[].uri.fsPath` | File paths of staged files |
| `isEmpty` | `boolean` | Derived: `stagedFiles.length === 0` | Controls button enablement |

**Invariant**: `StagedDiff` is read-only and ephemeral — captured at click time,
never persisted.

---

### GenerationRequest

Represents a single in-flight AI generation operation.

| Field | Type | Notes |
|-------|------|-------|
| `prompt` | `PromptPayload` | Built from `StagedDiff` + system instructions |
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | Drives button state and status bar |
| `abortController` | `AbortController` | Used to enforce 30s timeout |

**State transitions**:
```
idle → loading (button clicked, request started)
loading → success (response received, CC-conforming or not)
loading → error (network error, auth error, timeout, empty response)
success → idle (commit input populated)
error → idle (error shown to user)
```

**Constraint**: Only one `GenerationRequest` may be active at a time. The button
is disabled while status is `loading` (FR-013).

---

### CommitMessage

Represents the output of a successful generation.

| Field | Type | Notes |
|-------|------|-------|
| `raw` | `string` | Raw text returned by the AI model |
| `isConforming` | `boolean` | True if `raw` matches Conventional Commits v1.1 pattern |

**Behavior**:
- `raw` is always written to `inputBox.value` if the AI returned any non-empty text
- If `isConforming === false`, a VS Code warning notification is shown (FR-016)
- If `raw` is empty, treated as an error (FR-009)

---

## Settings Schema (`package.json` → `contributes.configuration`)

```json
{
  "mastercommit.baseUrl": {
    "type": "string",
    "default": "https://openrouter.ai/api/v1",
    "description": "Base URL for the OpenAI-compatible AI provider endpoint"
  },
  "mastercommit.model": {
    "type": "string",
    "default": "",
    "description": "Model identifier to use for commit generation (e.g., openai/gpt-4o)"
  }
}
```

Note: `apiKey` has no `configuration` schema entry — it is managed exclusively
via `SecretStorage` through the `mastercommit.setApiKey` command.
