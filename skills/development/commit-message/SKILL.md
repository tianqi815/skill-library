---
name: commit-message
description: >-
  Generates descriptive commit messages by analyzing git diffs following conventional commits.
  Use when the user asks for help writing commit messages or reviewing staged changes before commit.
license: MIT
compatibility: cursor, claude-code, windsurf
metadata:
  author: skill-library
  version: "1.0.0"
  category: development
  tags: [git, commit, conventional-commits]
  updated: "2026-06-23"
---

# Commit Message Helper

## When to Use

- User asks to write or improve a commit message
- Before committing staged changes
- After completing a feature or bugfix

## Instructions

1. Run `git diff --staged` (and `git status`) to understand changes
2. Identify change type: feat, fix, refactor, docs, test, chore
3. Write a subject line <= 72 chars in imperative mood
4. Add body explaining why (not what) when needed

## Format

```
<type>(<scope>): <subject>

<body - optional>
```

## Examples

**Example 1**

Input: Added JWT authentication middleware

Output:

```
feat(auth): implement JWT validation middleware

Add token parsing and expiry checks for protected API routes
```

**Example 2**

Input: Fixed timezone bug in reports

Output:

```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

## Rules

- Never commit secrets (.env, credentials)
- Focus on why, not file-by-file what
- One logical change per commit
