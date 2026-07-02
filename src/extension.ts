import * as vscode from 'vscode';
import { GitExtension, GitAPI, Repository, hasStagedFiles } from './staged-diff-reader/git-staged-reader';
import { storeApiKey, getApiKey } from './secret-storage/api-key-store';
import { getConfig } from './shared/config';
import { createStatusBar } from './scm-ui/status-bar';
import { handleGenerateCommit } from './scm-ui/generate-button';

export function activate(context: vscode.ExtensionContext): void {
	const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');

	if (!gitExt) {
		vscode.window.showWarningMessage('MasterCommit: VS Code git extension not found.');
		return;
	}

	const git: GitAPI = gitExt.exports.getAPI(1);

	if (git.repositories.length === 0) {
		void vscode.commands.executeCommand('setContext', 'mastercommit.hasStagedFiles', false);
		const noRepo = (): void => {
			void vscode.window.showWarningMessage('MasterCommit: No git repository found.');
		};
		context.subscriptions.push(
			vscode.commands.registerCommand('mastercommit.generateCommit', noRepo),
			vscode.commands.registerCommand('mastercommit.setApiKey', noRepo),
			vscode.commands.registerCommand('mastercommit.setBaseUrl', noRepo),
			vscode.commands.registerCommand('mastercommit.setModel', noRepo),
		);
		return;
	}

	const repo: Repository = git.repositories[0];
	const statusBar = createStatusBar();
	context.subscriptions.push(statusBar);

	void vscode.commands.executeCommand(
		'setContext',
		'mastercommit.hasStagedFiles',
		hasStagedFiles(repo),
	);

	context.subscriptions.push(
		repo.state.onDidChange(() => {
			void vscode.commands.executeCommand(
				'setContext',
				'mastercommit.hasStagedFiles',
				hasStagedFiles(repo),
			);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.generateCommit', () => {
			void handleGenerateCommit(repo, context.secrets, statusBar);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.setApiKey', async () => {
			const value = await vscode.window.showInputBox({
				prompt: 'Enter your OpenRouter API key',
				password: true,
				ignoreFocusOut: true,
			});
			if (value !== undefined) {
				await storeApiKey(context.secrets, value);
				void vscode.window.showInformationMessage('MasterCommit: API key saved.');
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.setBaseUrl', async () => {
			const { baseUrl } = getConfig();
			const value = await vscode.window.showInputBox({
				prompt: 'Enter base URL for the AI provider',
				value: baseUrl,
				ignoreFocusOut: true,
			});
			if (value !== undefined) {
				await vscode.workspace
					.getConfiguration('mastercommit')
					.update('baseUrl', value, true);
				void vscode.window.showInformationMessage('MasterCommit: Base URL saved.');
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.setModel', async () => {
			const { model } = getConfig();
			const value = await vscode.window.showInputBox({
				prompt: 'Enter model identifier (e.g. openai/gpt-4o)',
				value: model,
				ignoreFocusOut: true,
			});
			if (value !== undefined) {
				await vscode.workspace
					.getConfiguration('mastercommit')
					.update('model', value, true);
				void vscode.window.showInformationMessage('MasterCommit: Model saved.');
			}
		}),
	);
}

export function deactivate(): void {}
