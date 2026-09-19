---
title: CI/CD workflow specification: Labeler
owner: clawd-cook
tags: [process, cicd, github-actions, labels]
source: .github/workflows/labeler.yml
---

## Workflow overview

**Purpose**: Keep repository labels defined in `.github/labels.yml`, and apply path labels to pull requests from `.github/labeler.yml`.
**Trigger**: Push to `master` of the label catalog or this workflow; pull request `opened`, `synchronize`, `reopened`.

## Jobs

| Job         | Purpose                                                    | When                |
| ----------- | ---------------------------------------------------------- | ------------------- |
| sync-labels | Create or update labels; do not delete extra labels        | `push` only         |
| label-pr    | Match changed files to labels; `sync-labels: true` on the PR | `pull_request` only |

## Requirements

| ID      | Requirement                                   | Acceptance                                 |
| ------- | --------------------------------------------- | ------------------------------------------ |
| REQ-001 | Catalog is source for name, color, description | Push to `master` updates GitHub labels    |
| REQ-002 | Do not delete labels missing from the catalog | `skip-delete: true`                        |
| REQ-003 | Path labels follow `.github/labeler.yml`      | `src/` → `frontend`, `src-tauri/` → `desktop` |
| REQ-004 | No Poria-only labels (`skills`, `channels`)   | Catalog matches this repo                  |

## Related

- Implementation: `.github/workflows/labeler.yml`, `.github/labels.yml`, `.github/labeler.yml`
