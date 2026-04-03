<template>
  <div class="file-tree-node">
    <!-- 当前节点行 -->
    <div 
      class="node-row" 
      :class="{ 'is-active': editorStore.activeTabId === node.path, 'is-dir': node.is_dir }"
      @click.stop="handleClick"
      @contextmenu.prevent="handleRightClick"
      :style="{ paddingLeft: `${depth * 10 + 6}px` }"
    >
      <!-- 文件夹展开/折叠图标 -->
      <div v-if="node.is_dir" class="chevron" :class="{ 'is-open': node.isOpen }">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
      <!-- 文件图标预留空间 -->
      <div v-else class="file-icon-placeholder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>

      <span class="node-name" :title="node.name">{{ node.name }}</span>
    </div>

    <!-- 递归子节点 -->
    <div v-if="node.is_dir && node.isOpen && node.children && node.children.length > 0" class="children-list">
      <FileTreeNode 
        v-for="child in node.children" 
        :key="child.path" 
        :node="child" 
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFilesStore, type FileNode } from '../../stores/files'
import { useEditorStore } from '../../stores/editor'
import { useFileSystem } from '../../composables/useFileSystem'
import { useContextMenu, type MenuItem } from '../../composables/useContextMenu'
import FileTreeNode from './FileTreeNode.vue'

const props = defineProps<{
  node: FileNode
  depth: number
}>()

const filesStore = useFilesStore()
const editorStore = useEditorStore()
const { openFilePath, createNodeFile, createNodeDir, deleteNode, renameNode } = useFileSystem()
const { openMenu } = useContextMenu()
import { useI18n } from '../../i18n'
const { t } = useI18n()

async function handleClick() {
  if (props.node.is_dir) {
    // 展开或收起目录
    filesStore.toggleDirectory(props.node)
  } else {
    // 打开文件
    await openFilePath(props.node.path)
  }
}

function handleRightClick(e: MouseEvent) {
  const isDir = props.node.is_dir
  const items: MenuItem[] = []

  if (isDir) {
    items.push({
      label: t.value.contextMenu.newMarkdownFile,
      action: async () => {
        const name = prompt(t.value.contextMenu.enterFileName, t.value.contextMenu.defaultFileName)
        if (!name) return
        const separator = props.node.path.includes('\\') ? '\\' : '/'
        const targetPath = `${props.node.path}${separator}${name}`
        try {
          await createNodeFile(targetPath)
          filesStore.loadWorkspace(filesStore.workspacePath!) // 刷新工作区
        } catch (err) {
          alert(err)
        }
      }
    })
    
    items.push({
      label: t.value.contextMenu.newFolder,
      action: async () => {
        const name = prompt(t.value.contextMenu.enterFolderName, t.value.contextMenu.defaultFolderName)
        if (!name) return
        const separator = props.node.path.includes('\\') ? '\\' : '/'
        const targetPath = `${props.node.path}${separator}${name}`
        try {
          await createNodeDir(targetPath)
          filesStore.loadWorkspace(filesStore.workspacePath!)
        } catch (err) {
          alert(err)
        }
      }
    })
  }

  items.push({
    label: t.value.contextMenu.rename,
    action: async () => {
      const newName = prompt(t.value.contextMenu.enterNewName, props.node.name)
      if (!newName || newName === props.node.name) return
      
      const separator = props.node.path.includes('\\') ? '\\' : '/'
      const parentParts = props.node.path.split(separator)
      parentParts.pop() // remove old name
      parentParts.push(newName)
      const targetPath = parentParts.join(separator)
      
      try {
        await renameNode(props.node.path, targetPath)
        filesStore.loadWorkspace(filesStore.workspacePath!)
        
        // 如果改的是当前正在编辑的文件，需要同步更新 tabs 的 ID
        if (editorStore.activeTabId === props.node.path) {
          editorStore.activeTabId = targetPath
        }
      } catch (err) {
        alert(err)
      }
    }
  })

  items.push({
    label: t.value.contextMenu.delete,
    danger: true,
    action: async () => {
      const confirmMsg = t.value.contextMenu.confirmDelete.replace('{name}', props.node.name)
      if (confirm(confirmMsg)) {
        try {
          await deleteNode(props.node.path)
          filesStore.loadWorkspace(filesStore.workspacePath!)
          // 若删除了当前文件需要强制关掉 tab
          editorStore.closeTab(props.node.path)
        } catch (err) {
          alert(err)
        }
      }
    }
  })

  openMenu(e, items)
}
</script>

<style scoped>
.node-row {
  display: flex;
  align-items: center;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 0;
  user-select: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  margin-bottom: 0;
  min-height: 20px;
}

.node-row:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.node-row.is-active {
  background-color: var(--color-bg-active);
  color: var(--color-text-primary);
}

.chevron {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 3px;
  transition: transform var(--transition-fast);
  color: var(--color-text-tertiary);
}

.chevron.is-open {
  transform: rotate(90deg);
}

.file-icon-placeholder {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 3px;
  opacity: 0.46;
}

.node-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.children-list {
  display: block;
}
</style>
