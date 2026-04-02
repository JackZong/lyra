<template>
  <div class="app-layout">
    <button
      class="top-settings-btn"
      @click="settings.toggleSettingsModal()"
      title="设置 (Cmd+,)"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
    <button
      class="top-toggle-sidebar-btn"
      @click="settings.toggleSidebar()"
      :title="settings.sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
      </svg>
    </button>
    <div class="app-body">
      <Sidebar />
      <div
        v-if="settings.sidebarOpen"
        class="sidebar-resize-handle"
        @mousedown="startResize"
      ></div>
      <EditorView ref="editorViewRef" />
    </div>
    <ContextMenu />
    <OmniSearch />
    <SettingsDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import Sidebar from './components/sidebar/Sidebar.vue'
import EditorView from './components/editor/EditorView.vue'
import OmniSearch from './components/common/OmniSearch.vue'
import ContextMenu from './components/common/ContextMenu.vue'
import SettingsDialog from './components/common/SettingsDialog.vue'
import { useSettingsStore } from './stores/settings'
import { useFilesStore } from './stores/files'
import { useEditorStore } from './stores/editor'
import { useFileSystem } from './composables/useFileSystem'

// 初始化设置，应用主题
const settings = useSettingsStore()
settings.applyTheme()

const { openFile, saveFile, newFile, openFilePath } = useFileSystem()

const editorViewRef = ref<InstanceType<typeof EditorView> | null>(null)

// 恢复上次的工作区与标签页
const editorStore = useEditorStore()
const filesStore = useFilesStore()

const appWindow = getCurrentWindow()

watch(
  () => [editorStore.currentFileName, editorStore.isDirty] as const,
  ([name, dirty]) => {
    const suffix = dirty ? ' — 已编辑' : ''
    appWindow.setTitle(`${name}${suffix}`)
  },
  { immediate: true }
)

onMounted(async () => {
  // 使用 capture 阶段优先捕获全局快捷键，防止被编辑器(ProseMirror)底层阻止冒泡
  window.addEventListener('keydown', handleKeyDown, true)
  
  // 恢复状态
  await filesStore.restoreState()
  await editorStore.restoreState()
  
  // 对于重新加载进来的那些具备物理文件路径但未被修改缓存的 tab，主动去磁盘读取恢复 content
  if (editorStore.tabs.length > 0) {
    editorStore.tabs.forEach((tab) => {
      // 核心修复点：如果有非虚拟文件，且它为空、或者是包含了被意外覆盖的欢迎页片段，则强制触发硬盘重读，恢复干净的文本！
      const isCorrupted = typeof tab.content === 'string' && tab.content.includes('Lyra 是一款优雅的所见即所得 Markdown 编辑器')
      if (!tab.id.startsWith('new-') && tab.id !== 'lyra-welcome') {
        if (tab.content === '' || isCorrupted) {
          // 后台静默恢复 file content
          openFilePath(tab.id, { activate: false }).catch(() => {
             console.log(`后台恢复标签页 ${tab.id} 失败, 该文件可能已不存在`)
             editorStore.closeTab(tab.id)
          })
        }
      }
    })
  }
})

/**
 * 全局快捷键处理
 */
function handleKeyDown(e: KeyboardEvent) {
  const isMod = e.metaKey || e.ctrlKey
  const key = e.key.toLowerCase()

  if (isMod && key === 'o') {
    // Cmd/Ctrl + O：打开文件
    e.preventDefault()
    openFile()
  } else if (isMod && key === 'p') {
    // Cmd/Ctrl + P：全局搜索文件内容
    e.preventDefault()
    settings.toggleOmniSearch()
  } else if (isMod && e.key === ',') {
    // Cmd/Ctrl + ,：设置
    e.preventDefault()
    settings.toggleSettingsModal()
  } else if (isMod && key === 's') {
    // Cmd/Ctrl + S：保存文件
    e.preventDefault()
    saveFile()
  } else if (isMod && key === 'n') {
    // Cmd/Ctrl + N：新建文件
    e.preventDefault()
    newFile()
  } else if (isMod && key === 'f') {
    e.preventDefault()
    editorViewRef.value?.openFindBar()
  }
}


const isResizing = ref(false)

function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  const startX = e.clientX
  const startWidth = settings.sidebarWidth

  function onMouseMove(ev: MouseEvent) {
    const delta = ev.clientX - startX
    const newWidth = Math.min(Math.max(startWidth + delta, 140), 500)
    settings.sidebarWidth = newWidth
  }

  function onMouseUp() {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar-reopen-btn {
  position: absolute;
  top: 6px;
  left: 8px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  z-index: 30;
}

.sidebar-reopen-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.top-settings-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  z-index: 30;
}

.top-settings-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.sidebar-resize-handle {
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.15s ease;
  position: relative;
  z-index: 10;
  margin-left: -2px;
  margin-right: -2px;
}

.sidebar-resize-handle:hover,
.sidebar-resize-handle:active {
  background-color: var(--color-primary);
  opacity: 0.4;
}
</style>