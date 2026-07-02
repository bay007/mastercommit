import * as vscode from 'vscode';

export interface Change {
	readonly uri: vscode.Uri;
}

export interface RepositoryState {
	readonly indexChanges: Change[];
	readonly onDidChange: vscode.Event<void>;
}

export interface InputBox {
	value: string;
}

export interface Repository {
	diff(staged: boolean): Promise<string>;
	readonly state: RepositoryState;
	readonly inputBox: InputBox;
}

export interface GitAPI {
	readonly repositories: Repository[];
}

export interface GitExtension {
	getAPI(version: 1): GitAPI;
}

export interface StagedDiff {
	diffText: string;
	stagedFiles: string[];
}

export async function getStagedDiff(repo: Repository): Promise<StagedDiff> {
	const diffText = await repo.diff(true);
	const stagedFiles = repo.state.indexChanges.map(c => c.uri.fsPath);
	return { diffText, stagedFiles };
}

export function hasStagedFiles(repo: Repository): boolean {
	return repo.state.indexChanges.length > 0;
}
