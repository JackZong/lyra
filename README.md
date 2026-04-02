# Lyra

[中文文档](./README.zh-CN.md) | English

<p align="center">
  <img src="./public/lyra-icon.svg" alt="Lyra Logo" width="120" />
</p>

Lyra is a Markdown editor built with Tauri + Vue 3 + TypeScript, aiming to provide a local writing experience similar to Typora.

### Features

- Local workspace management for files and folders
- WYSIWYG Markdown editing powered by Milkdown
- Multiple themes (including Github / Night editor themes)
- Auto-save and basic file operations (create, rename, delete)
- Cross-platform desktop app via Tauri

### Tech Stack

- Frontend: Vue 3, TypeScript, Pinia, Vite
- Editor: Milkdown (with GFM, math, code block extensions, etc.)
- Desktop: Tauri (Rust)

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust (stable)
- Tauri system dependencies (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

### Quick Start

```bash
pnpm install
pnpm tauri dev
```

### Common Commands

```bash
# Frontend development
pnpm dev

# Frontend build
pnpm build

# Desktop development (recommended)
pnpm tauri dev

# Desktop packaging
pnpm tauri build
```

### Project Structure

```text
src/            # Vue frontend code
src-tauri/      # Tauri / Rust backend code
```

### Contributing

Contributions are welcome via Issues and Pull Requests:

1. Fork this repository
2. Create a feature branch
3. Commit your changes and open a PR

### License

This project is licensed under the [MIT License](./LICENSE).
