---
title: CI/CD workflow specification: Pre-Publish (Beta)
owner: clawd-cook
tags: [process, cicd, github-actions, tauri, macos, release, beta]
source: .github/workflows/pre-publish.yml
---

## Workflow overview

**Purpose**: On a beta tag, build one Apple Silicon macOS DMG and publish it as a GitHub **pre-release**.
**Trigger**: Push of a tag matching `v*-beta*`.
**Target**: macOS `aarch64-apple-darwin` only.

Sibling: [Publish (Stable)](./spec-process-cicd-publish.md).

Adapted from Poria: product name **Cortex**, default branch **master**, Cargo project under `src-tauri/`, bundle dir `src-tauri/target/<triple>/release/bundle`.

## Jobs

| Job            | Purpose                                        | Depends on            | Runner        |
| -------------- | ---------------------------------------------- | --------------------- | ------------- |
| validate       | Accept only `vX.Y.Z-beta.N`                    | none                  | ubuntu-latest |
| build-macos    | Typecheck, bundle, sign or ad-hoc, package DMG | validate              | macos-latest  |
| create-release | Pre-release with DMG, SHA-256, install notes   | validate, build-macos | ubuntu-latest |

## Requirements

| ID      | Requirement                                  | Acceptance                                      |
| ------- | -------------------------------------------- | ----------------------------------------------- |
| REQ-001 | Tag is `vX.Y.Z-beta.N`                       | Reject other `v*-beta*` shapes                  |
| REQ-002 | One Apple Silicon DMG                        | Asset `Cortex-{VERSION}-aarch64.dmg`            |
| REQ-003 | Do not build Intel                           | Matrix has no `x86_64-apple-darwin`             |
| REQ-004 | Sync tag version into bundle metadata        | tauri.conf, Cargo.toml, package.json            |
| REQ-005 | GitHub pre-release                           | `--prerelease`; not latest                      |
| REQ-006 | Frontend typecheck before bundle             | Typecheck step passes                           |
| REQ-007 | Missing Apple certificate still yields a DMG | Ad-hoc sign; notes mention `xattr -cr`          |
| REQ-008 | DMG larger than 1 MB                         | Smaller file fails the build                    |

## Secrets (optional except `github.token`)

`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`.

## Related

- Implementation: `.github/workflows/pre-publish.yml`
- [Publish](./spec-process-cicd-publish.md), [Warm Rust cache](./spec-process-cicd-warm-rust-cache.md), [Setup macOS Tauri](./spec-process-cicd-setup-macos-tauri.md)
