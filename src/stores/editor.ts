import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface EditorTab {
  id: string // 文件绝对路径，"new-1" 之类的作为未命名的 id
  name: string
  content: string
  savedContent: string
}

/**
 * 编辑器状态管理
 * 管理多标签页状态
 */
export const useEditorStore = defineStore('editor', () => {
  // 标签页列表
  const tabs = ref<EditorTab[]>([])
  // 当前激活的标签页 ID (即路径)
  const activeTabId = ref<string | null>(null)
  // 是否正在执行系统 I/O 操作
  const isLoading = ref(false)
  
  // 监听标签页变化，将元数据落盘（以防内容过大，仅存放未保存文件的草稿信息，已保存的文件不存 content）
  watch(() => [tabs.value, activeTabId.value], () => {
    try {
      if (tabs.value.length === 1 && tabs.value[0].id === 'lyra-welcome' && tabs.value[0].content === tabs.value[0].savedContent) return

      const snapshot = tabs.value.map(t => ({
        id: t.id,
        name: t.name,
        content: t.id.startsWith('new-') || t.content !== t.savedContent ? t.content : '',
        savedContent: t.id.startsWith('new-') ? t.savedContent : ''
      }))
      localStorage.setItem('lyra:tabs', JSON.stringify({
        tabs: snapshot,
        activeTabId: activeTabId.value
      }))
    } catch(e) { /* ignore */ }
  }, { deep: true })

  // 获取当前活跃标签数据
  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value) || null)

  // 兼容老版本 API 暴露的计算属性
  const currentFilePath = computed(() => activeTab.value?.id.startsWith('new-') ? null : activeTab.value?.id || null)
  
  // 全局未命名文件计数器
  let newFileCounter = 0

  // 默认启动项：创建一个欢迎文档
  const defaultWelcomeContent = `# 欢迎使用 Lyra

Lyra 是一款优雅的所见即所得 Markdown 编辑器，现已支持工作区管理与多标签页编辑体制。

## 里程碑 3：最新功能
- 🎉 **侧边栏文件树**：真正面向工程与项目管理。
- 📑 **多标签页支持**：顺畅在多个上下文之间切换。
- 💾 **自动防抖保存**：无需不断按下 Command+S，只需专注创作。

开始你的写作之旅吧 ✨`

  function openWelcomeTab() {
    tabs.value.push({
      id: 'lyra-welcome',
      name: '欢迎.md',
      content: defaultWelcomeContent,
      savedContent: defaultWelcomeContent
    })
    activeTabId.value = 'lyra-welcome'
  }
  
  const content = computed({
    get: () => activeTab.value?.content || '',
    set: (val) => {
      if (activeTab.value) activeTab.value.content = val
    }
  })

  // 是否有未保存的更改
  const isDirty = computed(() => {
    if (!activeTab.value) return false
    return activeTab.value.content !== activeTab.value.savedContent
  })

  // 检查特定标签页是否有未保存的更改
  function isTabDirty(id: string) {
    const tab = tabs.value.find(t => t.id === id)
    if (!tab) return false
    return tab.content !== tab.savedContent
  }

  // 当前文件名
  const currentFileName = computed(() => activeTab.value?.name || '未命名')

  // 字数统计
  const wordCount = computed(() => {
    const text = content.value.trim()
    if (!text) return 0
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = text.replace(/[\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0).length
    return chineseChars + englishWords
  })

  // 字符数统计
  const charCount = computed(() => content.value.length)


  /**
   * 打开标签页
   */
  function openTab(id: string, name: string, fileContent: string, activate = true) {
    // 检查是否已存在
    const existing = tabs.value.find(t => t.id === id)
    if (existing) {
      // 文件存在时也要无条件接受本次读取结果（包括空字符串），否则空 Markdown 无法正确加载。
      if (fileContent !== undefined && fileContent !== null) {
        existing.content = fileContent
        // 从硬盘刚加载出来，一定是处于 saved 状态
        existing.savedContent = fileContent
      }
      if (activate) activeTabId.value = id
      return
    }

    tabs.value.push({
      id,
      name,
      content: fileContent,
      savedContent: fileContent
    })
    
    if (activate) activeTabId.value = id
  }

  /**
   * 关闭标签页
   */
  function closeTab(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index === -1) return

    // 如果要关闭的是当前标签，需要激活相邻的标签
    if (activeTabId.value === id) {
      if (tabs.value.length > 1) {
        // 如果不是最后一个，激活下一个；如果是最后一个，激活前一个
        const nextIndex = index === tabs.value.length - 1 ? index - 1 : index + 1
        activeTabId.value = tabs.value[nextIndex].id
      } else {
        // 关闭最后一个标签
        activeTabId.value = null
      }
    }

    tabs.value.splice(index, 1)
  }

  /**
   * 设置激活标签页
   */
  function setActiveTab(id: string) {
    if (tabs.value.some(t => t.id === id)) {
      activeTabId.value = id
    }
  }

  /**
   * 设置文件内容（兼容老接口，建议直接通过 openTab 加载持久数据）
   */
  function setFileContent(path: string, fileContent: string) {
    // 如果从另存为调用，代表修改当前 activeTab 的 ID 
    if (activeTab.value) {
      // 当前是未命名另存为
      if (activeTab.value.id.startsWith('new-')) {
         activeTab.value.id = path
         activeTab.value.name = path.split(/[\/\\]/).pop() || '未命名'
      }
      activeTab.value.content = fileContent
      activeTab.value.savedContent = fileContent
      activeTabId.value = path
    } else {
       openTab(path, path.split(/[\/\\]/).pop() || '未命名', fileContent)
    }
  }

  /**
   * 更新编辑器内容（每次编辑器变化时调用）
   */
  function updateContent(newContent: string) {
    if (activeTab.value) {
      activeTab.value.content = newContent
    }
  }

  /**
   * 标记内容已保存
   */
  function markSaved(id?: string) {
    const targetId = id || activeTabId.value
    const target = tabs.value.find(t => t.id === targetId)
    if (target) {
      target.savedContent = target.content
    }
  }

  /**
   * 新建文件
   */
  function newFile() {
    newFileCounter++
    openTab(`new-${newFileCounter}`, `无标题-${newFileCounter}`, '')
  }

  /**
   * 恢复历史标签页
   */
  async function restoreState() {
    const rawData = localStorage.getItem('lyra:tabs')
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData)
        if (Array.isArray(parsed.tabs)) {
          // 恢复标签页并做最小化字段校验，避免历史缓存结构不完整导致异常。
          const restoredTabs = parsed.tabs
            .filter((t: unknown): t is Partial<EditorTab> & { id: string } => {
              return !!t && typeof t === 'object' && typeof (t as { id?: unknown }).id === 'string'
            })
            .map((t: Partial<EditorTab> & { id: string }) => {
              const name = typeof t.name === 'string' && t.name.length > 0
                ? t.name
                : (t.id.split(/[\/\\]/).pop() || '未命名')
              const content = typeof t.content === 'string' ? t.content : ''
              const savedContent = typeof t.savedContent === 'string' ? t.savedContent : content
              return { id: t.id, name, content, savedContent }
            })

          tabs.value = restoredTabs
          activeTabId.value = typeof parsed.activeTabId === 'string' ? parsed.activeTabId : null
        }
      } catch (e) {
        console.error('解析本地标签历史失败:', e)
      }
    }

    if (tabs.value.length === 0) {
      openWelcomeTab()
      return
    }

    if (!activeTabId.value || !tabs.value.some(t => t.id === activeTabId.value)) {
      activeTabId.value = tabs.value[0].id
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    currentFilePath,
    content,
    isLoading,
    isDirty,
    isTabDirty,
    currentFileName,
    wordCount,
    charCount,
    setFileContent,
    updateContent,
    markSaved,
    newFile,
    openTab,
    closeTab,
    setActiveTab,
    restoreState
  }
})
