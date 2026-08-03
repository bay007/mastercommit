import { Message } from '../commit-generation/types';

const CHARS_PER_TOKEN = 4;

export function estimateTokens(messages: Message[]): number {
	const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
	return Math.ceil(totalChars / CHARS_PER_TOKEN);
}
