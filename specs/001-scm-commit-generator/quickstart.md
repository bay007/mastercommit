# Quickstart Validation Guide: SCM Commit Generator

**Feature**: `001-scm-commit-generator` | **Date**: 2026-07-02

## Prerequisites

- VS Code ^1.125.0 installed
- A git repository open in VS Code
- An OpenRouter account with a valid API key (or any OpenAI-compatible endpoint)
- pnpm installed

## Setup

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm run compile

# Open in VS Code Extension Development Host
# Press F5 in VS Code, or:
code --extensionDevelopmentPath=$(pwd) .
```

## Scenario 1: First-time Configuration (P2)

**Goal**: Verify all three configuration commands work and persist values.

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run `MasterCommit: Set Base URL` → enter `https://openrouter.ai/api/v1` → confirm
3. Run `MasterCommit: Set Model` → enter `openai/gpt-4o` (or any valid model) → confirm
4. Run `MasterCommit: Set API Key` → enter your OpenRouter API key → confirm

**Expected**:
- Base URL and model appear in `settings.json` under `mastercommit.baseUrl` and `mastercommit.model`
- API key is NOT visible in `settings.json` — only in SecretStorage
- No errors shown

---

## Scenario 2: Button State — No Staged Files (P1 + FR-002)

**Goal**: Verify button is disabled when nothing is staged.

1. Open the Source Control panel (`Ctrl+Shift+G`)
2. Ensure no files are staged (or unstage all files)
3. Look at the SCM title bar

**Expected**:
- Star button (`⭐`) is visible but greyed out (disabled)
- Clicking it does nothing

---

## Scenario 3: Button State — Files Staged (P1 + FR-002)

**Goal**: Verify button enables when a file is staged.

1. Modify any tracked file in the repository
2. Stage the file (`git add <file>` or via VS Code UI)
3. Look at the SCM title bar

**Expected**:
- Star button (`⭐`) becomes enabled (clickable) within 1 second of staging

---

## Scenario 4: Successful Commit Message Generation (P1 — golden path)

**Goal**: Verify full generation flow works end-to-end.

1. Stage one or more files
2. Ensure configuration is complete (Scenario 1)
3. Click the star button in the SCM title bar
4. Observe:

**Expected (in order)**:
- Star button immediately becomes disabled
- VS Code status bar shows `$(loading~spin) MasterCommit: Generating...`
- Within ~5–30 seconds: SCM commit input is populated with a message
- Status bar indicator disappears; button re-enables
- Generated message follows `<type>(<scope>): <description>` format in English

---

## Scenario 5: Missing Configuration Error (P3 + FR-005)

**Goal**: Verify error identifies missing config values.

1. Open `settings.json` and remove `mastercommit.model` (or leave it blank)
2. Clear API key by running `MasterCommit: Set API Key` and entering empty string
   (or remove via SecretStorage directly)
3. Click the star button

**Expected**:
- A VS Code error notification appears within 1 second
- Message names the missing values (e.g., "MasterCommit: Missing configuration: model, apiKey")
- Commit input is not modified

---

## Scenario 6: Timeout Error (FR-014)

**Goal**: Verify 30-second timeout surfaces correctly.

1. Set base URL to an unreachable endpoint (e.g., `http://localhost:9999/v1`)
2. Stage a file and click the star button
3. Wait

**Expected**:
- After 30 seconds: button re-enables, status bar clears
- VS Code error notification: "MasterCommit: Request timed out after 30 seconds."

---

## Scenario 7: Non-Conforming Response Warning (FR-016)

**Goal**: Verify warning shown when model output is not Conventional Commits format.

*(Requires a model that can be prompted to return free-form text, or mocking the
OpenRouter response in a dev build.)*

**Expected**:
- Raw response is written to commit input
- VS Code warning notification: "MasterCommit: Generated message may not follow Conventional Commits format."

---

## Validation Checklist

- [ ] All 3 configuration commands save values correctly
- [ ] API key absent from `settings.json`
- [ ] Button disabled with no staged files; enabled with staged files
- [ ] Star button and status bar reflect loading state during generation
- [ ] Generated message conforms to Conventional Commits v1.1 and is in English
- [ ] Missing config produces visible error naming specific missing values
- [ ] 30-second timeout produces visible error
- [ ] No scenario results in a silent failure
