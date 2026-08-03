import { ApiError, EmptyResponseError, TimeoutError } from '../shared/errors';
import { Message, CommitResult, CC_PATTERN } from './types';

interface OpenAiCompatibleChoice {
	message: {
		content: string;
	};
}

interface OpenAiCompatibleResponse {
	choices: OpenAiCompatibleChoice[];
}

export async function generateCommitMessage(
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
	extraHeaders: Record<string, string> = {},
): Promise<CommitResult> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30_000);

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				...extraHeaders,
			},
			body: JSON.stringify({ model, messages }),
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

	const data = (await response.json()) as OpenAiCompatibleResponse;
	const raw = (data.choices?.[0]?.message?.content ?? '').trim();

	if (!raw) {
		throw new EmptyResponseError();
	}

	return {
		raw,
		isConforming: CC_PATTERN.test(raw),
	};
}
