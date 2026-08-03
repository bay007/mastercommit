import { ApiError, EmptyResponseError, TimeoutError } from '../shared/errors';
import { Message, CommitResult, CC_PATTERN } from './types';

const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

interface AnthropicContentBlock {
	type: string;
	text?: string;
}

interface AnthropicResponse {
	content: AnthropicContentBlock[];
}

function extractSystemPrompt(messages: Message[]): { system: string; rest: Message[] } {
	const system = messages
		.filter(m => m.role === 'system')
		.map(m => m.content)
		.join('\n\n');
	const rest = messages.filter(m => m.role !== 'system');
	return { system, rest };
}

export async function generateCommitMessage(
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
): Promise<CommitResult> {
	const { system, rest } = extractSystemPrompt(messages);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30_000);

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/messages`, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': ANTHROPIC_VERSION,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				model,
				system,
				max_tokens: MAX_TOKENS,
				messages: rest,
			}),
		});
	} catch (err) {
		if ((err as Error).name === 'AbortError') {
			throw new TimeoutError();
		}
		throw new ApiError(0, (err as Error).message);
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new ApiError(response.status, body || response.statusText);
	}

	const data = (await response.json()) as AnthropicResponse;
	const raw = (data.content ?? [])
		.filter(block => block.type === 'text')
		.map(block => block.text ?? '')
		.join('')
		.trim();

	if (!raw) {
		throw new EmptyResponseError();
	}

	return {
		raw,
		isConforming: CC_PATTERN.test(raw),
	};
}
