# Contract: OpenRouter API

**Feature**: `001-scm-commit-generator` | **Date**: 2026-07-02

## Endpoint

```
POST {baseUrl}/chat/completions
```

Where `baseUrl` is the user-configured value (default: `https://openrouter.ai/api/v1`).

## Request

**Headers**:
```
Authorization: Bearer {apiKey}
Content-Type: application/json
```

**Body**:
```json
{
  "model": "{model}",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert developer. Generate a commit message that strictly follows the Conventional Commits v1.1 specification in English. Output only the commit message, nothing else. No explanation, no markdown, no code fences."
    },
    {
      "role": "user",
      "content": "Generate a Conventional Commits v1.1 commit message for the following staged changes:\n\nStaged files:\n{fileList}\n\nDiff:\n{diffText}"
    }
  ]
}
```

**Timeout**: 30 seconds (enforced via `AbortController`)

## Response (success)

**HTTP status**: `200`

**Body**:
```json
{
  "choices": [
    {
      "message": {
        "content": "feat(scm-ui): add star button to SCM panel for AI commit generation"
      }
    }
  ]
}
```

**Extraction**: `response.choices[0].message.content` (trimmed)

## Response (error cases)

| HTTP Status | Meaning | User-visible error |
|-------------|---------|-------------------|
| `401` | Invalid or missing API key | "MasterCommit: Invalid API key. Run 'MasterCommit: Set API Key' to update it." |
| `404` | Model not found | "MasterCommit: Model '{model}' not found. Run 'MasterCommit: Set Model' to update it." |
| `429` | Rate limited | "MasterCommit: Rate limit exceeded. Try again shortly." |
| `5xx` | Provider error | "MasterCommit: AI provider error ({status}). Try again." |
| Network/abort | Timeout or no connection | "MasterCommit: Request timed out after 30 seconds." |
| Empty content | Model returned empty string | "MasterCommit: AI returned an empty response." |

## CC Validation

After extracting `content`, check against:
```
/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/
```

- **Match**: Write to `inputBox.value`. No notification.
- **No match**: Write raw content to `inputBox.value`. Show VS Code warning:
  `"MasterCommit: Generated message may not follow Conventional Commits format."`
