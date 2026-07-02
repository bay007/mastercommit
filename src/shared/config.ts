import * as vscode from 'vscode';

export interface Config {
	baseUrl: string;
	model: string;
}

export function getConfig(): Config {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	return {
		baseUrl: cfg.get<string>('baseUrl', 'https://openrouter.ai/api/v1'),
		model: cfg.get<string>('model', ''),
	};
}
