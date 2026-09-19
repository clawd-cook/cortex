---
title: CI/CD workflow specification: Warm Rust cache
owner: clawd-cook
tags: [process, cicd, github-actions, rust, cache]
source: .github/workflows/warm-rust-cache.yml
---

## Workflow overview

**Purpose**: On `master`, compile the Apple Silicon release `cortex` crate so tag-only publish jobs can restore a Cargo target cache.
**Trigger**: Push to `master` when `src-tauri` or the macOS Tauri composite action changes; also `workflow_dispatch`.

## Requirements

| ID      | Requirement                                      | Acceptance                                                         |
| ------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| REQ-001 | Save Cargo cache                                 | Composite `save-cache: true`                                       |
| REQ-002 | Do not install Tauri CLI                         | Composite `install-cli: false`                                     |
| REQ-003 | Release-build crate `cortex` for aarch64         | `cargo build --manifest-path src-tauri/Cargo.toml -p cortex`       |
| REQ-004 | Default branch is `master`                       | Not Poria's `main`                                                 |
| REQ-005 | Read-only contents                               | `permissions.contents: read`                                       |

## Related

- Implementation: `.github/workflows/warm-rust-cache.yml`
- Consumers: [Pre-Publish](./spec-process-cicd-pre-publish.md), [Publish](./spec-process-cicd-publish.md)
