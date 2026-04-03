// 国际化核心模块
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import zh from './zh'
import en from './en'

export type LangCode = 'zh' | 'en'

const messages: Record<LangCode, typeof zh> = { zh, en }

/**
 * 检测系统语言，非中文时返回英文
 */
export function detectSystemLanguage(): LangCode {
  const lang = navigator.language || ''
  return lang.startsWith('zh') ? 'zh' : 'en'
}

/**
 * 组合式函数：获取当前语言的翻译文本
 */
export function useI18n() {
  const settings = useSettingsStore()

  const t = computed(() => messages[settings.language])

  return { t }
}
