<template>
  <div class="app-layout">
    <TitleBar />
    <div class="app-body">
      <Sidebar />
      <EditorView ref="editorViewRef" />
      <OutlineView />
    </div>
    <StatusBar />
    <ContextMenu />
    <OmniSearch />
    <SettingsDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TitleBar from './components/common/TitleBar.vue'
import Sidebar from './components/sidebar/Sidebar.vue'
import EditorView from './components/editor/EditorView.vue'
import OutlineView from './components/sidebar/OutlineView.vue'
import OmniSearch from './components/common/OmniSearch.vue'
import StatusBar from './components/editor/StatusBar.vue'
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

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 恢复状态
  await filesStore.restoreState()
  await editorStore.restoreState()
  
  // 对于重新加载进来的那些具备物理文件路径但未被修改缓存的 tab，主动去磁盘读取恢复 content
  if (editorStore.tabs.length > 0) {
    editorStore.tabs.forEach((tab) => {
      // 如果这不是新文件虚拟 id 并且 content 为空，则从磁盘拉回最新内容
      if (!tab.id.startsWith('new-') && tab.id !== 'lyra-welcome' && tab.content === '') {
        // 后台静默恢复 file content
        openFilePath(tab.id).catch(() => {
           console.log(`后台恢复标签页 ${tab.id} 失败, 该文件可能已不存在`)
           editorStore.closeTab(tab.id)
        })
      }
    })
  }
})

/**
 * 全局快捷键处理
 */
function handleKeyDown(e: KeyboardEvent) {
  const isMod = e.metaKey || e.ctrlKey

  if (isMod && e.key === 'o') {
    // Cmd/Ctrl + O：打开文件
    e.preventDefault()
    openFile()
  } else if (isMod && e.key === 'p') {
    // Cmd/Ctrl + P：全局搜索文件内容
    e.preventDefault()
    settings.toggleOmniSearch()
  } else if (isMod && e.key === ',') {
    // Cmd/Ctrl + ,：设置
    e.preventDefault()
    settings.toggleSettingsModal()
  } else if (isMod && e.key === 's') {
    // Cmd/Ctrl + S：保存文件
    e.preventDefault()
    saveFile()
  } else if (isMod && e.key === 'n') {
    // Cmd/Ctrl + N：新建文件
    e.preventDefault()
    newFile()
  }
}


onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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