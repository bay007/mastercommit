import { AiProvider, getDefaultBaseUrl } from '../shared/config';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

export function isKnownHost(provider: AiProvider, baseUrl: string): boolean {
	let hostname: string;
	try {
		hostname = new URL(baseUrl).hostname.toLowerCase();
	} catch {
		return false;
	}

	if (LOCAL_HOSTNAMES.has(hostname)) {
		return true;
	}

	const defaultHostname = new URL(getDefaultBaseUrl(provider)).hostname.toLowerCase();
	return hostname === defaultHostname || hostname.endsWith(`.${defaultHostname}`);
}
