<template>
  <aside class="sidebar scrollable" :class="{ 'sidebar-open': settings.sidebarOpen }">
    <div class="sidebar-header">
      <span class="sidebar-title">{{ settings.sidebarTab === 'outline' ? '大纲' : '文件' }}</span>
      <div class="sidebar-actions">
        <button
          class="tab-btn"
          :class="{ active: settings.sidebarTab === 'files' }"
          @click="settings.setSidebarTab('files')"
          title="文件视图"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        <button
          class="tab-btn"
          :class="{ active: settings.sidebarTab === 'outline' }"
          @click="settings.setSidebarTab('outline')"
          title="大纲视图"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
        <button class="icon-btn" @click="() => files.openWorkspace()" v-if="settings.sidebarTab === 'files'" title="打开文件夹">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="sidebar-content" :class="{ 'sidebar-content-outline': settings.sidebarTab === 'outline' }">
      <!-- 文件树视图 -->
      <template v-if="settings.sidebarTab === 'files'">
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
      </template>

      <!-- 大纲视图 -->
      <template v-else-if="settings.sidebarTab === 'outline'">
        <OutlineList />
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useFilesStore } from '../../stores/files'
import FileTreeNode from './FileTreeNode.vue'
import OutlineList from './OutlineList.vue'

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
  background-color: #f3f3f3;
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
  padding: 0 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 34px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 500;
  color: #6f6f6f;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-btn,
.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8f8f8f;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.tab-btn:hover,
.icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
  color: #4f4f4f;
}

.tab-btn.active {
  color: #4f4f4f;
  background-color: rgba(0, 0, 0, 0.05);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.sidebar-content-outline {
  padding: 0;
}

.file-tree-container {
  display: flex;
  flex-direction: column;
}

.workspace-label {
  font-size: 11px;
  color: #939393;
  font-weight: 500;
  margin: 2px 8px 4px;
  padding: 0;
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
