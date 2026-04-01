<template>
  <div class="tab-bar">
    <div 
      v-for="tab in editorStore.tabs" 
      :key="tab.id"
      class="tab"
      :class="{ active: editorStore.activeTabId === tab.id }"
      @click="editorStore.setActiveTab(tab.id)"
      @mousedown.middle="editorStore.closeTab(tab.id)"
      :title="tab.id"
    >
      <span class="tab-name">{{ tab.name }}</span>
      <!-- 未保存圆点指示器 -->
      <span v-if="editorStore.isTabDirty(tab.id)" class="dirty-dot"></span>
      <div class="close-btn" @click.stop="editorStore.closeTab(tab.id)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'
const editorStore = useEditorStore()
</script>

<style scoped>
.tab-bar {
  display: flex;
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-bar::-webkit-scrollbar {
  height: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
  background-color: var(--color-bg-tertiary);
  border-right: 1px solid var(--color-border);
  min-width: 120px;
  max-width: 200px;
  cursor: pointer;
  user-select: none;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  border-top: 2px solid transparent;
  transition: all var(--transition-fast);
}

.tab:hover {
  background-color: var(--color-bg-hover);
}

.tab.active {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-top-color: var(--color-primary);
}

.tab-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.dirty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-primary);
  flex-shrink: 0;
}

.close-btn {
  opacity: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.tab:hover .close-btn, .tab.active .close-btn {
  opacity: 0.5;
}

.close-btn:hover {
  opacity: 1 !important;
  background-color: var(--color-bg-active);
}
</style>
