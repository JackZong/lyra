import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { detectSystemLanguage, type LangCode } from '../i18n'

/** 可选的编辑区主题标识 */
export type EditorThemeName = 'github' | 'gothic' | 'newsprint' | 'night' | 'pixyll' | 'whitey'

/** 主题元数据，供 UI 展示 */
export interface ThemeMeta {
  id: EditorThemeName
  label: string
  description: string
  /** 色块预览：背景色 + 文字色 */
  preview: { bg: string; text: string; accent: string }
}

export const EDITOR_THEMES: ThemeMeta[] = [
  { id: 'github',    label: 'Github',    description: '干净素雅',   preview: { bg: '#ffffff', text: '#24292e', accent: '#0366d6' } },
  { id: 'gothic',    label: 'Gothic',    description: '衬线经典',   preview: { bg: '#faf8f5', text: '#3d3929', accent: '#8b4513' } },
  { id: 'newsprint', label: 'Newsprint', description: '报纸版面',   preview: { bg: '#f5f5f0', text: '#2c2c2c', accent: '#aa5500' } },
  { id: 'night',     label: 'Night',     description: '暗夜护眼',   preview: { bg: '#1e1e1e', text: '#c8c8c8', accent: '#6db3f2' } },
  { id: 'pixyll',    label: 'Pixyll',    description: '极简留白',   preview: { bg: '#ffffff', text: '#404040', accent: '#6699cc' } },
  { id: 'whitey',    label: 'Whitey',    description: '纯白灰调',   preview: { bg: '#ffffff', text: '#555555', accent: '#777777' } },
]

/**
 * 应用设置状态管理
 * 管理主题、字体大小等全局设置
 */
export const useSettingsStore = defineStore('settings', () => {
  // 主题模式: 'light' | 'dark' | 'system'
  const themeMode = ref<'light' | 'dark' | 'system'>('system')
  // 侧边栏是否展开
  const sidebarOpen = ref(true)
  // 侧边栏选项卡
  const sidebarTab = ref<'files' | 'outline'>('outline')
  // 全局搜索面板是否展开
  const omniSearchOpen = ref(false)
  // 设置聚合面板是否弹出
  const settingsModalOpen = ref(false)

  // 界面语言
  const language = ref<LangCode>(detectSystemLanguage())

  // 侧边栏宽度（像素），支持拖拽调整
  const sidebarWidth = ref(220)

  // -- 深度的编辑器视图调整参数 --
  const editorFontSize = ref(16)
  const editorFontFamily = ref('system-ui, -apple-system, sans-serif')
  const editorMaxWidth = ref(800) // 0 表示 100% 满宽铺开

  // 编辑区主题
  const editorTheme = ref<EditorThemeName>('github')

  // 初始化加载本地设定的配置
  function loadSettings() {
    try {
      const stored = localStorage.getItem('lyra:settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.themeMode) themeMode.value = parsed.themeMode
        if (parsed.sidebarOpen !== undefined) sidebarOpen.value = parsed.sidebarOpen
        if (parsed.sidebarTab !== undefined) sidebarTab.value = parsed.sidebarTab
        if (parsed.editorFontSize) editorFontSize.value = parsed.editorFontSize
        if (parsed.editorFontFamily) editorFontFamily.value = parsed.editorFontFamily
        if (parsed.editorMaxWidth !== undefined) editorMaxWidth.value = parsed.editorMaxWidth
        if (parsed.editorTheme) editorTheme.value = parsed.editorTheme
        if (parsed.sidebarWidth) sidebarWidth.value = parsed.sidebarWidth
        if (parsed.language) language.value = parsed.language
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
        sidebarTab: sidebarTab.value,
        editorFontSize: editorFontSize.value,
        editorFontFamily: editorFontFamily.value,
        editorMaxWidth: editorMaxWidth.value,
        editorTheme: editorTheme.value,
        sidebarWidth: sidebarWidth.value,
        language: language.value
      }))
    } catch (e) {
      console.warn('保存设置失败', e)
    }
  }

  // 挂载一个监听所有关键状态变化的机制
  watch(
    () => [themeMode.value, sidebarOpen.value, sidebarTab.value, editorFontSize.value, editorFontFamily.value, editorMaxWidth.value, editorTheme.value, sidebarWidth.value, language.value], 
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
    // 编辑区选择 Night 主题时，壳层 UI 也跟随暗色，避免出现“正文暗色 + 侧栏亮色”割裂。
    if (editorTheme.value === 'night') return 'dark'

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
    // 应用编辑区主题
    document.body.setAttribute('data-editor-theme', editorTheme.value)
    // 编辑器占位符国际化
    const placeholder = language.value === 'zh' ? '开始书写...' : 'Start writing...'
    document.documentElement.style.setProperty('--editor-placeholder', `'${placeholder}'`)
  }

  /**
   * 切换编辑区主题
   */
  function setEditorTheme(name: EditorThemeName) {
    editorTheme.value = name
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
   * 切换侧边栏选项卡
   */
  function setSidebarTab(tab: 'files' | 'outline') {
    sidebarTab.value = tab
    if (!sidebarOpen.value) {
      sidebarOpen.value = true
    }
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

  // 切换语言时更新原生菜单
  watch(language, async (newLang) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('update_menu_language', { lang: newLang })
    } catch {
      // 浏览器环境下忽略
    }
  })

  return {
    themeMode,
    sidebarOpen,
    sidebarWidth,
    sidebarTab,
    omniSearchOpen,
    settingsModalOpen,
    language,
    editorFontSize,
    editorFontFamily,
    editorMaxWidth,
    editorTheme,
    getEffectiveTheme,
    applyTheme,
    toggleTheme,
    toggleSidebar,
    setSidebarTab,
    toggleOmniSearch,
    toggleSettingsModal,
    setEditorTheme
  }
})
