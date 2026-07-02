import * as vscode from 'vscode';

const API_KEY_SECRET = 'mastercommit.apiKey';

export async function storeApiKey(secrets: vscode.SecretStorage, value: string): Promise<void> {
	await secrets.store(API_KEY_SECRET, value);
}

export async function getApiKey(secrets: vscode.SecretStorage): Promise<string | undefined> {
	return secrets.get(API_KEY_SECRET);
}

export async function clearApiKey(secrets: vscode.SecretStorage): Promise<void> {
	await secrets.delete(API_KEY_SECRET);
}
