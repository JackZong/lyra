/**
 * useFileSystem — 文件系统操作组合式函数
 * 封装 Tauri IPC 的文件操作，提供响应式文件管理能力
 */
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { useEditorStore } from '../stores/editor'

export function useFileSystem() {
  const editorStore = useEditorStore()

  /**
   * 兼容历史 Markdown 中的 HTML <img> 标签：
   * 将其转换为标准 Markdown 图片语法，便于 Milkdown 正常渲染。
   */
  function normalizeImageTags(markdown: string): string {
    return markdown.replace(/<img\b[^>]*>/gi, (tag) => {
      const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
      if (!srcMatch?.[1]) return tag

      const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)
      const src = srcMatch[1].replace(/\\/g, '/').trim()
      const alt = (altMatch?.[1] || 'image').replace(/\]/g, '\\]')
      return `![${alt}](${src})`
    })
  }

  /**
   * 自动防抖保存的定时器
   */
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 触发自动保存
   */
  function triggerAutoSave() {
    if (editorStore.currentFilePath && editorStore.isDirty) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      autoSaveTimer = setTimeout(() => {
        saveFile()
      }, 2000)
    }
  }

  /**
   * 打开文件对话框并读取 Markdown 文件
   */
  async function openFile() {
    try {
      const filePath = await open({
        title: '打开 Markdown 文件',
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
          { name: '文本文件', extensions: ['txt'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        multiple: false,
      })

      if (!filePath) return // 用户取消

      return await openFilePath(filePath as string)
    } catch (error) {
      console.error('打开文件失败:', error)
      throw error
    }
  }

  /**
   * 根据绝对路径直接打开文件 (用于侧边栏文件树)
   */
  async function openFilePath(path: string, options?: { activate?: boolean }) {
    try {
      editorStore.isLoading = true
      const rawContent = await invoke<string>('read_file', { path })
      const content = normalizeImageTags(rawContent)
      const fileName = path.split(/[\/\\]/).pop() || '未命名'
      editorStore.openTab(path, fileName, content, options?.activate ?? true)
      return path
    } catch (error) {
      console.error(`读取文件 ${path} 失败:`, error)
      throw error
    } finally {
      editorStore.isLoading = false
    }
  }

  /**
   * 保存当前文件
   * 如果没有文件路径，弹出另存为对话框
   */
  async function saveFile() {
    try {
      const filePath = editorStore.currentFilePath

      if (!filePath) {
        // 没有路径，使用"另存为"
        return await saveAs()
      }

      await invoke('write_file', {
        path: filePath,
        content: editorStore.content,
      })

      editorStore.markSaved()
      return filePath
    } catch (error) {
      console.error('保存文件失败:', error)
      throw error
    }
  }

  /**
   * 另存为对话框
   */
  async function saveAs(): Promise<string | null> {
    try {
      const filePath = await save({
        title: '保存 Markdown 文件',
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: '所有文件', extensions: ['*'] },
        ],
        defaultPath: editorStore.currentFileName.endsWith('.md')
          ? editorStore.currentFileName
          : '未命名.md',
      })

      if (!filePath) return null // 用户取消

      await invoke('write_file', {
        path: filePath,
        content: editorStore.content,
      })

      editorStore.setFileContent(filePath as string, editorStore.content)
      return filePath as string
    } catch (error) {
      console.error('另存为失败:', error)
      throw error
    }
  }

  /**
   * 新建文件
   */
  function newFile() {
    editorStore.newFile()
  }

  /**
   * 在文件树中创建一个物理空文件
   */
  async function createNodeFile(path: string) {
    try {
      await invoke('create_file', { path })
    } catch (e) {
      console.error('创建文件失败:', e)
      throw e
    }
  }

  /**
   * 在文件树中创建一个物理空文件夹
   */
  async function createNodeDir(path: string) {
    try {
      await invoke('create_dir', { path })
    } catch (e) {
      console.error('创建文件夹失败:', e)
      throw e
    }
  }

  /**
   * 在文件树中删除指定文件或文件夹
   */
  async function deleteNode(path: string) {
    try {
      await invoke('delete_node', { path })
    } catch (e) {
      console.error('删除节点失败:', e)
      throw e
    }
  }

  /**
   * 重命名文件或文件夹
   */
  async function renameNode(oldPath: string, newPath: string) {
    try {
      await invoke('rename_node', { oldPath, newPath })
    } catch (e) {
      console.error('重命名节点失败:', e)
      throw e
    }
  }

  return {
    openFile,
    openFilePath,
    saveFile,
    saveAs,
    newFile,
    createNodeFile,
    createNodeDir,
    deleteNode,
    renameNode,
    triggerAutoSave
  }
}
