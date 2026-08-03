import * as vscode from 'vscode';
import { GitExtension, GitAPI, Repository, hasStagedFiles } from './staged-diff-reader/git-staged-reader';
import { createStatusBar } from './scm-ui/status-bar';
import { handleGenerateCommit } from './scm-ui/generate-button';
import { SettingsViewProvider } from './settings-ui/settings-view-provider';

export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'mastercommit.settingsView',
			new SettingsViewProvider(context.secrets),
		),
	);

	const gitExt = vscode.extensions.getExtension<GitExtension>('vscode.git');

	if (!gitExt) {
		vscode.window.showWarningMessage('MasterCommit: VS Code git extension not found.');
		return;
	}

	const git: GitAPI = gitExt.exports.getAPI(1);

	if (git.repositories.length === 0) {
		void vscode.commands.executeCommand('setContext', 'mastercommit.hasStagedFiles', false);
		context.subscriptions.push(
			vscode.commands.registerCommand('mastercommit.generateCommit', () => {
				void vscode.window.showWarningMessage('MasterCommit: No git repository found.');
			}),
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
}

export function deactivate(): void {}
