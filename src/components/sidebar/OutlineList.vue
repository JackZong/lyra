<template>
  <div class="outline-content">
    <div v-if="showSearch" class="outline-search">
      <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        class="search-input"
        :placeholder="t.outline.searchPlaceholder"
        @keydown.escape="closeSearch"
      />
      <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div v-if="filteredOutline.length === 0" class="empty-state">
      <p>{{ outline.length === 0 ? t.outline.noHeadings : t.outline.noMatch }}</p>
    </div>
    <div v-else class="outline-list">
      <div
        v-for="item in filteredOutline"
        :key="item.id"
        class="outline-item"
        :class="[`level-${item.level}`, { active: activeIndex === item.originalIndex }]"
        :style="{ paddingLeft: `${(item.level - 1) * 14 + 14}px` }"
        @click="scrollToHeading(item.originalIndex)"
      >
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useI18n } from '../../i18n'

const editorStore = useEditorStore()
const { t } = useI18n()
const searchQuery = ref('')
const showSearch = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(-1)

function openSearch() {
  showSearch.value = true
  nextTick(() => searchInputRef.value?.focus())
}

function closeSearch() {
  searchQuery.value = ''
  showSearch.value = false
}

defineExpose({ openSearch, closeSearch, showSearch })

interface OutlineItem {
  id: string
  text: string
  level: number
  originalIndex: number
}

const outline = ref<OutlineItem[]>([])

const filteredOutline = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return outline.value
  return outline.value.filter(item => item.text.toLowerCase().includes(q))
})

// 直接从 ProseMirror 渲染的 DOM 中提取标题，避免 Markdown 序列化格式差异导致正则失配
const HEADING_SELECTOR = '.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6'

function extractOutlineFromDOM() {
  const headings = document.querySelectorAll(HEADING_SELECTOR)
  const newOutline: OutlineItem[] = []

  headings.forEach((el, i) => {
    const text = (el as HTMLElement).innerText?.trim()
    if (!text) return
    const level = parseInt(el.tagName[1], 10)
    newOutline.push({
      id: `heading-${i}`,
      level,
      text,
      originalIndex: newOutline.length
    })
  })

  outline.value = newOutline
}

// 防抖定时器，避免高频 DOM 变更时过度提取
let extractTimer: ReturnType<typeof setTimeout> | null = null

function scheduleExtract() {
  if (extractTimer) clearTimeout(extractTimer)
  extractTimer = setTimeout(extractOutlineFromDOM, 150)
}

// MutationObserver 监听编辑器 DOM 变化，实时更新大纲
let mutationObserver: MutationObserver | null = null

function startObserving() {
  stopObserving()

  const proseMirror = document.querySelector('.ProseMirror')
  if (!proseMirror) return

  mutationObserver = new MutationObserver(scheduleExtract)
  mutationObserver.observe(proseMirror, {
    childList: true,
    subtree: true,
    characterData: true
  })

  // 初始提取一次
  extractOutlineFromDOM()
}

function stopObserving() {
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
  if (extractTimer) {
    clearTimeout(extractTimer)
    extractTimer = null
  }
}

// 监听标签页切换：重新绑定 observer 并提取大纲
watch(
  () => editorStore.activeTabId,
  () => {
    // 给编辑器 DOM 一点时间完成渲染后再重新绑定
    nextTick(() => {
      setTimeout(startObserving, 200)
    })
  }
)

function scrollToHeading(index: number) {
  activeIndex.value = index
  const headings = document.querySelectorAll(HEADING_SELECTOR)
  if (headings && headings.length > index) {
    const target = headings[index] as HTMLElement
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function updateActiveHeading() {
  const container = document.querySelector('.editor-root')
  if (!container) return
  const headings = document.querySelectorAll(HEADING_SELECTOR)
  if (!headings.length) return
  const containerTop = container.getBoundingClientRect().top
  let current = -1
  for (let i = 0; i < headings.length; i++) {
    const rect = headings[i].getBoundingClientRect()
    if (rect.top - containerTop <= 20) {
      current = i
    } else {
      break
    }
  }
  activeIndex.value = current
}

let scrollEl: Element | null = null

onMounted(() => {
  scrollEl = document.querySelector('.editor-root')
  scrollEl?.addEventListener('scroll', updateActiveHeading, { passive: true })

  // 初始延迟启动 observer，等待编辑器 DOM 就绪
  setTimeout(startObserving, 500)
  updateActiveHeading()
})

onUnmounted(() => {
  scrollEl?.removeEventListener('scroll', updateActiveHeading)
  stopObserving()
})
</script>

<style scoped>
.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.outline-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 8px;
  padding: 0 8px;
  height: 28px;
  background: var(--color-bg-secondary, #f5f6f8);
  border: 1px solid var(--color-border-subtle, #e5e7eb);
  border-radius: 6px;
  flex-shrink: 0;
  transition: border-color 0.15s ease;
}

.outline-search:focus-within {
  border-color: var(--color-primary, #6366f1);
}

.search-icon {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: inherit;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-clear {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 3px;
  padding: 0;
}

.search-clear:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.outline-item {
  padding: 4px 14px;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background-color var(--transition-fast);
}

.outline-item:hover {
  background-color: var(--color-bg-hover);
}

.outline-item.active {
  font-weight: 600;
  color: #1a1a1a;
}
</style>
