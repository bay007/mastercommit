import * as vscode from 'vscode';
import { createHash } from 'node:crypto';
import { AiProvider } from './config';

export interface RequestLogEntry {
	provider: AiProvider;
	host: string;
	model: string;
	upstreamProvider?: string;
	diffText?: string;
	ok: boolean;
	status?: number;
	durationMs: number;
	error?: string;
}

export interface LastRequestSnapshot {
	provider: AiProvider;
	url: string;
	method: string;
	headers: Record<string, string>;
	model: string;
	upstreamProvider?: string;
	messages: { role: string; chars: number }[];
	timestamp: string;
}

const REDACTED = '<redacted>';
const SECRET_HEADER_NAMES = new Set(['authorization', 'x-api-key']);
const AUDIT_LOG_RELATIVE_PATH = '.mastercommit/audit.log';

let outputChannel: vscode.OutputChannel | undefined;
let lastRequest: LastRequestSnapshot | undefined;

function getOutputChannel(): vscode.OutputChannel {
	if (!outputChannel) {
		outputChannel = vscode.window.createOutputChannel('MasterCommit');
	}
	return outputChannel;
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
	const redacted: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		redacted[key] = SECRET_HEADER_NAMES.has(key.toLowerCase()) ? REDACTED : value;
	}
	return redacted;
}

export function setLastRequest(snapshot: Omit<LastRequestSnapshot, 'timestamp'>): void {
	lastRequest = { ...snapshot, timestamp: new Date().toISOString() };
}

export function getLastRequest(): LastRequestSnapshot | undefined {
	return lastRequest;
}

function isAuditLogEnabled(): boolean {
	return vscode.workspace.getConfiguration('mastercommit').get<boolean>('auditLog.enabled', false);
}

async function appendAuditLine(line: string): Promise<void> {
	const folder = vscode.workspace.workspaceFolders?.[0];
	if (!folder) {
		return;
	}
	const auditUri = vscode.Uri.joinPath(folder.uri, AUDIT_LOG_RELATIVE_PATH);
	const dirUri = vscode.Uri.joinPath(folder.uri, '.mastercommit');
	try {
		await vscode.workspace.fs.createDirectory(dirUri);
		let existing: Uint8Array = new Uint8Array();
		try {
			existing = await vscode.workspace.fs.readFile(auditUri);
		} catch {
			existing = new Uint8Array();
		}
		const encoded = new TextEncoder().encode(line + '\n');
		const merged = new Uint8Array(existing.length + encoded.length);
		merged.set(existing, 0);
		merged.set(encoded, existing.length);
		await vscode.workspace.fs.writeFile(auditUri, new Uint8Array(merged));
	} catch (err) {
		getOutputChannel().appendLine(`[audit-log] failed to write: ${(err as Error).message}`);
	}
}

export async function logRequest(entry: RequestLogEntry): Promise<void> {
	const channel = getOutputChannel();
	const statusPart = entry.status !== undefined ? ` status=${entry.status}` : '';
	const errorPart = entry.error ? ` error=${entry.error}` : '';
	channel.appendLine(
		`[${new Date().toISOString()}] provider=${entry.provider} host=${entry.host} model=${entry.model} ` +
		`ok=${entry.ok}${statusPart} duration=${entry.durationMs}ms${errorPart}`,
	);

	if (!isAuditLogEnabled()) {
		return;
	}

	const diffHash = entry.diffText
		? createHash('sha256').update(entry.diffText).digest('hex')
		: undefined;

	await appendAuditLine(JSON.stringify({
		timestamp: new Date().toISOString(),
		provider: entry.provider,
		host: entry.host,
		model: entry.model,
		upstreamProvider: entry.upstreamProvider || undefined,
		diffHash,
		ok: entry.ok,
		status: entry.status,
		durationMs: entry.durationMs,
		error: entry.error,
	}));
}

export function showOutputChannel(): void {
	getOutputChannel().show();
}

export function hostOf(url: string): string {
	try {
		return new URL(url).host;
	} catch {
		return url;
	}
}
