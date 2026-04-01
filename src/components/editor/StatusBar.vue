<template>
  <footer class="statusbar no-select">
    <div class="statusbar-left">
      <span class="statusbar-item" title="字数">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 3h8M2 6h6M2 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        {{ editorStore.wordCount }} 字
      </span>
      <span class="statusbar-item" title="字符数">
        {{ editorStore.charCount }} 字符
      </span>
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
  padding: 0 var(--space-4);
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.statusbar-item {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
</style>
