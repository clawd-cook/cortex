---
title: CI/CD workflow specification: Setup macOS Tauri
owner: clawd-cook
tags: [process, cicd, github-actions, tauri, rust, composite]
source: .github/actions/setup-macos-tauri/action.yml
---

## Workflow overview

**Purpose**: Shared macOS job setup: stable Rust with a target triple, Cargo registry and `src-tauri/target/` cache, optional prebuilt `cargo-tauri`.
**Trigger**: Composite action. Callers are pre-publish, publish, and warm-rust-cache.

## Inputs

| Name          | Required | Default | Meaning                                                         |
| ------------- | -------- | ------- | --------------------------------------------------------------- |
| `target`      | yes      |         | rustc triple, currently `aarch64-apple-darwin`                  |
| `save-cache`  | no       | `false` | Persist the Cargo cache. `true` only on the master-branch warmer |
| `install-cli` | no       | `true`  | Install `cargo-tauri`. `false` on the warmer                    |

## Requirements

| ID      | Requirement                                                         | Acceptance                                              |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| REQ-001 | Stable Rust plus the requested target                               | `rustc` can compile for `target`                        |
| REQ-002 | Cache workspace is `src-tauri -> src-tauri/target`                  | Differs from Poria root workspace                       |
| REQ-003 | Cache save only when `save-cache` is `true`                         | Tag builds restore but do not overwrite the master cache |
| REQ-004 | CLI pin is `2.11.4` prebuilt zip, not `cargo install tauri-cli`     | Cache key and download URL use that version             |

## Related

- Implementation: `.github/actions/setup-macos-tauri/action.yml`
