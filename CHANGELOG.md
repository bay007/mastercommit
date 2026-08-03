# Change Log

All notable changes to the "mastercommit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.3.1] - 2026-08-03

### Added
- **OpenRouter upstream provider selection**: optional upstream provider field in settings to force a specific backend provider (e.g., DeepSeek) via `provider.order` array in API requests
- Configuration schema support for per-provider upstream provider storage in `mastercommit.providerSettings`
- Settings UI toggle: upstream provider input visible only when OpenRouter is selected
- Webview message handling for upstream provider persistence across settings init, provider changes, and save operations
- Per-provider upstream provider memory: switching providers preserves each provider's upstream setting

## [1.2.1] - Initial Release

### Added
- Initial release
- Support for native OpenAI (ChatGPT) and Anthropic Claude as AI providers, alongside OpenRouter
- "MasterCommit" settings view in the Activity Bar (provider dropdown, base URL, model, token — token stored in SecretStorage per provider)
- Per-provider base URL and model persistence, so switching providers no longer requires re-entering endpoint/model configuration