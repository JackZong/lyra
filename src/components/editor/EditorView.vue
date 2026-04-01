<template>
  <div class="editor-view">
    <TabBar v-if="editorStore.tabs.length > 0" />
    <div class="editor-root scrollable" v-if="editorStore.activeTab">
      <MilkdownProvider>
        <MilkdownEditor />
      </MilkdownProvider>
    </div>
    <div v-else class="editor-empty">
      <p>没有打开的文件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MilkdownProvider } from '@milkdown/vue'
import MilkdownEditor from './MilkdownEditor.vue'
import TabBar from '../common/TabBar.vue'
import { useEditorStore } from '../../stores/editor'

const editorStore = useEditorStore()
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
