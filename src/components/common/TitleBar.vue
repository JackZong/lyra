<template>
  <header class="titlebar no-select" data-tauri-drag-region>
    <div class="titlebar-left" data-tauri-drag-region></div>

    <div class="titlebar-center" data-tauri-drag-region>
      <span class="titlebar-filename">
        {{ editorStore.currentFileName }}
        <span v-if="editorStore.isDirty" class="dirty-indicator" :title="t.titlebar.unsavedChanges">●</span>
      </span>
    </div>

    <div class="titlebar-right">
      <span class="titlebar-meta">{{ t.titlebar.wordCount.replace('{count}', String(editorStore.wordCount)) }}</span>

      <button class="icon-btn" id="toggle-search" @click="settings.toggleOmniSearch" :title="t.titlebar.globalSearch">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <button class="icon-btn" id="toggle-outline" @click="toggleOutlineSidebar" :title="t.titlebar.outlineDirectory" :class="{'is-active': settings.sidebarTab === 'outline' && settings.sidebarOpen}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      
      <button class="icon-btn" id="toggle-settings" @click="settings.toggleSettingsModal" :title="t.titlebar.settings">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useEditorStore } from '../../stores/editor'
import { useSettingsStore } from '../../stores/settings'
import { useI18n } from '../../i18n'

const editorStore = useEditorStore()
const settings = useSettingsStore()
const { t } = useI18n()

function toggleOutlineSidebar() {
  if (settings.sidebarOpen && settings.sidebarTab === 'outline') {
    settings.setSidebarTab('files')
    return
  }
  settings.setSidebarTab('outline')
}
</script>

<style scoped>
.titlebar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  background-color: #f8f8f8;
  border-bottom: 1px solid var(--color-border-subtle);
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.titlebar-left,
.titlebar-right {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 72px;
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
  font-size: 11px;
  font-weight: 400;
  color: #757575;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.dirty-indicator {
  color: var(--color-warning);
  font-size: 9px;
  animation: pulse 2s ease-in-out infinite;
}

.titlebar :deep(.icon-btn) {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  color: #9b9b9b;
}

.titlebar :deep(.icon-btn:hover) {
  color: #666;
  background-color: rgba(0, 0, 0, 0.04);
}

.titlebar-meta {
  font-size: 10px;
  color: #9a9a9a;
  margin-right: 2px;
  line-height: 1;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
