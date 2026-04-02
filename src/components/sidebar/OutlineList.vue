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
        placeholder="搜索标题..."
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
      <p>{{ outline.length === 0 ? '当前文档没有标题' : '没有匹配的标题' }}</p>
    </div>
    <div v-else class="outline-list">
      <div
        v-for="item in filteredOutline"
        :key="item.id"
        class="outline-item"
        :class="`level-${item.level}`"
        :style="{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }"
        @click="scrollToHeading(item.originalIndex)"
      >
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useEditorStore } from '../../stores/editor'

const editorStore = useEditorStore()
const searchQuery = ref('')
const showSearch = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

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

watch(
  () => editorStore.content,
  (newContent) => {
    if (!newContent) {
      outline.value = []
      return
    }

    const lines = newContent.split('\n')
    const newOutline: OutlineItem[] = []
    const headingRegex = /^(#{1,6})\s+(.+)$/

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(headingRegex)
      if (match) {
        newOutline.push({
          id: `heading-${newOutline.length}`,
          level: match[1].length,
          text: match[2].trim(),
          originalIndex: newOutline.length
        })
      }
    }

    outline.value = newOutline
  },
  { immediate: true }
)

function scrollToHeading(index: number) {
  const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')
  if (headings && headings.length > index) {
    const target = headings[index] as HTMLElement
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
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
  padding: 4px 0;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.outline-item {
  padding: 3px 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;
}

.outline-item:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-left-color: var(--color-border-strong);
}

.outline-item.level-1 {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-top: 3px;
}

.outline-item.level-2 {
  font-weight: 500;
}
</style>
