import * as vscode from 'vscode';
import { Repository, getStagedDiff } from '../staged-diff-reader/git-staged-reader';
import { buildMessages } from '../commit-generation/prompt-builder';
import { generateCommitMessage } from '../commit-generation/ai-client';
import { getConfig, getProviderSettings, AiProvider } from '../shared/config';
import { getApiKey } from '../secret-storage/api-key-store';
import { MissingConfigError, ApiError, TimeoutError, EmptyResponseError } from '../shared/errors';
import { showGenerating, hideGenerating } from './status-bar';
import { isKnownHost } from '../provider-diagnostics/host-allowlist';
import { estimateTokens } from '../shared/token-estimate';
import { Message } from '../commit-generation/types';

const DEFAULT_MAX_DIFF_TOKENS = 12_000;

function getFallbackProvider(primary: AiProvider): AiProvider | undefined {
	const value = vscode.workspace.getConfiguration('mastercommit').get<string>('fallbackProvider', '');
	if (value === 'openrouter' || value === 'openai' || value === 'anthropic') {
		return value === primary ? undefined : value;
	}
	return undefined;
}

async function confirmLargeDiff(messages: Message[]): Promise<boolean> {
	const maxTokens = vscode.workspace.getConfiguration('mastercommit').get<number>('maxDiffTokens', DEFAULT_MAX_DIFF_TOKENS);
	if (maxTokens <= 0) {
		return true;
	}
	const estimated = estimateTokens(messages);
	if (estimated <= maxTokens) {
		return true;
	}
	const choice = await vscode.window.showWarningMessage(
		`MasterCommit: staged diff is ~${estimated} tokens, above the configured limit of ${maxTokens}. Continue?`,
		{ modal: true },
		'Continue',
	);
	return choice === 'Continue';
}

type FallbackOutcome =
	| { status: 'not-attempted' }
	| { status: 'succeeded'; raw: string }
	| { status: 'failed' };

async function tryFallback(
	primary: AiProvider,
	messages: Message[],
	secrets: vscode.SecretStorage,
	primaryError: Error,
): Promise<FallbackOutcome> {
	const fallbackProvider = getFallbackProvider(primary);
	if (!fallbackProvider) {
		return { status: 'not-attempted' };
	}
	const { baseUrl, model, upstreamProvider } = getProviderSettings(fallbackProvider);
	const apiKey = (await getApiKey(secrets, fallbackProvider)) ?? '';
	if (!baseUrl || !model || !apiKey) {
		vscode.window.showWarningMessage(
			`MasterCommit: fallback provider "${fallbackProvider}" is not fully configured; skipping fallback.`,
		);
		return { status: 'not-attempted' };
	}
	try {
		const result = await generateCommitMessage(fallbackProvider, baseUrl, model, apiKey, messages, upstreamProvider);
		vscode.window.showWarningMessage(
			`MasterCommit: primary provider failed (${primaryError.message}); used fallback provider "${fallbackProvider}".`,
		);
		return { status: 'succeeded', raw: result.raw };
	} catch (fallbackErr) {
		vscode.window.showErrorMessage(
			`MasterCommit: primary and fallback providers both failed. Primary: ${primaryError.message}. Fallback: ${(fallbackErr as Error).message}`,
		);
		return { status: 'failed' };
	}
}

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
	const { provider, baseUrl, model, upstreamProvider } = getConfig();
	const apiKey = (await getApiKey(secrets, provider)) ?? '';

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

	if (!isKnownHost(provider, baseUrl)) {
		vscode.window.showWarningMessage(
			`MasterCommit: base URL "${baseUrl}" does not match the known ${provider} domain. Verify this is intentional before generating.`,
		);
	}

	const diff = await getStagedDiff(repo);
	const messages = await buildMessages(diff);

	if (!(await confirmLargeDiff(messages))) {
		return;
	}

	showGenerating(statusBar);

	try {
		const result = await generateCommitMessage(provider, baseUrl, model, apiKey, messages, upstreamProvider);

		repo.inputBox.value = result.raw;

		if (!result.isConforming) {
			vscode.window.showWarningMessage(
				'MasterCommit: Generated message may not follow Conventional Commits format.',
			);
		}
	} catch (err) {
		if (err instanceof ApiError || err instanceof TimeoutError) {
			const outcome = await tryFallback(provider, messages, secrets, err);
			if (outcome.status === 'succeeded') {
				repo.inputBox.value = outcome.raw;
				return;
			}
			if (outcome.status === 'failed') {
				return;
			}
		}

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
