import * as vscode from 'vscode';

export type AiProvider = 'openrouter' | 'openai' | 'anthropic';

export interface Config {
	provider: AiProvider;
	baseUrl: string;
	model: string;
}

const DEFAULT_BASE_URLS: Record<AiProvider, string> = {
	openrouter: 'https://openrouter.ai/api/v1',
	openai: 'https://api.openai.com/v1',
	anthropic: 'https://api.anthropic.com/v1',
};

const VALID_PROVIDERS: readonly AiProvider[] = ['openrouter', 'openai', 'anthropic'];

function isAiProvider(value: unknown): value is AiProvider {
	return typeof value === 'string' && (VALID_PROVIDERS as readonly string[]).includes(value);
}

export function getDefaultBaseUrl(provider: AiProvider): string {
	return DEFAULT_BASE_URLS[provider];
}

export function getConfig(): Config {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	const rawProvider = cfg.get<string>('provider', 'openrouter');
	const provider = isAiProvider(rawProvider) ? rawProvider : 'openrouter';
	const rawBaseUrl = cfg.get<string>('baseUrl', '');
	return {
		provider,
		baseUrl: rawBaseUrl || getDefaultBaseUrl(provider),
		model: cfg.get<string>('model', ''),
	};
}
