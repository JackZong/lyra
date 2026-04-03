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
import { codeBlockComponent, codeBlockConfig } from '@milkdown/kit/component/code-block'
import { tableBlock } from '@milkdown/kit/component/table-block'
import { linkTooltipPlugin } from '@milkdown/kit/component/link-tooltip'
import { listItemBlockComponent } from '@milkdown/kit/component/list-item-block'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { convertFileSrc } from '@tauri-apps/api/core'
import { math } from '@milkdown/plugin-math'
import 'katex/dist/katex.min.css'

import { useEditorStore } from '../../stores/editor'
import { useFileSystem } from '../../composables/useFileSystem'

const editorStore = useEditorStore()
const { triggerAutoSave } = useFileSystem()
const tabIdAtMount = editorStore.activeTabId
const initialContent = editorStore.content || ''

editorStore.updateContent(initialContent)

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

  if (windowsDriveMatch) return `${prefix}/${stack.join('/')}`
  return `${prefix}${stack.join('/')}`
}

function toAssetUrl(path: string): string {
  return convertFileSrc(normalizeFsPath(path))
}

function decodeUriPathSafely(path: string): string {
  if (!path.includes('%')) return path
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function isLikelyRealAbsolutePosixPath(path: string): boolean {
  return /^\/(?:Users|Volumes|private|var|opt|home)\//.test(path)
}

function resolveRelativeImagePath(src: string): string {
  const trimmed = (src || '').trim()
  if (!trimmed) return src

  if (/^(https?:|data:|blob:|asset:|tauri:|file:)/i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed
  }

  const currentPath = editorStore.currentFilePath
  if (!currentPath) return trimmed

  const decoded = decodeUriPathSafely(trimmed)
  const baseDir = currentPath.replace(/[\/\\][^\/\\]+$/, '')
  const isAbsolutePosix = decoded.startsWith('/')
  const isAbsoluteWindows = /^[a-zA-Z]:[\\/]/.test(decoded)
  if (isAbsoluteWindows) return toAssetUrl(decoded)
  if (isAbsolutePosix) {
    // 兼容 Markdown 中常见的 "/images/xxx.png"（根相对）写法：
    // 优先按当前文档目录回退解析，只有明显是系统绝对路径时才按绝对路径处理。
    if (!isLikelyRealAbsolutePosixPath(decoded)) {
      const normalizedBase = normalizeFsPath(baseDir)
      return toAssetUrl(`${normalizedBase}/${decoded.replace(/^\/+/, '')}`)
    }
    return toAssetUrl(decoded)
  }

  const normalizedBase = normalizeFsPath(baseDir)
  const normalizedRel = decoded.replace(/\\/g, '/')
  return toAssetUrl(`${normalizedBase}/${normalizedRel}`)
}

function patchImageSrcForLocalMarkdown() {
  const images = document.querySelectorAll('.editor-root .ProseMirror img')
  images.forEach((img) => {
    const original = img.getAttribute('src') || ''
    if (!original) return
    try {
      const resolved = resolveRelativeImagePath(original)
      if (resolved !== original) img.setAttribute('src', resolved)
    } catch {
      // 忽略单张图片路径解析错误，避免影响整体渲染
    }
  })
}

useEditor((root) =>
  Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root)
      ctx.set(defaultValueCtx, initialContent)

      ctx.update(codeBlockConfig.key, (defaultCfg) => ({
        ...defaultCfg,
        languages,
        extensions: [oneDark, EditorView.lineWrapping],
        searchPlaceholder: '搜索语言...',
        noResultText: '未找到匹配语言',
        copyText: '复制',
      }))

      ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
        if (editorStore.activeTabId !== tabIdAtMount) return
        isInternalUpdate = true
        editorStore.updateContent(markdown)
        triggerAutoSave()
        setTimeout(() => { isInternalUpdate = false }, 0)
      })
    })
    .use(listener)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(indent)
    .use(trailing)
    .use(cursor)
    .use(codeBlockComponent)
    .use(tableBlock)
    .use(linkTooltipPlugin)
    .use(listItemBlockComponent)
    .use(math)
)

const [loading, getInstance] = useInstance()

watch([() => editorStore.content, loading], ([newContent, isLoading]) => {
  if (isInternalUpdate || isLoading) return
  const editor = getInstance()
  if (!editor) return
  editor.action(replaceAll(newContent))
  nextTick(() => patchImageSrcForLocalMarkdown())
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
    attributeFilter: ['src'],
  })
})

onUnmounted(() => {
  mutationObserver?.disconnect()
  mutationObserver = null
})
</script>
