<template>
  <div v-if="visible" class="find-bar">
    <div class="find-input-wrapper">
      <svg class="find-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        class="find-input"
        placeholder="查找..."
        @input="onSearch"
        @keydown.enter.exact="findNext"
        @keydown.enter.shift="findPrev"
        @keydown.escape="close"
      />
      <span v-if="query" class="find-count">{{ matchIndex + 1 }} / {{ matchCount }}</span>
    </div>
    <button class="find-btn" @click="findPrev" title="上一个 (Shift+Enter)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
    <button class="find-btn" @click="findNext" title="下一个 (Enter)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    <button class="find-btn find-close" @click="close" title="关闭 (Esc)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

const visible = ref(false)
const query = ref('')
const matchCount = ref(0)
const matchIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

let highlights: Range[] = []
let currentIdx = -1

function getSearchRoot(): Element | null {
  return document.querySelector('.editor-root .ProseMirror')
}

function clearHighlights() {
  if (typeof CSS !== 'undefined' && CSS.highlights) {
    CSS.highlights.delete('find-highlight')
    CSS.highlights.delete('find-highlight-current')
  }
  highlights = []
  matchCount.value = 0
  matchIndex.value = 0
  currentIdx = -1
}

function collectMatches(root: Element, text: string): Range[] {
  if (!text) return []
  const lowerText = text.toLowerCase()
  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    const content = node.textContent || ''
    const lowerContent = content.toLowerCase()
    let startPos = 0
    let idx: number
    while ((idx = lowerContent.indexOf(lowerText, startPos)) !== -1) {
      const range = new Range()
      range.setStart(node, idx)
      range.setEnd(node, idx + text.length)
      ranges.push(range)
      startPos = idx + text.length
    }
  }
  return ranges
}

function applyHighlights() {
  if (!CSS.highlights) return
  if (highlights.length === 0) {
    CSS.highlights.delete('find-highlight')
    CSS.highlights.delete('find-highlight-current')
    return
  }
  const allHighlight = new Highlight(...highlights)
  CSS.highlights.set('find-highlight', allHighlight)
  if (currentIdx >= 0 && currentIdx < highlights.length) {
    const currentHighlight = new Highlight(highlights[currentIdx])
    CSS.highlights.set('find-highlight-current', currentHighlight)
  }
}

function scrollToCurrent() {
  if (currentIdx < 0 || currentIdx >= highlights.length) return
  const range = highlights[currentIdx]
  const rect = range.getBoundingClientRect()
  const container = document.querySelector('.editor-root')
  if (!container) return
  const containerRect = container.getBoundingClientRect()
  if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
    const el = range.startContainer.parentElement
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

function onSearch() {
  clearHighlights()
  const root = getSearchRoot()
  if (!root || !query.value) return
  highlights = collectMatches(root, query.value)
  matchCount.value = highlights.length
  if (highlights.length > 0) {
    currentIdx = 0
    matchIndex.value = 0
  }
  applyHighlights()
  scrollToCurrent()
}

function findNext() {
  if (highlights.length === 0) return
  currentIdx = (currentIdx + 1) % highlights.length
  matchIndex.value = currentIdx
  applyHighlights()
  scrollToCurrent()
}

function findPrev() {
  if (highlights.length === 0) return
  currentIdx = (currentIdx - 1 + highlights.length) % highlights.length
  matchIndex.value = currentIdx
  applyHighlights()
  scrollToCurrent()
}

function open() {
  visible.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
    if (query.value) onSearch()
  })
}

function close() {
  visible.value = false
  clearHighlights()
}

watch(visible, (v) => {
  if (!v) clearHighlights()
})

defineExpose({ open, close, visible })
</script>

<style>
::highlight(find-highlight) {
  background-color: rgba(255, 213, 0, 0.35);
}

::highlight(find-highlight-current) {
  background-color: rgba(255, 150, 0, 0.6);
  color: #000;
}
</style>

<style scoped>
.find-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-bg-elevated, #fff);
  border-bottom: 1px solid var(--color-border-subtle, #e5e7eb);
  flex-shrink: 0;
}

.find-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 320px;
  background: var(--color-bg-secondary, #f8f9fb);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  padding: 0 8px;
  height: 28px;
  gap: 6px;
  transition: border-color 0.15s ease;
}

.find-input-wrapper:focus-within {
  border-color: var(--color-primary, #6366f1);
}

.find-icon {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.find-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text-primary);
  font-family: inherit;
  min-width: 0;
}

.find-input::placeholder {
  color: var(--color-text-tertiary);
}

.find-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.find-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s ease;
}

.find-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}
</style>
