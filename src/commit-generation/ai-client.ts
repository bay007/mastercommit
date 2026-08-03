import { AiProvider } from '../shared/config';
import { Message, CommitResult } from './types';
import { generateCommitMessage as generateOpenAiCompatible } from './openai-compatible-client';
import { generateCommitMessage as generateAnthropic } from './anthropic-client';

const OPENROUTER_HEADERS: Record<string, string> = {
	'HTTP-Referer': 'vscode-mastercommit',
	'X-Title': 'MasterCommit',
};

export async function generateCommitMessage(
	provider: AiProvider,
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
	upstreamProvider: string = '',
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
