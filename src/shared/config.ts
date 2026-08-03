import * as vscode from 'vscode';

export type AiProvider = 'openrouter' | 'openai' | 'anthropic';

export interface Config {
	provider: AiProvider;
	baseUrl: string;
	model: string;
	upstreamProvider: string;
}

export interface ProviderSettings {
	baseUrl: string;
	model: string;
	upstreamProvider: string;
}

interface RawProviderSettings {
	baseUrl?: string;
	model?: string;
	upstreamProvider?: string;
}

const DEFAULT_BASE_URLS: Record<AiProvider, string> = {
	openrouter: 'https://openrouter.ai/api/v1',
	openai: 'https://api.openai.com/v1',
	anthropic: 'https://api.anthropic.com/v1',
};

const VALID_PROVIDERS: readonly AiProvider[] = ['openrouter', 'openai', 'anthropic'];
const PROVIDER_SETTINGS_KEY = 'providerSettings';
const LEGACY_BASE_URL_KEY = 'baseUrl';
const LEGACY_MODEL_KEY = 'model';

function isAiProvider(value: unknown): value is AiProvider {
	return typeof value === 'string' && (VALID_PROVIDERS as readonly string[]).includes(value);
}

export function getDefaultBaseUrl(provider: AiProvider): string {
	return DEFAULT_BASE_URLS[provider];
}

function readProviderSettingsMap(
	cfg: vscode.WorkspaceConfiguration,
): Record<string, RawProviderSettings> {
	return cfg.get<Record<string, RawProviderSettings>>(PROVIDER_SETTINGS_KEY, {});
}

function migrateLegacySettings(
	cfg: vscode.WorkspaceConfiguration,
	provider: AiProvider,
	providerSettingsMap: Record<string, RawProviderSettings>,
): Record<string, RawProviderSettings> {
	if (Object.keys(providerSettingsMap).length > 0) {
		return providerSettingsMap;
	}

	const legacyBaseUrl = cfg.get<string>(LEGACY_BASE_URL_KEY, '');
	const legacyModel = cfg.get<string>(LEGACY_MODEL_KEY, '');
	if (!legacyBaseUrl && !legacyModel) {
		return providerSettingsMap;
	}

	const migrated = {
		...providerSettingsMap,
		[provider]: { baseUrl: legacyBaseUrl, model: legacyModel },
	};
	void cfg.update(PROVIDER_SETTINGS_KEY, migrated, true);
	void cfg.update(LEGACY_BASE_URL_KEY, undefined, true);
	void cfg.update(LEGACY_MODEL_KEY, undefined, true);
	return migrated;
}

export function getProviderSettings(provider: AiProvider): ProviderSettings {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	const providerSettingsMap = migrateLegacySettings(cfg, provider, readProviderSettingsMap(cfg));
	const current = providerSettingsMap[provider] ?? {};
	return {
		baseUrl: current.baseUrl ?? '',
		model: current.model ?? '',
		upstreamProvider: current.upstreamProvider ?? '',
	};
}

export async function setProviderSettings(
	provider: AiProvider,
	settings: ProviderSettings,
): Promise<void> {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	const providerSettingsMap = readProviderSettingsMap(cfg);
	const updated = { ...providerSettingsMap, [provider]: settings };
	await cfg.update(PROVIDER_SETTINGS_KEY, updated, true);
}

export interface Profile {
	id: string;
	label: string;
	provider: AiProvider;
	baseUrl: string;
	model: string;
	upstreamProvider?: string;
}

interface RawProfile {
	id?: string;
	label?: string;
	provider?: string;
	baseUrl?: string;
	model?: string;
	upstreamProvider?: string;
}

export function getProfiles(): Profile[] {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	const rawProfiles = cfg.get<RawProfile[]>('profiles', []);
	return rawProfiles
		.filter((p): p is Required<Pick<RawProfile, 'id' | 'label' | 'provider'>> & RawProfile =>
			Boolean(p.id && p.label && isAiProvider(p.provider)))
		.map(p => ({
			id: p.id as string,
			label: p.label as string,
			provider: p.provider as AiProvider,
			baseUrl: p.baseUrl ?? '',
			model: p.model ?? '',
			upstreamProvider: p.upstreamProvider ?? undefined,
		}));
}

export async function applyProfile(profile: Profile): Promise<void> {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	await cfg.update('provider', profile.provider, true);
	await setProviderSettings(profile.provider, {
		baseUrl: profile.baseUrl,
		model: profile.model,
		upstreamProvider: profile.upstreamProvider ?? '',
	});
}

export function getConfig(): Config {
	const cfg = vscode.workspace.getConfiguration('mastercommit');
	const rawProvider = cfg.get<string>('provider', 'openrouter');
	const provider = isAiProvider(rawProvider) ? rawProvider : 'openrouter';
	const { baseUrl, model, upstreamProvider } = getProviderSettings(provider);
	return {
		provider,
		baseUrl: baseUrl || getDefaultBaseUrl(provider),
		model,
		upstreamProvider,
	};
}
