# Research: SCM Commit Generator

**Feature**: `001-scm-commit-generator` | **Date**: 2026-07-02

## Decision 1: Staged Diff Reader

**Decision**: Use VS Code built-in `vscode.git` extension API
(`vscode.extensions.getExtension('vscode.git')`)

**Rationale**:
- No shell dependency or `child_process` escaping edge cases
- Workspace-aware: works correctly in remote/WSL/container environments
- `Repository.diff(true)` returns staged diff string; `Repository.state.indexChanges`
  returns staged file list — exactly what is needed
- `Repository.state.onDidChange` event drives button enable/disable without polling
- Available in all VS Code versions since 1.x (well-established API)

**Alternatives considered**:
- `child_process` + `git diff --cached`: fragile (git not always on PATH in remote
  environments, escaping issues, harder to scope to active workspace repo)
- `vscode.workspace.fs` reading `.git/index`: binary format, not viable

**Usage pattern**:
```ts
const ext = vscode.extensions.getExtension<GitExtension>('vscode.git');
const git = ext!.exports.getAPI(1);
const repo = git.repositories[0];  // active repo
const diff = await repo.diff(true); // true = staged only
const files = repo.state.indexChanges.map(c => c.uri.fsPath);
```

---

## Decision 2: HTTP Client for OpenRouter

**Decision**: Native `fetch` global (Node 18+, available in Node 24 extension host)
with `AbortController` for 30-second timeout

**Rationale**:
- Node 24 (project's `@types/node: 24.x`) includes stable `fetch` as a global
- Zero new production dependencies (YAGNI principle)
- `AbortSignal.timeout(30_000)` is available in Node 17.3+ — clean timeout API
- OpenRouter uses standard OpenAI-compatible JSON — no SDK needed

**Alternatives considered**:
- `node-fetch`: would add a production dependency with no benefit over native fetch
- `axios`: heavier, adds dependency, unnecessary
- `https` module: lower-level, more boilerplate than needed

**Usage pattern**:
```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30_000);
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  signal: controller.signal,
  headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages }),
});
clearTimeout(timeoutId);
```

---

## Decision 3: Button Enable/Disable Mechanism

**Decision**: VS Code context key (`setContext`) + `enablement` clause in
`package.json` menu contribution

**Rationale**:
- VS Code `scm/title` menu items support `enablement` property to disable (grey out)
  without hiding the button
- `vscode.commands.executeCommand('setContext', 'mastercommit.hasStagedFiles', bool)`
  sets a context variable that `enablement` clauses evaluate
- Subscribe to `Repository.state.onDidChange` to update the context key reactively
- This is the official VS Code pattern for dynamic menu item state

**Alternatives considered**:
- Hiding the button entirely (`when` clause): violates discoverability — user would
  not know the feature exists until they stage something
- Checking staged state at click time and showing error: poor UX, a disabled button
  is self-explanatory

**package.json pattern**:
```json
{
  "menus": {
    "scm/title": [{
      "command": "mastercommit.generateCommit",
      "when": "scmProvider == git",
      "enablement": "mastercommit.hasStagedFiles",
      "group": "navigation"
    }]
  }
}
```

---

## Decision 4: Status Bar for In-Progress State

**Decision**: `vscode.window.createStatusBarItem` with `$(loading~spin)` icon +
"MasterCommit: Generating..." text, shown only during AI request

**Rationale**:
- Native VS Code pattern for background operation feedback
- Zero Webview surface (YAGNI + constitution)
- `StatusBarItem.show()` / `.hide()` are trivial to lifecycle-manage

**Alternatives considered**:
- VS Code progress API (`withProgress`): more complex API, better suited for
  longer background tasks with cancellation UI — overkill for a 30s bounded request
- Notification toast: intrusive, interrupts focus; status bar is unobtrusive

---

## Decision 5: Conventional Commits Validation

**Decision**: Basic regex check on generated output; if non-conforming, write
raw response + show VS Code warning notification (per FR-016, clarification Q4)

**Rationale**:
- Full CC parser would add dependency (YAGNI)
- Simple type-prefix check (`/^(feat|fix|docs|...)(\(.+\))?!?:\s.+/`) covers
  the canonical cases
- Non-conforming output is still written (user can manually fix) + warning shown

**Regex**:
```ts
const CC_PATTERN = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;
```

---

## Decision 6: Extension Activation

**Decision**: `onCommand:mastercommit.generateCommit` + `onCommand:mastercommit.setApiKey`
+ `onCommand:mastercommit.setBaseUrl` + `onCommand:mastercommit.setModel`

**Rationale**:
- Constitution requires lazy activation (`onCommand:`) — no `*` activation event
- Git repository state subscription (for button enable/disable) is set up inside
  `activate()`, which fires on first command use
- This means button appears immediately (it's a menu contribution, always rendered),
  but state tracking starts only after first activation — acceptable for v1

**Note**: `mastercommit.hasStagedFiles` context key defaults to `false` until
the extension activates, so the button starts disabled, which is correct behavior.
