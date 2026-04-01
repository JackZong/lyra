<template>
  <aside class="outline-view scrollable" :class="{ 'outline-open': settings.outlineOpen }">
    <div class="outline-header">
      <h3 class="outline-title">大纲</h3>
      <button class="icon-btn" @click="settings.toggleOutline" title="关闭大纲">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="outline-content">
      <div v-if="outline.length === 0" class="empty-state">
        <p>当前文档没有标题</p>
      </div>
      <div v-else class="outline-list">
        <div 
          v-for="(item, index) in outline" 
          :key="item.id"
          class="outline-item"
          :class="`level-${item.level}`"
          :style="{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }"
          @click="scrollToHeading(index)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useEditorStore } from '../../stores/editor'

const settings = useSettingsStore()
const editorStore = useEditorStore()

interface OutlineItem {
  id: string
  text: string
  level: number
}

const outline = ref<OutlineItem[]>([])

watch(
  () => editorStore.content,
  (newContent) => {
    if (!newContent) {
      outline.value = []
      return
    }
    
    const lines = newContent.split('\n')
    const newOutline: OutlineItem[] = []
    
    // 正则提取 markdown heading 例如 "## 标题"
    const headingRegex = /^(#{1,6})\s+(.+)$/
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(headingRegex)
      if (match) {
        newOutline.push({
          id: `heading-${newOutline.length}`,
          level: match[1].length,
          text: match[2].trim()
        })
      }
    }
    
    outline.value = newOutline
  },
  { immediate: true }
)

/**
 * 依托顺序匹配寻找真实的 DOM 节点并且滚动
 */
function scrollToHeading(index: number) {
  // ProseMirror 内部会把标题渲染为 h1~h6
  const headings = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6')
  if (headings && headings.length > index) {
    const target = headings[index] as HTMLElement
    // 滚动至目标，并保留上方一点边距
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
.outline-view {
  width: 260px;
  background-color: var(--color-bg-sidebar);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  height: 100%;
}

.outline-view:not(.outline-open) {
  width: 0;
  border-left: none;
  transform: translateX(20px);
}

.outline-header {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
}

.outline-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.outline-item {
  padding: 6px 16px;
  font-size: var(--text-sm);
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
  border-left-color: var(--color-primary);
}

.outline-item.level-1 {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-top: 4px;
}

.outline-item.level-2 {
  font-weight: 500;
}
</style>
