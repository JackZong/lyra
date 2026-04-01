<template>
  <aside class="sidebar scrollable" :class="{ 'sidebar-open': settings.sidebarOpen }">
    <div class="sidebar-header">
      <span class="sidebar-title">{{ settings.sidebarTab === 'outline' ? '大纲' : '文件' }}</span>
      <div class="sidebar-actions">
        <!-- 仅在“大纲模式”显示顶部切换按钮；文件模式更贴近 Typora 的底部工具栏 -->
        <template v-if="settings.sidebarTab === 'outline'">
          <button
            class="tab-btn"
            :class="{ active: settings.sidebarTab === 'files' }"
            @click="toggleSidebarTab('files')"
            title="文件视图"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button
            class="tab-btn"
            :class="{ active: settings.sidebarTab === 'outline' }"
            @click="toggleSidebarTab('outline')"
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
        </template>
        <button class="icon-btn" @click="files.openWorkspace()" v-if="settings.sidebarTab === 'files'" title="打开文件夹">
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
        <button class="primary-btn mt-2" @click="files.openWorkspace()">打开文件夹</button>
      </div>
      </template>

      <!-- 大纲视图 -->
      <template v-else-if="settings.sidebarTab === 'outline'">
        <OutlineList />
      </template>
    </div>

    <div v-if="settings.sidebarTab === 'files'" class="sidebar-footer">
      <button class="footer-btn" title="新建文件" @click="createQuickFile">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button class="footer-btn" title="新建文件夹" @click="createQuickFolder">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
      </button>
      <button class="footer-btn" title="打开文件夹" @click="files.openWorkspace()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <button class="footer-btn" title="切换到大纲" @click="toggleSidebarTab('outline')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      <span class="footer-label">文件</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useFilesStore } from '../../stores/files'
import { useFileSystem } from '../../composables/useFileSystem'
import FileTreeNode from './FileTreeNode.vue'
import OutlineList from './OutlineList.vue'

const settings = useSettingsStore()
const files = useFilesStore()
const { createNodeFile, createNodeDir, openFilePath } = useFileSystem()

const workspaceName = computed(() => {
  if (!files.workspacePath) return '项目'
  const parts = files.workspacePath.split(/[\/\\]/)
  return parts.pop() || '项目'
})

function toggleSidebarTab(tab: 'files' | 'outline') {
  if (settings.sidebarOpen && settings.sidebarTab === tab) {
    settings.toggleSidebar()
    return
  }
  settings.setSidebarTab(tab)
}

function buildUniqueName(base: string, ext = ''): string {
  const names = new Set(files.fileTree.map((node) => node.name))
  let index = 1
  let candidate = `${base}${ext}`
  while (names.has(candidate)) {
    candidate = `${base}-${index}${ext}`
    index += 1
  }
  return candidate
}

async function createQuickFile() {
  if (!files.workspacePath) {
    await files.openWorkspace()
    return
  }
  const fileName = buildUniqueName('untitled', '.md')
  const path = `${files.workspacePath.replace(/[\/\\]+$/, '')}/${fileName}`
  await createNodeFile(path)
  await files.loadWorkspace(files.workspacePath)
  const idx = files.fileTree.findIndex((n) => n.path === path)
  if (idx >= 0) {
    const [node] = files.fileTree.splice(idx, 1)
    files.fileTree.push(node)
  }
  // 创建后自动打开，确保可立即编辑
  await openFilePath(path)
}

async function createQuickFolder() {
  if (!files.workspacePath) {
    await files.openWorkspace()
    return
  }
  const folderName = buildUniqueName('untitled-folder')
  const path = `${files.workspacePath.replace(/[\/\\]+$/, '')}/${folderName}`
  await createNodeDir(path)
  await files.loadWorkspace(files.workspacePath)
  const idx = files.fileTree.findIndex((n) => n.path === path)
  if (idx >= 0) {
    const [node] = files.fileTree.splice(idx, 1)
    files.fileTree.push(node)
  }
}
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

.sidebar-footer {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  border-top: 1px solid var(--color-border-subtle);
  background: #efefef;
  flex-shrink: 0;
}

.footer-btn {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: #888;
}

.footer-btn:hover {
  color: #5f5f5f;
  background: rgba(0, 0, 0, 0.05);
}

.footer-label {
  margin-left: auto;
  font-size: 10px;
  color: #8a8a8a;
  line-height: 1;
}
</style>
