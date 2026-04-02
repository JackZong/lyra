<template>
  <div class="editor-view">
    <div class="editor-root scrollable" v-if="editorStore.activeTab">
      <MilkdownProvider>
        <MilkdownEditor :key="editorStore.activeTab.id" />
      </MilkdownProvider>
    </div>
    <div v-else class="editor-empty">
      <p>没有打开的文件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { MilkdownProvider } from '@milkdown/vue'
import MilkdownEditor from './MilkdownEditor.vue'
import { useEditorStore } from '../../stores/editor'
import { useFileSystem } from '../../composables/useFileSystem'

const editorStore = useEditorStore()
const { openFilePath } = useFileSystem()

watch(
  () => editorStore.activeTabId,
  async () => {
    const tab = editorStore.activeTab
    if (!tab) return
    if (tab.id.startsWith('new-') || tab.id === 'lyra-welcome') return
    if (tab.content !== '') return
    try {
      await openFilePath(tab.id, { activate: false })
    } catch {
      // ignore reload failures, keep editor stable
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.editor-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100vh;
}

.editor-root {
  flex: 1;
  overflow-y: auto;
}

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-lg);
}
</style>
