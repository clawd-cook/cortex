# Cortex

本地优先的任务与月历。一件事只存一次：有日期就出现在日历上，没日期就待在清单里，今天该做的会汇到「今天」。

## 开发

```bash
pnpm install
pnpm dev          # 浏览器预览（localStorage）
pnpm test
pnpm tauri dev    # 桌面端（SQLite）
```

V1 对应 GitHub `#1`–`#15`：收集箱 / 今天 / 清单 / 标签 / 三栏详情 / 月历排期 / 快捷键与设置。

## CI / CD

GitHub Actions 对齐 [Poria](https://github.com/clawd-cook/poria) 的桌面发布链路，默认分支是 `master`。

| 工作流 | 触发 | 作用 |
| --- | --- | --- |
| `CI` | PR 与 `master` | 前端 `tsc` + `pnpm test` |
| `Warm Rust cache` | `src-tauri` 变更推到 `master` | 预热 Apple Silicon release 缓存 |
| `Pre-Publish (Beta)` | 标签 `vX.Y.Z-beta.N` | 打 Apple Silicon DMG 预发布 |
| `Publish (Stable)` | 标签 `vX.Y.Z` | 打正式 DMG 并标 latest |
| `Labeler` | PR / 标签目录变更 | 同步并打路径标签 |

发布示例：

```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

未配置 Apple 证书时使用 ad-hoc 签名；首次打开若提示已损坏，执行 `xattr -cr /Applications/Cortex.app`。规格在 `spec/spec-process-cicd-*.md`。
