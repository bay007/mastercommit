# Change Log

Every notable change to MasterCommit — the VS Code extension that turns your staged diff into a
Conventional Commit message, on your terms, with your provider, with nothing sent anywhere else.

Format follows [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

### Added
- **Output Channel logging**: new "MasterCommit" output channel logs every generation request (provider, host, model, status, duration) in real time, with API keys never logged
- **Local audit log (opt-in)**: `mastercommit.auditLog.enabled` writes a JSONL trail to `.mastercommit/audit.log` per request (provider, host, model, diff hash only — never diff content)
- **Show Last Request** command: dumps the exact last outbound request (URL, redacted headers, model, message sizes) for auditing
- **Provider host allowlist**: warns before sending if the configured base URL doesn't match the selected provider's known domain (guards against typos/misconfiguration silently routing data elsewhere)
- **Verify Provider Endpoint** command: checks reachability and HTTPS of the configured base URL before you rely on it
- **Preview Request (dry run)** command: shows the exact payload (provider, host, model, messages, estimated tokens) that would be sent, without sending it
- **Named provider profiles**: `mastercommit.profiles` setting + "Switch Profile" command for quickly switching between multiple provider/model configurations
- **Custom prompt template override**: drop a `.mastercommit/prompt.md` file in the workspace root to replace the default system prompt
- **Token/size estimator**: warns (with a Continue/Cancel prompt) before sending a staged diff estimated above `mastercommit.maxDiffTokens` (default 12000)
- **Fallback provider chain (opt-in)**: `mastercommit.fallbackProvider` retries with a secondary provider if the primary fails or times out

## [1.3.1] - 2026-08-03

### Added
- **OpenRouter upstream provider selection**: optional field in settings to force a specific backend provider (e.g., DeepSeek) via `provider.order` array in API requests
- Per-provider upstream provider storage and persistence in `mastercommit.providerSettings`
- Settings UI: upstream provider input visible only when OpenRouter is selected, with clear scope documentation
- Full webview sync: upstream provider persists across settings init, provider switches, and save operations

## [1.2.1] - Initial Release

### Added
- Initial release
- Support for native OpenAI (ChatGPT) and Anthropic Claude as AI providers, alongside OpenRouter
- "MasterCommit" settings view in the Activity Bar (provider dropdown, base URL, model, token — token stored in SecretStorage per provider)
- Per-provider base URL and model persistence, so switching providers no longer requires re-entering endpoint/model configuration