import * as vscode from 'vscode';
import { AiProvider, getConfig, getDefaultBaseUrl, getProviderSettings, setProviderSettings } from '../shared/config';
import { storeApiKey, getApiKey } from '../secret-storage/api-key-store';
import { getSettingsHtml } from './settings-webview-content';

interface SaveMessage {
	type: 'save';
	provider: AiProvider;
	baseUrl: string;
	model: string;
	token: string;
}

const VALID_PROVIDERS: readonly AiProvider[] = ['openrouter', 'openai', 'anthropic'];

function isAiProvider(value: unknown): value is AiProvider {
	return typeof value === 'string' && (VALID_PROVIDERS as readonly string[]).includes(value);
}

interface SaveMessageCandidate {
	type?: unknown;
	provider?: unknown;
	baseUrl?: unknown;
	model?: unknown;
	token?: unknown;
}

function isSaveMessage(message: SaveMessageCandidate): message is SaveMessage {
	return (
		isAiProvider(message.provider) &&
		typeof message.baseUrl === 'string' &&
		typeof message.model === 'string' &&
		typeof message.token === 'string'
	);
}

export class SettingsViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly secrets: vscode.SecretStorage) {}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.html = getSettingsHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message: unknown) => {
			void this.handleMessage(webviewView.webview, message);
		});
	}

	private async handleMessage(webview: vscode.Webview, message: unknown): Promise<void> {
		if (!message || typeof message !== 'object') {
			return;
		}
		const record = message as Record<string, unknown>;

		if (record.type === 'ready') {
			await this.sendInit(webview);
			return;
		}

		if (record.type === 'providerChanged' && isAiProvider(record.provider)) {
			await this.sendProviderInfo(webview, record.provider);
			return;
		}

		if (record.type === 'save' && isSaveMessage(record)) {
			await this.save(webview, record);
		}
	}

	private async sendInit(webview: vscode.Webview): Promise<void> {
		const { provider } = getConfig();
		const { baseUrl, model } = getProviderSettings(provider);
		const hasToken = (await getApiKey(this.secrets, provider)) !== undefined;
		void webview.postMessage({
			type: 'init',
			provider,
			baseUrl,
			model,
			hasToken,
			defaultBaseUrl: getDefaultBaseUrl(provider),
		});
	}

	private async sendProviderInfo(webview: vscode.Webview, provider: AiProvider): Promise<void> {
		const { baseUrl, model } = getProviderSettings(provider);
		const hasToken = (await getApiKey(this.secrets, provider)) !== undefined;
		void webview.postMessage({
			type: 'providerInfo',
			provider,
			baseUrl,
			model,
			defaultBaseUrl: getDefaultBaseUrl(provider),
			hasToken,
		});
	}

	private async save(webview: vscode.Webview, message: SaveMessage): Promise<void> {
		const cfg = vscode.workspace.getConfiguration('mastercommit');
		await cfg.update('provider', message.provider, true);
		await setProviderSettings(message.provider, { baseUrl: message.baseUrl, model: message.model });

		if (message.token.length > 0) {
			await storeApiKey(this.secrets, message.provider, message.token);
		}

		await this.sendInit(webview);
		void vscode.window.showInformationMessage('MasterCommit: Settings saved.');
	}
}
