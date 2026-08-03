# MasterCommit

**Stop writing commit messages. Stop wondering where your code is going.**

MasterCommit reads your staged diff, sends it to the AI provider *you* choose, and writes a clean [Conventional Commits v1.1](https://www.conventionalcommits.org/) message straight into VS Code's Source Control input box — one click, no context switching, no copy-pasting into a chat window.

It supports **OpenRouter, native OpenAI, and Anthropic Claude**, and it's built so you always know exactly which provider your diff went to, never anywhere else.

## Why developers keep this installed

- ⚡ **One click, done.** Star button in the SCM title bar → Conventional Commit message in your input box. No tab-switching, no prompt engineering.
- 🔀 **Bring your own provider.** OpenRouter, OpenAI, or Anthropic — switch anytime, each keeps its own base URL, model, and API key.
- 🧭 **Full traceability.** Every request is logged to a dedicated Output Channel (host, model, status, duration). Turn on an opt-in local audit log if you want a durable trail.
- 🔒 **Provable data egress.** A host allowlist warns you if a base URL doesn't match your selected provider's domain. `Verify Provider Endpoint` and `Preview Request (dry run)` let you check exactly where a diff is headed *before* it's sent — no surprises, no silent redirects.
- 🎛️ **Flexible by design.** Named profiles for switching setups instantly, a custom prompt template override, a token-size guard for oversized diffs, and an opt-in fallback provider if your primary times out.
- 🛡️ **Secrets stay secrets.** API keys live only in VS Code `SecretStorage`, namespaced per provider — never in `settings.json`, never logged.

## How it works

1. Stage files in the Source Control panel
2. Click the ★ button in the SCM title bar
3. A Conventional Commits message is written directly into the commit input box

The button is disabled when no files are staged or a request is in flight. All errors surface visibly — no silent failures.

## Requirements

- VS Code ^1.125.0
- An API key for one of the supported providers: OpenRouter, OpenAI, or Anthropic

## Configuration

Open the **MasterCommit** icon in the Activity Bar for a settings panel with:

- **Provider**: OpenRouter / ChatGPT (OpenAI) / Claude (Anthropic)
- **Base URL** (optional override; leave empty to use the provider's default endpoint)
- **Model** (e.g. `openai/gpt-4o`, `gpt-4o`, `claude-sonnet-4-5-20250929`)
- **Upstream provider** (OpenRouter only, optional; e.g. `DeepSeek`) — forces a specific upstream provider via `provider.order`
- **Token / API Key** — written straight to VS Code SecretStorage, namespaced per provider; never stored in `settings.json`

Base URL, model, upstream provider (OpenRouter only), and token are all remembered **per provider**. Switching the
provider dropdown restores that provider's own endpoint/model/token instead of requiring you to re-enter them —
going back and forth between providers (e.g. because one is slow) keeps each one's last configuration intact.

`mastercommit.provider` and `mastercommit.providerSettings` (base URL + model per provider) are stored in
`settings.json`. Every provider's API key is stored exclusively in VS Code SecretStorage, namespaced per provider.

## Commands

Run these from the Command Palette (`Cmd/Ctrl+Shift+P`), all under the **MasterCommit** category:

| Command | What it does |
|---|---|
| **Generate Commit Message** | The star button's command — generates from the staged diff |
| **Show Last Request** | Dumps the exact last outbound request (URL, redacted headers, model, message sizes) |
| **Verify Provider Endpoint** | Checks that the configured base URL is reachable and HTTPS |
| **Preview Request (Dry Run)** | Shows the exact payload that would be sent, without sending it |
| **Switch Profile** | Jumps between named provider profiles configured in `mastercommit.profiles` |

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `mastercommit.provider` | `openrouter` | `openrouter` \| `openai` \| `anthropic` |
| `mastercommit.providerSettings` | `{}` | Per-provider `{ baseUrl, model, upstreamProvider }`; empty `baseUrl` uses that provider's default endpoint; `upstreamProvider` is OpenRouter-only |
| `mastercommit.auditLog.enabled` | `false` | Write a local JSONL audit trail to `.mastercommit/audit.log` per request (provider, host, model, diff hash — never diff content) |
| `mastercommit.maxDiffTokens` | `12000` | Warn before sending a staged diff estimated above this token count; `0` disables the check |
| `mastercommit.fallbackProvider` | `""` | Optional provider to retry with if the primary fails or times out |
| `mastercommit.profiles` | `[]` | Named provider profiles (`id`, `label`, `provider`, `baseUrl`, `model`, `upstreamProvider`) switchable via **Switch Profile** |

## Advanced

- **Custom prompt template**: drop a `.mastercommit/prompt.md` file in your workspace root to replace the default system prompt with your own conventions.

## Notes

- Only the staged diff is sent to the AI — unstaged changes are ignored
- Request times out after 30 seconds
- Response must conform to Conventional Commits v1.1 or a warning is shown
- Single active repository supported
