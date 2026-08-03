import * as vscode from 'vscode';

function getNonce(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let text = '';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}

export function getSettingsHtml(webview: vscode.Webview): string {
	const nonce = getNonce();
	const csp = [
		"default-src 'none'",
		`style-src 'nonce-${nonce}'`,
		`script-src 'nonce-${nonce}'`,
	].join('; ');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style nonce="${nonce}">
	body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px; }
	label { display: block; margin-top: 12px; margin-bottom: 4px; font-size: 12px; font-weight: 600; }
	select, input {
		width: 100%; box-sizing: border-box;
		background: var(--vscode-input-background); color: var(--vscode-input-foreground);
		border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px;
	}
	button {
		margin-top: 16px; width: 100%; padding: 6px;
		background: var(--vscode-button-background); color: var(--vscode-button-foreground);
		border: none; cursor: pointer;
	}
	button:hover { background: var(--vscode-button-hoverBackground); }
	.hint { font-size: 11px; opacity: 0.7; margin-top: 4px; }
	.status { margin-top: 12px; font-size: 12px; }
</style>
</head>
<body>
	<label for="provider">Proveedor</label>
	<select id="provider">
		<option value="openrouter">OpenRouter</option>
		<option value="openai">ChatGPT (OpenAI)</option>
		<option value="anthropic">Claude (Anthropic)</option>
	</select>

	<label for="baseUrl">Base URL (opcional)</label>
	<input id="baseUrl" type="text" />
	<div class="hint" id="baseUrlHint"></div>

	<label for="model">Modelo</label>
	<input id="model" type="text" placeholder="ej: gpt-4o, claude-sonnet-4-5-20250929, openai/gpt-4o" />

	<label for="token">Token / API Key</label>
	<input id="token" type="password" />
	<div class="hint" id="tokenHint"></div>

	<button id="save">Guardar</button>
	<div class="status" id="status"></div>

<script nonce="${nonce}">
	const vscode = acquireVsCodeApi();
	const providerEl = document.getElementById('provider');
	const baseUrlEl = document.getElementById('baseUrl');
	const baseUrlHintEl = document.getElementById('baseUrlHint');
	const modelEl = document.getElementById('model');
	const tokenEl = document.getElementById('token');
	const tokenHintEl = document.getElementById('tokenHint');
	const statusEl = document.getElementById('status');

	function applyProviderInfo(baseUrl, model, defaultBaseUrl, hasToken) {
		baseUrlEl.value = baseUrl;
		baseUrlEl.placeholder = defaultBaseUrl;
		baseUrlHintEl.textContent = 'Vacio = usar ' + defaultBaseUrl;
		modelEl.value = model;
		tokenEl.value = '';
		tokenEl.placeholder = hasToken ? 'Ya configurado (vacio = no cambiar)' : 'Sin configurar';
		tokenHintEl.textContent = hasToken
			? 'Hay un token guardado para este proveedor.'
			: 'No hay token guardado para este proveedor.';
	}

	providerEl.addEventListener('change', () => {
		statusEl.textContent = '';
		vscode.postMessage({ type: 'providerChanged', provider: providerEl.value });
	});

	document.getElementById('save').addEventListener('click', () => {
		vscode.postMessage({
			type: 'save',
			provider: providerEl.value,
			baseUrl: baseUrlEl.value.trim(),
			model: modelEl.value.trim(),
			token: tokenEl.value,
		});
	});

	window.addEventListener('message', (event) => {
		const message = event.data;
		if (message.type === 'init') {
			providerEl.value = message.provider;
			applyProviderInfo(message.baseUrl, message.model, message.defaultBaseUrl, message.hasToken);
		} else if (message.type === 'providerInfo') {
			applyProviderInfo(message.baseUrl, message.model, message.defaultBaseUrl, message.hasToken);
		} else if (message.type === 'saved') {
			statusEl.textContent = 'Guardado.';
		}
	});

	vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
}
