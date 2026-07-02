import * as vscode from 'vscode';

export function createStatusBar(): vscode.StatusBarItem {
	const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	bar.text = '$(loading~spin) MasterCommit: Generating...';
	return bar;
}

export function showGenerating(bar: vscode.StatusBarItem): void {
	bar.show();
}

export function hideGenerating(bar: vscode.StatusBarItem): void {
	bar.hide();
}
