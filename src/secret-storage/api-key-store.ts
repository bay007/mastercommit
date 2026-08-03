import * as vscode from 'vscode';
import { AiProvider } from '../shared/config';

const LEGACY_API_KEY_SECRET = 'mastercommit.apiKey';

function secretKeyFor(provider: AiProvider): string {
	return `mastercommit.apiKey.${provider}`;
}

export async function storeApiKey(
	secrets: vscode.SecretStorage,
	provider: AiProvider,
	value: string,
): Promise<void> {
	await secrets.store(secretKeyFor(provider), value);
}

export async function getApiKey(
	secrets: vscode.SecretStorage,
	provider: AiProvider,
): Promise<string | undefined> {
	const value = await secrets.get(secretKeyFor(provider));
	if (value !== undefined) {
		return value;
	}

	if (provider !== 'openrouter') {
		return undefined;
	}

	const legacyValue = await secrets.get(LEGACY_API_KEY_SECRET);
	if (legacyValue !== undefined) {
		await secrets.store(secretKeyFor(provider), legacyValue);
		await secrets.delete(LEGACY_API_KEY_SECRET);
	}
	return legacyValue;
}

export async function clearApiKey(secrets: vscode.SecretStorage, provider: AiProvider): Promise<void> {
	await secrets.delete(secretKeyFor(provider));
}
