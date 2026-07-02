import * as vscode from 'vscode';
import { Repository, getStagedDiff } from '../staged-diff-reader/git-staged-reader';
import { buildMessages } from '../commit-generation/prompt-builder';
import { generateCommitMessage } from '../commit-generation/openrouter-client';
import { getConfig } from '../shared/config';
import { getApiKey } from '../secret-storage/api-key-store';
import { MissingConfigError, ApiError, TimeoutError, EmptyResponseError } from '../shared/errors';
import { showGenerating, hideGenerating } from './status-bar';

export function validateConfig(baseUrl: string, model: string, apiKey: string): void {
	const missing: string[] = [];
	if (!baseUrl) { missing.push('baseUrl'); }
	if (!model) { missing.push('model'); }
	if (!apiKey) { missing.push('apiKey'); }
	if (missing.length > 0) {
		throw new MissingConfigError(missing);
	}
}

export async function handleGenerateCommit(
	repo: Repository,
	secrets: vscode.SecretStorage,
	statusBar: vscode.StatusBarItem,
): Promise<void> {
	const { baseUrl, model } = getConfig();
	const apiKey = (await getApiKey(secrets)) ?? '';

	try {
		validateConfig(baseUrl, model, apiKey);
	} catch (err) {
		if (err instanceof MissingConfigError) {
			vscode.window.showErrorMessage(
				`MasterCommit: Missing configuration: ${err.fields.join(', ')}`,
			);
		}
		return;
	}

	showGenerating(statusBar);

	try {
		const diff = await getStagedDiff(repo);
		const messages = buildMessages(diff);
		const result = await generateCommitMessage(baseUrl, model, apiKey, messages);

		repo.inputBox.value = result.raw;

		if (!result.isConforming) {
			vscode.window.showWarningMessage(
				'MasterCommit: Generated message may not follow Conventional Commits format.',
			);
		}
	} catch (err) {
		if (err instanceof TimeoutError) {
			vscode.window.showErrorMessage('MasterCommit: Request timed out after 30 seconds.');
		} else if (err instanceof ApiError) {
			vscode.window.showErrorMessage(
				`MasterCommit: Provider error (${err.status}): ${err.message}`,
			);
		} else if (err instanceof EmptyResponseError) {
			vscode.window.showErrorMessage('MasterCommit: AI returned an empty response.');
		} else {
			vscode.window.showErrorMessage(
				`MasterCommit: Unexpected error: ${(err as Error).message}`,
			);
		}
	} finally {
		hideGenerating(statusBar);
	}
}
