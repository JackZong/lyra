<template>
  <div v-if="settings.omniSearchOpen" class="omni-search-backdrop" @click="close">
    <div class="omni-search-container" @click.stop>
      <div class="omni-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          ref="inputRef"
          v-model="query" 
          placeholder="在工作区内搜索..." 
          @input="handleInput"
          @keydown="handleKeyDown"
          class="omni-input" 
        />
      </div>

      <div class="omni-results scrollable" v-if="results.length > 0 || isSearching || query.trim()">
        <div v-if="isSearching" class="omni-status">搜索中...</div>
        <div v-else-if="results.length === 0" class="omni-status empty-status">无匹配结果</div>
        <div 
          v-else 
          v-for="(item, index) in results" 
          :key="`${item.file_path}-${item.line_number}`"
          class="omni-result-item"
          :class="{ 'is-active': index === selectedIndex }"
          @click="selectResult(index)"
          @mouseenter="selectedIndex = index"
        >
          <div class="result-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; opacity: 0.7;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span class="file-name">{{ item.file_name }}</span>
            <span class="line-meta">行 {{ item.line_number }}</span>
          </div>
          <div class="result-snippet">{{ formatSnippet(item.snippet) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from '../../stores/settings'
import { useFilesStore } from '../../stores/files'
import { useFileSystem } from '../../composables/useFileSystem'

const settings = useSettingsStore()
const filesStore = useFilesStore()
const { openFilePath } = useFileSystem()

interface SearchResult {
  file_path: string
  file_name: string
  line_number: number
  snippet: string
}

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const results = ref<SearchResult[]>([])
const isSearching = ref(false)
const selectedIndex = ref(0)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 当蒙层打开时，聚焦输入框
watch(() => settings.omniSearchOpen, (isOpen) => {
  if (isOpen) {
    query.value = ''
    results.value = []
    selectedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function close() {
  settings.omniSearchOpen = false
}

function handleInput() {
  if (searchTimeout) clearTimeout(searchTimeout)

  const val = query.value.trim()
  if (!val) {
    results.value = []
    isSearching.value = false
    return
  }

  if (!filesStore.workspacePath) {
    return // 无工作区无法搜索
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const res = await invoke<SearchResult[]>('search_in_workspace', {
        path: filesStore.workspacePath,
        query: val
      })
      results.value = res
      selectedIndex.value = 0
    } catch (e) {
      console.error('搜索出错:', e)
      results.value = []
    } finally {
      isSearching.value = false
    }
  }, 300) // 防抖时间 300ms
}

function formatSnippet(snippet: string) {
  if (snippet.length > 80) {
    return snippet.substring(0, 80) + '...'
  }
  return snippet
}

async function selectResult(index: number) {
  const item = results.value[index]
  if (item) {
    close()
    await openFilePath(item.file_path)
    // 未来可扩展光标跳转到特地行
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < results.value.length - 1) {
      selectedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (results.value.length > 0) {
      selectResult(selectedIndex.value)
    }
  }
}
</script>

<style scoped>
.omni-search-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 12vh;
}

.omni-search-container {
  width: 90%;
  max-width: 600px;
  background-color: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.omni-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.search-icon {
  color: var(--color-text-tertiary);
  margin-right: 12px;
}

.omni-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  outline: none;
}

.omni-input::placeholder {
  color: var(--color-text-tertiary);
}

.omni-results {
  overflow-y: auto;
  padding: 8px 0;
}

.omni-status {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.empty-status {
  color: var(--color-text-tertiary);
}

.omni-result-item {
  padding: 12px 20px;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.omni-result-item.is-active,
.omni-result-item:hover {
  background-color: var(--color-bg-hover);
  border-left-color: var(--color-primary);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.file-name {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  flex: 1;
}

.line-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.result-snippet {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
