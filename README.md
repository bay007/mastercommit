# mastercommit

VS Code extension that generates [Conventional Commits v1.1](https://www.conventionalcommits.org/) messages from your staged diff, using OpenRouter, native OpenAI (ChatGPT), or Anthropic Claude.

## How it works

1. Stage files in the Source Control panel
2. Click the ★ button in the SCM title bar
3. A Conventional Commits message is written directly into the commit input box

The button is disabled when no files are staged or a request is in flight. All errors surface visibly — no silent failures.

## Requirements

- VS Code ^1.125.0
- An API key for one of the supported providers: OpenRouter, OpenAI, or Anthropic

## Configuration

Open the **MasterCommit** icon in the Activity Bar to get a settings panel with:

- **Proveedor**: OpenRouter / ChatGPT (OpenAI) / Claude (Anthropic)
- **Base URL** (optional override; leave empty to use the provider's default endpoint)
- **Modelo** (e.g. `openai/gpt-4o`, `gpt-4o`, `claude-sonnet-4-5-20250929`)
- **Proveedor específico** (OpenRouter only, optional; e.g. `DeepSeek`) — forces a specific upstream provider via `provider.order`
- **Token / API Key** — written straight to VS Code SecretStorage, namespaced per provider; never stored in `settings.json`

Base URL, model, upstream provider (OpenRouter only), and token are all remembered **per provider**. Switching the
provider dropdown restores that provider's own endpoint/model/token instead of
requiring you to re-enter them — going back and forth between providers (e.g.
because one is slow) keeps each one's last configuration intact.

`mastercommit.provider` and `mastercommit.providerSettings` (base URL + model
per provider) are stored in `settings.json`. Every provider's API key is
stored exclusively in VS Code SecretStorage, namespaced per provider.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `mastercommit.provider` | `openrouter` | `openrouter` \| `openai` \| `anthropic` |
| `mastercommit.providerSettings` | `{}` | Per-provider `{ baseUrl, model, upstreamProvider }`; empty `baseUrl` uses that provider's default endpoint; `upstreamProvider` is OpenRouter-only |


## Notes

- Only the staged diff is sent to the AI — unstaged changes are ignored
- Request times out after 30 seconds
- Response must conform to Conventional Commits v1.1 or a warning is shown
- Single active repository supported
