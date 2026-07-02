# Contract: VS Code package.json Contributions

**Feature**: `001-scm-commit-generator` | **Date**: 2026-07-02

## Commands

| Command ID | Title | Description |
|------------|-------|-------------|
| `mastercommit.generateCommit` | `$(star) MasterCommit: Generate Commit` | Trigger commit message generation |
| `mastercommit.setApiKey` | `MasterCommit: Set API Key` | Store API key in SecretStorage |
| `mastercommit.setBaseUrl` | `MasterCommit: Set Base URL` | Save base URL to settings |
| `mastercommit.setModel` | `MasterCommit: Set Model` | Save model identifier to settings |

## Menus

### `scm/title` (star button in SCM panel)

```json
{
  "command": "mastercommit.generateCommit",
  "when": "scmProvider == git",
  "enablement": "mastercommit.hasStagedFiles",
  "group": "navigation"
}
```

- Visible only when active SCM provider is `git`
- Enabled only when context key `mastercommit.hasStagedFiles` is `true`
- `group: "navigation"` places it in the icon row (right side of SCM title bar)

## Context Keys

| Key | Type | Default | Set by |
|-----|------|---------|--------|
| `mastercommit.hasStagedFiles` | `boolean` | `false` | `setContext` call in `generate-button.ts` on `repo.state.onDidChange` |

## Configuration (`contributes.configuration`)

```json
{
  "title": "MasterCommit",
  "properties": {
    "mastercommit.baseUrl": {
      "type": "string",
      "default": "https://openrouter.ai/api/v1",
      "description": "Base URL for the OpenAI-compatible AI provider"
    },
    "mastercommit.model": {
      "type": "string",
      "default": "",
      "description": "Model identifier (e.g. openai/gpt-4o, anthropic/claude-sonnet-4-6)"
    }
  }
}
```

## Activation Events

```json
{
  "activationEvents": [
    "onCommand:mastercommit.generateCommit",
    "onCommand:mastercommit.setApiKey",
    "onCommand:mastercommit.setBaseUrl",
    "onCommand:mastercommit.setModel"
  ]
}
```

No `*` activation — lazy activation per constitution (Principle V, YAGNI).

## Icon

Command `mastercommit.generateCommit` uses VS Code codicon `$(star)`.
Defined in command `title` or via `"icon": { "light": "...", "dark": "..." }` if
a custom icon is added later. For v1, codicon `$(star)` is sufficient.
