# mastercommit

VS Code extension that generates [Conventional Commits v1.1](https://www.conventionalcommits.org/) messages from your staged diff using any OpenRouter-compatible AI endpoint.

## How it works

1. Stage files in the Source Control panel
2. Click the ★ button in the SCM title bar
3. A Conventional Commits message is written directly into the commit input box

The button is disabled when no files are staged or a request is in flight. All errors surface visibly — no silent failures.

## Requirements

- VS Code ^1.125.0
- An OpenRouter-compatible API endpoint and key

## Configuration

Run these commands from the Command Palette (`Cmd+Shift+P`):

| Command | Description |
|---|---|
| `mastercommit: Set API Key` | Store API key (saved in SecretStorage — never in `settings.json`) |
| `mastercommit: Set Base URL` | OpenRouter-compatible endpoint base URL |
| `mastercommit: Set Model` | Model name to use (e.g. `openai/gpt-4o`) |

Settings `mastercommit.baseUrl` and `mastercommit.model` are stored in `settings.json`. The API key is stored exclusively in VS Code SecretStorage.

## Extension Settings

| Setting | Default | Description |
|---|---|---|
| `mastercommit.baseUrl` | `https://openrouter.ai/api/v1` | AI endpoint base URL |
| `mastercommit.model` | — | Model identifier |
| `mastercommit.apiKey` | — | Open Router API key |


## Notes

- Only the staged diff is sent to the AI — unstaged changes are ignored
- Request times out after 30 seconds
- Response must conform to Conventional Commits v1.1 or a warning is shown
- Single active repository supported
