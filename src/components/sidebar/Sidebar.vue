<template>
  <aside
    class="sidebar scrollable"
    :class="{ 'sidebar-open': settings.sidebarOpen }"
    :style="settings.sidebarOpen ? { width: settings.sidebarWidth + 'px' } : undefined"
  >
    <div class="sidebar-header">
      <div class="header-left">
        <button
          class="header-icon-btn"
          @click="toggleSidebarTab(settings.sidebarTab === 'outline' ? 'files' : 'outline')"
          :title="settings.sidebarTab === 'outline' ? '切换到文件' : '切换到大纲'"
        >
          <svg v-if="settings.sidebarTab === 'outline'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
      </div>
      <span class="sidebar-title">{{ settings.sidebarTab === 'outline' ? '大纲' : '文件' }}</span>
      <div class="header-right">
        <button
          v-if="settings.sidebarTab === 'outline'"
          class="header-icon-btn"
          @click="toggleOutlineSearch"
          title="搜索标题"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
        <OutlineList ref="outlineListRef" />
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
      <span class="footer-label">文件</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useFilesStore } from '../../stores/files'
import { useFileSystem } from '../../composables/useFileSystem'
import FileTreeNode from './FileTreeNode.vue'
import OutlineList from './OutlineList.vue'

const settings = useSettingsStore()
const files = useFilesStore()
const { createNodeFile, createNodeDir, openFilePath } = useFileSystem()
const outlineListRef = ref<InstanceType<typeof OutlineList> | null>(null)

function toggleOutlineSearch() {
  if (outlineListRef.value?.showSearch) {
    outlineListRef.value.closeSearch()
  } else {
    outlineListRef.value?.openSearch()
  }
}

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
  background-color: var(--color-bg-sidebar, var(--color-bg-secondary));
  border-right: 1px solid var(--color-border-subtle);
  transition: width var(--transition-slow);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-open {
  width: 220px; /* fallback; actual width set via inline style */
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

.header-left,
.header-right {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s ease;
}

.sidebar:hover .header-icon-btn {
  opacity: 1;
}

.header-icon-btn:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.sidebar-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex: 1;
  text-align: center;
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
  font-size: 13px;
  color: var(--color-text-tertiary);
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
  height: 28px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.footer-btn {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s ease;
}

.footer-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.footer-label {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1;
}

/* Night 模式强制覆盖：保证左侧菜单为暗黑底色 */
[data-theme="dark"] .sidebar {
  background-color: #1a1d22;
  border-right-color: #2a2f36;
}

[data-theme="dark"] .sidebar-header {
  background-color: #1a1d22;
}

[data-theme="dark"] .sidebar-footer {
  background-color: #1a1d22;
  border-top-color: #2a2f36;
}
</style>
