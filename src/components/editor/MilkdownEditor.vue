<template>
  <Milkdown />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Milkdown, useEditor, useInstance } from '@milkdown/vue'
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { indent } from '@milkdown/kit/plugin/indent'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { cursor } from '@milkdown/kit/plugin/cursor'
import { replaceAll } from '@milkdown/kit/utils'

// 里程碑 2 新增：代码块高亮、表格组件、链接提示
import { codeBlockComponent, codeBlockConfig } from '@milkdown/kit/component/code-block'
import { tableBlock } from '@milkdown/kit/component/table-block'
import { linkTooltipPlugin } from '@milkdown/kit/component/link-tooltip'
import { imageBlockComponent } from '@milkdown/kit/component/image-block'
import { listItemBlockComponent } from '@milkdown/kit/component/list-item-block'

// CodeMirror 语言包
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'

// 数学公式 (KaTeX)
import { math } from '@milkdown/plugin-math'
import 'katex/dist/katex.min.css'

import { useEditorStore } from '../../stores/editor'
import { useFileSystem } from '../../composables/useFileSystem'

const editorStore = useEditorStore()
const { triggerAutoSave } = useFileSystem()

// 示例 Markdown 内容（展示里程碑 2 新特性）
const initialContent = editorStore.content || `# 欢迎使用 Lyra

Lyra 是一款优雅的所见即所得 Markdown 编辑器。

## 功能特性

- **所见即所得**：输入即渲染，沉浸式写作体验
- *斜体文字*、~~删除线~~、\`行内代码\`
- 支持 [链接](https://github.com) 和图片

## 代码块（语法高亮）

\`\`\`typescript
interface Editor {
  name: string
  version: number
  features: string[]
}

const lyra: Editor = {
  name: 'Lyra',
  version: 0.1,
  features: ['WYSIWYG', 'Markdown', '语法高亮']
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """生成斐波那契数列"""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[-1] + fib[-2])
    return fib

print(fibonacci(10))
\`\`\`

## 数学公式

行内公式：质能方程 $E = mc^2$ 是物理学中最著名的公式。

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n
$$

## 引用

> 好的工具应该是隐形的，让你专注于真正重要的事 — 写作本身。

## 表格

| 功能 | 状态 | 里程碑 |
|------|------|--------|
| 基础 Markdown | ✅ 已完成 | M1 |
| 代码语法高亮 | ✅ 已完成 | M2 |
| 数学公式 | ✅ 已完成 | M2 |
| 表格增强 | ✅ 已完成 | M2 |

## 任务列表

- [x] 搭建项目框架
- [x] 集成 Milkdown 编辑器
- [x] 代码块语法高亮
- [x] 数学公式支持
- [ ] 文件树管理
- [ ] 导出 PDF

---

开始你的写作之旅吧 ✨
`

// 初始化时同步内容到 store
editorStore.updateContent(initialContent)

// 防止循环更新的标记
let isInternalUpdate = false

useEditor((root) =>
  Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, initialContent)

      // 代码块配置：语言列表 + 主题
      ctx.update(codeBlockConfig.key, (defaultCfg) => ({
        ...defaultCfg,
        languages,
        extensions: [oneDark],
        // 中文化配置
        searchPlaceholder: '搜索语言...',
        noResultText: '未找到匹配语言',
        copyText: '复制',
      }))

      // 监听 Markdown 内容变化
      ctx.get(listenerCtx)
        .markdownUpdated((_ctx, markdown) => {
          isInternalUpdate = true
          editorStore.updateContent(markdown)
          
          // 触发自动保存
          triggerAutoSave()

          setTimeout(() => { isInternalUpdate = false }, 0)
        })
    })
    // 核心插件（listener 必须在 preset 之前）
    .use(listener)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(indent)
    .use(trailing)
    .use(cursor)
    // 里程碑 2 增强组件
    .use(codeBlockComponent)
    .use(tableBlock)
    .use(linkTooltipPlugin)
    .use(imageBlockComponent)
    .use(listItemBlockComponent)
    // 数学公式
    .use(math)
)

// 编辑器实例引用
const [loading, getInstance] = useInstance()

// 监听外部内容变化（打开文件时）
watch(() => editorStore.content, (newContent) => {
  if (isInternalUpdate) return
  if (loading.value) return
  const editor = getInstance()
  if (editor) editor.action(replaceAll(newContent))
})
</script>
