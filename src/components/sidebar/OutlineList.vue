<template>
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '../../stores/editor'

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
  padding: 4px 0;
  height: 100%;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.outline-item {
  padding: 3px 10px;
  font-size: 12px;
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
