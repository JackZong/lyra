<template>
  <header class="titlebar no-select" data-tauri-drag-region>
    <div class="titlebar-left">
      <!-- 侧边栏切换按钮 -->
      <button class="icon-btn" id="toggle-sidebar" @click="settings.toggleSidebar" title="切换侧边栏">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <div class="titlebar-center" data-tauri-drag-region>
      <span class="titlebar-filename">
        {{ editorStore.currentFileName }}
        <span v-if="editorStore.isDirty" class="dirty-indicator" title="有未保存的更改">●</span>
      </span>
    </div>

    <div class="titlebar-right">
      <!-- 搜索切换 -->
      <button class="icon-btn" id="toggle-search" @click="settings.toggleOmniSearch" title="全局搜索 (Cmd+P)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <!-- 设置弹窗 -->
      <button class="icon-btn" id="toggle-settings" @click="settings.toggleSettingsModal" title="设置 (Cmd+,)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      <!-- 大纲切换 -->
      <button class="icon-btn" id="toggle-outline" @click="settings.toggleOutline" title="大纲目录" :class="{'is-active': settings.outlineOpen}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      
      <!-- 主题切换 -->
      <button class="icon-btn" id="toggle-theme" @click="settings.toggleTheme" title="切换主题">
        <svg v-if="settings.getEffectiveTheme() === 'light'" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.36 10.03A6 6 0 015.97 2.64 6 6 0 1013.36 10.03z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'
import { useSettingsStore } from '../../stores/settings'

const editorStore = useEditorStore()
const settings = useSettingsStore()
</script>

<style scoped>
.titlebar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-3);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-subtle);
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.titlebar-left,
.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 60px;
  -webkit-app-region: no-drag;
}

.titlebar-right {
  justify-content: flex-end;
}

.titlebar-center {
  flex: 1;
  text-align: center;
  overflow: hidden;
}

.titlebar-filename {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.dirty-indicator {
  color: var(--color-warning);
  font-size: 10px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
