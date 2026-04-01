<template>
  <aside class="sidebar scrollable" :class="{ 'sidebar-open': settings.sidebarOpen }">
    <div class="sidebar-header">
      <h3 class="sidebar-title">文件</h3>
      <button class="icon-btn" @click="() => files.openWorkspace()" title="打开工作区">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
      </button>
    </div>
    
    <div class="sidebar-content">
      <!-- 渲染文件树 -->
      <div v-if="files.fileTree.length > 0" class="file-tree-container">
        <div class="workspace-label">
           {{ workspaceName }}
        </div>
        <FileTreeNode 
          v-for="node in files.fileTree" 
          :key="node.path"
          :node="node"
          :depth="0"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="sidebar-empty">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="8" y="4" width="24" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M14 14h12M14 20h8M14 26h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <p>打开一个文件夹<br>以查看文件树</p>
        <button class="primary-btn mt-2" @click="() => files.openWorkspace()">打开文件夹</button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useFilesStore } from '../../stores/files'
import FileTreeNode from './FileTreeNode.vue'

const settings = useSettingsStore()
const files = useFilesStore()

const workspaceName = computed(() => {
  if (!files.workspacePath) return '项目'
  const parts = files.workspacePath.split(/[\/\\]/)
  return parts.pop() || '项目'
})
</script>

<style scoped>
.sidebar {
  width: 0;
  overflow: hidden;
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border-subtle);
  transition: width var(--transition-slow);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-open {
  width: var(--sidebar-width);
}

.sidebar-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) var(--space-2);
}

.file-tree-container {
  display: flex;
  flex-direction: column;
}

.workspace-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
  padding: 0 var(--space-2);
  letter-spacing: 0.5px;
}

.sidebar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--color-text-tertiary);
  text-align: center;
  gap: var(--space-3);
}

.sidebar-empty svg {
  opacity: 0.4;
}

.sidebar-empty p {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  margin: 0;
}

.primary-btn {
  margin-top: var(--space-2);
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background-color: var(--color-primary-dark);
}
</style>
