import { ApiError, EmptyResponseError, TimeoutError } from '../shared/errors';

const CC_PATTERN =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;

interface Message {
	role: string;
	content: string;
}

export interface CommitResult {
	raw: string;
	isConforming: boolean;
}

interface OpenRouterChoice {
	message: {
		content: string;
	};
}

interface OpenRouterResponse {
	choices: OpenRouterChoice[];
}

export async function generateCommitMessage(
	baseUrl: string,
	model: string,
	apiKey: string,
	messages: Message[],
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
				'HTTP-Referer': 'vscode-mastercommit',
				'X-Title': 'MasterCommit',
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

	const data = (await response.json()) as OpenRouterResponse;
	const raw = (data.choices?.[0]?.message?.content ?? '').trim();

	if (!raw) {
		throw new EmptyResponseError();
	}

	return {
		raw,
		isConforming: CC_PATTERN.test(raw),
	};
}
