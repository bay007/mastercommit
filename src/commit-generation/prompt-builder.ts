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
			role: 'system',
			content:
				'You are an expert software developer. Generate a commit message that strictly ' +
				'follows the Conventional Commits v1.1 specification in English. Output ONLY the ' +
				'commit message — no explanation, no markdown, no code fences.',
		},
		{
			role: 'user',
			content:
				'Generate a Conventional Commits v1.1 commit message for the following staged changes:\n\n' +
				`Staged files:\n${fileList}\n\nDiff:\n${diff.diffText}`,
		},
	];
}
