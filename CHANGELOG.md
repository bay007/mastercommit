# Change Log

All notable changes to the "mastercommit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.3.0] - 2026-08-03

### Added
- **OpenRouter upstream provider**: optional "Proveedor específico" field in settings to force a specific upstream provider (e.g., DeepSeek) via `provider.order` in API requests

## [1.2.1] - Initial Release

### Added
- Initial release
- Support for native OpenAI (ChatGPT) and Anthropic Claude as AI providers, alongside OpenRouter
- "MasterCommit" settings view in the Activity Bar (provider dropdown, base URL, model, token — token stored in SecretStorage per provider)
- Per-provider base URL and model persistence, so switching providers no longer requires re-entering endpoint/model configuration