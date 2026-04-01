<template>
  <Milkdown />
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
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
import { imageBlockComponent, imageBlockConfig } from '@milkdown/kit/component/image-block'
import { listItemBlockComponent } from '@milkdown/kit/component/list-item-block'

// CodeMirror 语言包
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { convertFileSrc } from '@tauri-apps/api/core'

// 数学公式 (KaTeX)
import { math } from '@milkdown/plugin-math'
import 'katex/dist/katex.min.css'

import { useEditorStore } from '../../stores/editor'
import { useFileSystem } from '../../composables/useFileSystem'

const editorStore = useEditorStore()
const { triggerAutoSave } = useFileSystem()
const tabIdAtMount = editorStore.activeTabId
const initialContent = editorStore.content || ''

// 初始化时同步内容到 store
editorStore.updateContent(initialContent)

// 防止循环更新的标记
let isInternalUpdate = false
let mutationObserver: MutationObserver | null = null

function normalizeFsPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const windowsDriveMatch = normalized.match(/^([a-zA-Z]:)(\/.*)?$/)
  const prefix = windowsDriveMatch ? windowsDriveMatch[1] : (normalized.startsWith('/') ? '/' : '')
  const raw = windowsDriveMatch ? (windowsDriveMatch[2] || '') : normalized.replace(/^\/+/, '')
  const segments = raw.split('/').filter(Boolean)
  const stack: string[] = []

  for (const segment of segments) {
    if (segment === '.') continue
    if (segment === '..') {
      if (stack.length > 0) stack.pop()
      continue
    }
    stack.push(segment)
  }

  if (windowsDriveMatch) {
    return `${prefix}/${stack.join('/')}`
  }
  return `${prefix}${stack.join('/')}`
}

function toAssetUrl(path: string): string {
  return convertFileSrc(normalizeFsPath(path))
}

function resolveRelativeImagePath(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return src

  if (
    /^(https?:|data:|blob:|asset:|tauri:|file:)/i.test(trimmed) ||
    trimmed.startsWith('//')
  ) {
    return trimmed
  }

  const currentPath = editorStore.currentFilePath
  if (!currentPath) return trimmed

  const baseDir = currentPath.replace(/[\/\\][^\/\\]+$/, '')
  const isAbsolutePosix = trimmed.startsWith('/')
  const isAbsoluteWindows = /^[a-zA-Z]:[\\/]/.test(trimmed)

  if (isAbsoluteWindows || isAbsolutePosix) {
    return toAssetUrl(trimmed)
  }

  const normalizedBase = normalizeFsPath(baseDir)
  const normalizedRel = trimmed.replace(/\\/g, '/')
  return toAssetUrl(`${normalizedBase}/${normalizedRel}`)
}

function patchImageSrcForLocalMarkdown() {
  const images = document.querySelectorAll('.editor-root .ProseMirror img')
  images.forEach((img) => {
    const original = img.getAttribute('src') || ''
    if (!original) return
    const resolved = resolveRelativeImagePath(original)
    if (resolved !== original) {
      img.setAttribute('src', resolved)
    }
  })
}

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

      // 图片块配置：通过 proxyDomURL 在渲染层解析本地图片路径
      ctx.update(imageBlockConfig.key, (defaultCfg) => ({
        ...defaultCfg,
        proxyDomURL: (url: string) => resolveRelativeImagePath(url),
      }))

      // 监听 Markdown 内容变化
      ctx.get(listenerCtx)
        .markdownUpdated((_ctx, markdown) => {
          // 避免标签切换时旧编辑器实例把内容写回到新标签页。
          if (editorStore.activeTabId !== tabIdAtMount) return
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

// 监听外部内容变化（打开文件时）以及编辑器加载完成事件
watch([() => editorStore.content, loading], ([newContent, isLoading]) => {
  if (isInternalUpdate) return
  if (isLoading) return
  const editor = getInstance()
  if (editor) {
    editor.action(replaceAll(newContent))
    nextTick(() => patchImageSrcForLocalMarkdown())
  }
})

onMounted(() => {
  patchImageSrcForLocalMarkdown()
  const root = document.querySelector('.editor-root .ProseMirror')
  if (!root) return

  mutationObserver = new MutationObserver(() => {
    patchImageSrcForLocalMarkdown()
  })
  mutationObserver.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  })
})

onUnmounted(() => {
  mutationObserver?.disconnect()
  mutationObserver = null
})

</script>
