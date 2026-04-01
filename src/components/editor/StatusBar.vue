<template>
  <footer class="statusbar no-select">
    <div class="statusbar-left">
      <span class="statusbar-item" title="字数">{{ editorStore.wordCount }} 字</span>
      <span class="statusbar-item" title="字符数">{{ editorStore.charCount }} 字符</span>
    </div>

    <div class="statusbar-right">
      <span class="statusbar-item">Markdown</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'

const editorStore = useEditorStore()
</script>

<style scoped>
.statusbar {
  height: var(--statusbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  background-color: #f7f7f7;
  border-top: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.statusbar-item {
  font-size: 10px;
  color: #989898;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
</style>
