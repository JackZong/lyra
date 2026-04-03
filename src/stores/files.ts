import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

export interface FileNode {
  name: string
  path: string
  is_dir: boolean
  children?: FileNode[]
  isOpen?: boolean // 仅针对文件夹，是否处于展开状态
}

export const useFilesStore = defineStore('files', () => {
  // 当前打开的工作区根目录
  const workspacePath = ref<string | null>(null)
  
  // 工作区文件树
  const fileTree = ref<FileNode[]>([])
  
  // 是否正在加载文件树
  const isLoading = ref(false)

  /**
   * 打开文件夹对话框，选择工作区根目录
   */
  async function openWorkspace() {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '打开文件夹作为工作区',
      })

      if (selectedPath) {
        await loadWorkspace(selectedPath as string)
      }
    } catch (e) {
      console.error('打开工作区失败:', e)
    }
  }

  /**
   * 加载指定目录下的文件树
   */
  async function loadWorkspace(path: string) {
    try {
      isLoading.value = true
      workspacePath.value = path
      const nodes = await invoke<FileNode[]>('read_directory', { path })
      
      // 为目录初始化 isOpen 状态为 false
      const processNodes = (nList: FileNode[]) => {
        return nList.map(n => {
          if (n.is_dir) {
             n.isOpen = false
             n.children = []
          }
          return n
        })
      }
      
      fileTree.value = processNodes(nodes)
      
      // 不再保存至本地持久化，保证下次打开状态为全新
      // localStorage.setItem('lyra:workspace', path)
    } catch (e) {
      console.error('读取根目录失败:', e)
      fileTree.value = []
      // localStorage.removeItem('lyra:workspace')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 展开或折叠特定子目录
   * 采用懒加载，点击展开时才拉取子目录内容
   */
  async function toggleDirectory(node: FileNode) {
    if (!node.is_dir) return

    node.isOpen = !node.isOpen

    // 如果还没有加载过 children 并且现在要展开，则读取
    if (node.isOpen) {
      if (!node.children || node.children.length === 0) {
        try {
          const children = await invoke<FileNode[]>('read_directory', { path: node.path })
          // 同样初始化状态
          node.children = children.map(n => {
            if (n.is_dir) {
               n.isOpen = false
               n.children = []
            }
            return n
          })
        } catch (e) {
          console.error(`读取子目录 ${node.path} 失败:`, e)
        }
      }
    } else {
      // 关闭之后清除缓存，保证下次重新获取
      node.children = []
    }
  }

  /**
   * 从本地缓存恢复状态
   */
  async function restoreState() {
    // 移除原有从 localStorage 恢复的逻辑，确保每次打开没有默认数据
    /*
    const savedPath = localStorage.getItem('lyra:workspace')
    if (savedPath) {
      await loadWorkspace(savedPath)
    }
    */
  }

  return {
    workspacePath,
    fileTree,
    isLoading,
    openWorkspace,
    loadWorkspace,
    toggleDirectory,
    restoreState
  }
})
