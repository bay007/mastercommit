import * as vscode from 'vscode';
import { GitExtension, GitAPI, Repository, hasStagedFiles, getStagedDiff } from './staged-diff-reader/git-staged-reader';
import { createStatusBar } from './scm-ui/status-bar';
import { handleGenerateCommit } from './scm-ui/generate-button';
import { SettingsViewProvider } from './settings-ui/settings-view-provider';
import { getConfig, getProfiles, applyProfile } from './shared/config';
import { getLastRequest } from './shared/request-log';
import { verifyEndpoint } from './provider-diagnostics/verify-endpoint';
import { buildMessages } from './commit-generation/prompt-builder';
import { estimateTokens } from './shared/token-estimate';

async function openJsonPreview(content: unknown): Promise<void> {
	const doc = await vscode.workspace.openTextDocument({
		content: JSON.stringify(content, null, 2),
		language: 'json',
	});
	await vscode.window.showTextDocument(doc, { preview: true });
}

function registerDiagnosticCommands(context: vscode.ExtensionContext, repo: Repository | undefined): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.showLastRequest', async () => {
			const last = getLastRequest();
			if (!last) {
				vscode.window.showInformationMessage('MasterCommit: no request has been sent yet.');
				return;
			}
			await openJsonPreview(last);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.verifyProviderEndpoint', async () => {
			const { baseUrl } = getConfig();
			const result = await verifyEndpoint(baseUrl);
			if (result.ok && result.isHttps) {
				vscode.window.showInformationMessage(`MasterCommit: ${result.message}`);
			} else {
				vscode.window.showWarningMessage(`MasterCommit: ${result.message}`);
			}
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.switchProfile', async () => {
			const profiles = getProfiles();
			if (profiles.length === 0) {
				vscode.window.showInformationMessage(
					'MasterCommit: no profiles configured. Add entries to "mastercommit.profiles" in settings.json.',
				);
				return;
			}
			const picked = await vscode.window.showQuickPick(
				profiles.map(p => ({ label: p.label, description: `${p.provider} · ${p.model}`, profile: p })),
				{ placeHolder: 'Select a MasterCommit profile' },
			);
			if (!picked) {
				return;
			}
			await applyProfile(picked.profile);
			vscode.window.showInformationMessage(`MasterCommit: switched to profile "${picked.profile.label}".`);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('mastercommit.previewRequest', async () => {
			if (!repo) {
				vscode.window.showWarningMessage('MasterCommit: no git repository found.');
				return;
			}
			const { provider, baseUrl, model, upstreamProvider } = getConfig();
			const diff = await getStagedDiff(repo);
			const messages = await buildMessages(diff);
			await openJsonPreview({
				provider,
				baseUrl,
				model,
				upstreamProvider: upstreamProvider || undefined,
				estimatedTokens: estimateTokens(messages),
				messages,
			});
		}),
	);
}

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
		registerDiagnosticCommands(context, undefined);
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
		registerDiagnosticCommands(context, undefined);
		return;
	}

	const repo: Repository = git.repositories[0];
	registerDiagnosticCommands(context, repo);
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
