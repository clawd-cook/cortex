---
title: CI/CD workflow specification: CI
owner: clawd-cook
tags: [process, cicd, github-actions, frontend]
source: .github/workflows/ci.yml
---

## Workflow overview

**Purpose**: On pull requests and `master` pushes, typecheck and test the Vite/React frontend.
**Trigger**: `pull_request`; `push` to `master`.
**Target**: `ubuntu-latest`. Cortex has no Poria-style crate workspace; this job is the PR quality gate Poria does not need in the same form.

## Jobs

| Job      | Purpose                         | Runner         |
| -------- | ------------------------------- | -------------- |
| frontend | `tsc --noEmit` then `pnpm test` | ubuntu-latest  |

## Requirements

| ID      | Requirement                         | Acceptance                    |
| ------- | ----------------------------------- | ----------------------------- |
| REQ-001 | Frozen lockfile                     | `pnpm install --frozen-lockfile` |
| REQ-002 | Typecheck before tests              | `tsc --noEmit` must pass      |
| REQ-003 | Unit tests                          | `pnpm test` must pass         |
| REQ-004 | Pins                                | Node `24.20.0`, pnpm `11.23.0` |
| REQ-005 | Read-only contents                  | `permissions.contents: read`  |

## Related

- Implementation: `.github/workflows/ci.yml`
