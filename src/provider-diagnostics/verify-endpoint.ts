export interface EndpointCheckResult {
	ok: boolean;
	isHttps: boolean;
	status?: number;
	message: string;
}

const CHECK_TIMEOUT_MS = 10_000;

export async function verifyEndpoint(baseUrl: string): Promise<EndpointCheckResult> {
	let url: URL;
	try {
		url = new URL(baseUrl);
	} catch {
		return { ok: false, isHttps: false, message: `Invalid URL: ${baseUrl}` };
	}

	const isHttps = url.protocol === 'https:';
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

	try {
		const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
		return {
			ok: true,
			isHttps,
			status: response.status,
			message: `Reachable (status ${response.status}) at ${url.host}${isHttps ? '' : ' — WARNING: not HTTPS'}`,
		};
	} catch (err) {
		const reason = (err as Error).name === 'AbortError' ? 'timed out' : (err as Error).message;
		return { ok: false, isHttps, message: `Unreachable: ${reason}` };
	} finally {
		clearTimeout(timeoutId);
	}
}
