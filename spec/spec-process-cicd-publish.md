---
title: CI/CD workflow specification: Publish (Stable)
owner: clawd-cook
tags: [process, cicd, github-actions, tauri, macos, release, stable]
source: .github/workflows/publish.yml
---

## Workflow overview

**Purpose**: On a stable version tag, build one Apple Silicon macOS DMG and publish it as the GitHub **latest** release.
**Trigger**: Push of `v*.*.*` excluding `v*-beta*`, `v*-rc*`, `v*-alpha*`.

Sibling: [Pre-Publish (Beta)](./spec-process-cicd-pre-publish.md).

## Jobs

| Job            | Purpose                                        | Depends on            | Runner        |
| -------------- | ---------------------------------------------- | --------------------- | ------------- |
| validate       | Accept only `vX.Y.Z`                           | none                  | ubuntu-latest |
| build-macos    | Typecheck, bundle, sign or ad-hoc, package DMG | validate              | macos-latest  |
| create-release | Latest release with DMG and SHA-256            | validate, build-macos | ubuntu-latest |

## Requirements

| ID      | Requirement                                  | Acceptance                           |
| ------- | -------------------------------------------- | ------------------------------------ |
| REQ-001 | Tag is exact `vX.Y.Z`                        | Reject prerelease suffixes           |
| REQ-002 | Trigger excludes beta, rc, alpha             | Those tags never start this workflow |
| REQ-003 | Asset `Cortex-{VERSION}-aarch64.dmg`         | One Apple Silicon DMG                |
| REQ-004 | GitHub latest, not prerelease                | `--latest`                           |
| REQ-005 | Missing Apple certificate still yields a DMG | Ad-hoc; notes mention `xattr -cr`    |

## Related

- Implementation: `.github/workflows/publish.yml`
- [Pre-Publish](./spec-process-cicd-pre-publish.md)
