---
name: code-review
description: >-
  Reviews code for quality, security, and maintainability following team standards.
  Use when reviewing pull requests, examining code changes, or when the user asks for a code review.
license: MIT
compatibility: cursor, claude-code, windsurf
metadata:
  author: skill-library
  version: "1.0.0"
  category: development
  tags: [code-review, quality, security, pr]
  updated: "2026-06-23"
---

# Code Review

## When to Use

- User asks for a code review or PR feedback
- Reviewing staged changes before merge
- Security or quality audit of a module

## Instructions

When reviewing code:

1. Check correctness and edge cases
2. Verify security best practices
3. Assess readability and maintainability
4. Confirm tests cover the changes

## Review Checklist

- [ ] Logic is correct and handles edge cases
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] Code follows project style conventions
- [ ] Functions are appropriately sized and focused
- [ ] Error handling is comprehensive
- [ ] Tests cover the changes

## Providing Feedback

Format feedback as:

- **Critical**: Must fix before merge
- **Suggestion**: Consider improving
- **Nice to have**: Optional enhancement

## Examples

**Input:** New auth middleware without rate limiting

**Output:** Flag missing rate limiting as Critical; suggest token expiry validation as Suggestion.
