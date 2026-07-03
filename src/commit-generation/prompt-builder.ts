import { StagedDiff } from '../staged-diff-reader/git-staged-reader';

interface Message {
	role: 'system' | 'user';
	content: string;
}

export function buildMessages(diff: StagedDiff): Message[] {
	const fileList = diff.stagedFiles.length > 0
		? diff.stagedFiles.join('\n')
		: '(no specific files listed)';

	return [
		{
			"role": "system",
			"content": "You are an expert developer. Generate a commit message that strictly follows the Semantic Commit Messages convention in English. Format: <type>(<scope>): <subject>. Valid types: feat, fix, docs, style, refactor, test, chore. Scope is optional. Subject in imperative present tense, max 50 characters, no trailing period. Use exactly one type representing the main change — if the diff mixes unrelated changes, say so instead of forcing one commit. If more context is needed, add a body after a blank line (bullets, what/why, not how). Never invent context not present in the diff. Output only the commit message, nothing else. No explanation, no markdown, no code fences."
		},
		{
			"role": "user",
			"content":
				"Generate a Semantic Commit Message for the following staged changes:\n\n" +
				`Staged files:\n${fileList}\n\nDiff:\n${diff.diffText}`,
		}
	];
}
