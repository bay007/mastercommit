import { AiProvider } from '../shared/config';
import { Message, CommitResult } from './types';
import { generateCommitMessage as generateOpenAiCompatible } from './openai-compatible-client';
import { generateCommitMessage as generateAnthropic } from './anthropic-client';
import { ApiError } from '../shared/errors';
import { setLastRequest, logRequest, redactHeaders, hostOf } from '../shared/request-log';

const OPENROUTER_HEADERS: Record<string, string> = {
	'HTTP-Referer': 'vscode-mastercommit',
	'X-Title': 'MasterCommit',
};

function requestUrlAndHeaders(
	provider: AiProvider,
	baseUrl: string,
	apiKey: string,
): { url: string; headers: Record<string, string> } {
	if (provider === 'anthropic') {
		return {
			url: `${baseUrl}/messages`,
			headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
		};
	}
	const extraHeaders = provider === 'openrouter' ? OPENROUTER_HEADERS : {};
	return {
		url: `${baseUrl}/chat/completions`,
		headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders },
	};
}

export async function generateCommitMessage(
	provider: AiProvider,
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
	upstreamProvider: string = '',
): Promise<CommitResult> {
	const { url, headers } = requestUrlAndHeaders(provider, baseUrl, apiKey);
	setLastRequest({
		provider,
		url,
		method: 'POST',
		headers: redactHeaders(headers),
		model,
		upstreamProvider: upstreamProvider || undefined,
		messages: messages.map(m => ({ role: m.role, chars: m.content.length })),
	});

	const startedAt = Date.now();
	try {
		const result = await dispatch(provider, baseUrl, model, apiKey, messages, upstreamProvider);
		void logRequest({
			provider,
			host: hostOf(url),
			model,
			upstreamProvider: upstreamProvider || undefined,
			diffText: messages.map(m => m.content).join('\n'),
			ok: true,
			durationMs: Date.now() - startedAt,
		});
		return result;
	} catch (err) {
		void logRequest({
			provider,
			host: hostOf(url),
			model,
			upstreamProvider: upstreamProvider || undefined,
			diffText: messages.map(m => m.content).join('\n'),
			ok: false,
			status: err instanceof ApiError ? err.status : undefined,
			durationMs: Date.now() - startedAt,
			error: (err as Error).message,
		});
		throw err;
	}
}

function dispatch(
	provider: AiProvider,
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
	upstreamProvider: string,
): Promise<CommitResult> {
	switch (provider) {
		case 'openrouter': {
			const extraBody = upstreamProvider
				? { provider: { order: [upstreamProvider] } }
				: {};
			return generateOpenAiCompatible(baseUrl, model, apiKey, messages, OPENROUTER_HEADERS, extraBody);
		}
		case 'openai':
			return generateOpenAiCompatible(baseUrl, model, apiKey, messages);
		case 'anthropic':
			return generateAnthropic(baseUrl, model, apiKey, messages);
	}
}
