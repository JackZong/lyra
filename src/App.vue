<template>
  <div class="app-layout">
    <div class="app-body">
      <Sidebar />
      <EditorView ref="editorViewRef" />
    </div>
    <ContextMenu />
    <OmniSearch />
    <SettingsDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
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
  }
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
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>