import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * 应用设置状态管理
 * 管理主题、字体大小等全局设置
 */
export const useSettingsStore = defineStore('settings', () => {
  // 主题模式: 'light' | 'dark' | 'system'
  const themeMode = ref<'light' | 'dark' | 'system'>('system')
  // 侧边栏是否展开
  const sidebarOpen = ref(true)
  // 大纲视图是否展开
  const outlineOpen = ref(false)
  // 全局搜索面板是否展开
  const omniSearchOpen = ref(false)
  // 设置聚合面板是否弹出
  const settingsModalOpen = ref(false)

  // -- 深度的编辑器视图调整参数 --
  const editorFontSize = ref(16)
  const editorFontFamily = ref('system-ui, -apple-system, sans-serif')
  const editorMaxWidth = ref(800) // 0 表示 100% 满宽铺开

  // 初始化加载本地设定的配置
  function loadSettings() {
    try {
      const stored = localStorage.getItem('lyra:settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.themeMode) themeMode.value = parsed.themeMode
        if (parsed.sidebarOpen !== undefined) sidebarOpen.value = parsed.sidebarOpen
        if (parsed.outlineOpen !== undefined) outlineOpen.value = parsed.outlineOpen
        if (parsed.editorFontSize) editorFontSize.value = parsed.editorFontSize
        if (parsed.editorFontFamily) editorFontFamily.value = parsed.editorFontFamily
        if (parsed.editorMaxWidth !== undefined) editorMaxWidth.value = parsed.editorMaxWidth
      }
    } catch (e) {
      console.warn('加载设置失败', e)
    }
  }

  // 持久化存储
  function saveSettings() {
    try {
      localStorage.setItem('lyra:settings', JSON.stringify({
        themeMode: themeMode.value,
        sidebarOpen: sidebarOpen.value,
        outlineOpen: outlineOpen.value,
        editorFontSize: editorFontSize.value,
        editorFontFamily: editorFontFamily.value,
        editorMaxWidth: editorMaxWidth.value 
      }))
    } catch (e) {
      console.warn('保存设置失败', e)
    }
  }

  // 挂载一个监听所有关键状态变化的机制
  watch(
    () => [themeMode.value, sidebarOpen.value, outlineOpen.value, editorFontSize.value, editorFontFamily.value, editorMaxWidth.value], 
    () => {
      saveSettings()
      applyTheme() // 重绘字体或环境变量
    },
    { deep: true }
  )

  /**
   * 获取实际生效的主题
   */
  function getEffectiveTheme(): 'light' | 'dark' {
    if (themeMode.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return themeMode.value
  }

  /**
   * 应用主题与尺寸参数到 DOM
   */
  function applyTheme() {
    const theme = getEffectiveTheme()
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('--editor-font-size', `${editorFontSize.value}px`)
    document.documentElement.style.setProperty('--editor-font-family', editorFontFamily.value)
    document.documentElement.style.setProperty('--editor-max-width', editorMaxWidth.value === 0 ? '100%' : `${editorMaxWidth.value}px`)
  }

  // 执行一次初始化加载
  loadSettings()

  /**
   * 切换主题
   */
  function toggleTheme() {
    const current = getEffectiveTheme()
    themeMode.value = current === 'light' ? 'dark' : 'light'
  }

  /**
   * 切换侧边栏
   */
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  /**
   * 切换大纲试图
   */
  function toggleOutline() {
    outlineOpen.value = !outlineOpen.value
  }

  /**
   * 切换全局搜索面板
   */
  function toggleOmniSearch() {
    omniSearchOpen.value = !omniSearchOpen.value
  }
  
  /**
   * 唤出设置弹窗
   */
  function toggleSettingsModal() {
    settingsModalOpen.value = !settingsModalOpen.value
  }

  // 监听主题变化
  watch(themeMode, () => {
    applyTheme()
  }, { immediate: true })

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme()
      }
    })
  }

  return {
    themeMode,
    sidebarOpen,
    outlineOpen,
    omniSearchOpen,
    settingsModalOpen,
    editorFontSize,
    editorFontFamily,
    editorMaxWidth,
    getEffectiveTheme,
    applyTheme,
    toggleTheme,
    toggleSidebar,
    toggleOutline,
    toggleOmniSearch,
    toggleSettingsModal
  }
})
