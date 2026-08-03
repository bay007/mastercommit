export interface Message {
	role: string;
	content: string;
}

export interface CommitResult {
	raw: string;
	isConforming: boolean;
}

export const CC_PATTERN =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;
