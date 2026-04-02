# Lyra

[English](./README.md) | 中文

Lyra 是一个基于 Tauri + Vue 3 + TypeScript 的 Markdown 编辑器，目标是提供接近 Typora 的本地写作体验。

### 特性

- 本地文件/文件夹工作区管理
- Markdown 所见即所得编辑（Milkdown）
- 多主题（含 Github / Night 等编辑主题）
- 自动保存与基础文件操作（新建、重命名、删除）
- 跨平台桌面应用（Tauri）

### 技术栈

- 前端：Vue 3、TypeScript、Pinia、Vite
- 编辑器：Milkdown（含 GFM、数学公式、代码块等扩展）
- 桌面端：Tauri（Rust）

### 开发环境

- Node.js 18+
- pnpm 8+
- Rust（stable）
- Tauri 依赖环境（参考 [Tauri 官方文档](https://tauri.app/start/prerequisites/)）

### 快速开始

```bash
pnpm install
pnpm tauri dev
```

### 常用命令

```bash
# 前端开发
pnpm dev

# 前端构建
pnpm build

# 桌面端开发（推荐）
pnpm tauri dev

# 桌面端打包
pnpm tauri build
```

### 项目结构

```text
src/            # Vue 前端代码
src-tauri/      # Tauri / Rust 后端代码
```

### 贡献

欢迎通过 Issue / Pull Request 参与改进：

1. Fork 本仓库
2. 新建功能分支
3. 提交修改并发起 PR

### 许可证

本项目采用 [MIT License](./LICENSE) 开源。
