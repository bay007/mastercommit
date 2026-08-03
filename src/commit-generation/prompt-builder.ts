import * as vscode from 'vscode';
import { StagedDiff } from '../staged-diff-reader/git-staged-reader';

interface Message {
	role: 'system' | 'user';
	content: string;
}

const DEFAULT_SYSTEM_PROMPT = "You are an expert developer. Generate a commit message that strictly follows the Semantic Commit Messages convention in English. Format: <type>(<scope>): <subject>. Valid types: feat, fix, docs, style, refactor, test, chore. Scope is optional. Subject in imperative present tense, max 50 characters, no trailing period. Use exactly one type representing the main change — if the diff mixes unrelated changes, say so instead of forcing one commit. If more context is needed, add a body after a blank line (bullets, what/why, not how). Never invent context not present in the diff. Output only the commit message, nothing else. No explanation, no markdown, no code fences.";

const PROMPT_OVERRIDE_RELATIVE_PATH = '.mastercommit/prompt.md';

async function readPromptOverride(): Promise<string | undefined> {
	const folder = vscode.workspace.workspaceFolders?.[0];
	if (!folder) {
		return undefined;
	}
	try {
		const uri = vscode.Uri.joinPath(folder.uri, PROMPT_OVERRIDE_RELATIVE_PATH);
		const bytes = await vscode.workspace.fs.readFile(uri);
		const text = new TextDecoder().decode(bytes).trim();
		return text.length > 0 ? text : undefined;
	} catch {
		return undefined;
	}
}

export async function buildMessages(diff: StagedDiff): Promise<Message[]> {
	const fileList = diff.stagedFiles.length > 0
		? diff.stagedFiles.join('\n')
		: '(no specific files listed)';

	const systemPrompt = (await readPromptOverride()) ?? DEFAULT_SYSTEM_PROMPT;

	return [
		{
			"role": "system",
			"content": systemPrompt,
		},
		{
			"role": "user",
			"content":
				"Generate a Semantic Commit Message for the following staged changes:\n\n" +
				`Staged files:\n${fileList}\n\nDiff:\n${diff.diffText}`,
		}
	];
}
