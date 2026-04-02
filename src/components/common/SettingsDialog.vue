<template>
  <div v-if="settings.settingsModalOpen" class="settings-backdrop" @click="close">
    <div class="settings-container" @click.stop>
      <div class="settings-header">
        <h2>首选项</h2>
        <button class="icon-btn" @click="close" title="关闭 (Esc)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="settings-body scrollable">
        <section class="settings-section">
          <h3>外观</h3>
          
          <div class="setting-item">
            <div class="setting-desc">
              <strong>颜色主题 </strong>
              <p>影响外壳边框及底色：明亮、暗黑或跟随系统</p>
            </div>
            <div class="setting-control">
              <select v-model="settings.themeMode">
                <option value="system">跟随系统</option>
                <option value="light">始终明亮</option>
                <option value="dark">始终暗黑</option>
              </select>
            </div>
          </div>

          <div class="setting-item theme-grid-item">
            <div class="setting-desc">
              <strong>编辑区主题 (Theme)</strong>
              <p>改变正文的排版风格、字体及高亮配色</p>
            </div>
            <div class="theme-grid">
              <div 
                v-for="theme in EDITOR_THEMES" 
                :key="theme.id"
                class="theme-card"
                :class="{ active: settings.editorTheme === theme.id }"
                @click="settings.setEditorTheme(theme.id)"
              >
                <div class="theme-preview" :style="{ backgroundColor: theme.preview.bg, borderColor: theme.preview.bg === '#ffffff' ? '#e5e7eb' : theme.preview.bg }">
                  <div class="preview-text" :style="{ color: theme.preview.text }">Aa</div>
                  <div class="preview-accent" :style="{ backgroundColor: theme.preview.accent }"></div>
                </div>
                <div class="theme-info">
                  <span class="theme-name">{{ theme.label }}</span>
                  <span class="theme-desc">{{ theme.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <h3>排版与字体</h3>
          
          <div class="setting-item">
            <div class="setting-desc">
              <strong>基础字号 (FontSize)</strong>
              <p>编辑区内的默认文字尺寸：{{ settings.editorFontSize }}px</p>
            </div>
            <div class="setting-control">
              <input type="range" min="12" max="24" step="1" v-model.number="settings.editorFontSize" />
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-desc">
              <strong>页面最大宽度</strong>
              <p>如果设置为 0 将满幅拉伸，目前：{{ settings.editorMaxWidth === 0 ? '满屏的' : settings.editorMaxWidth + 'px' }}</p>
            </div>
            <div class="setting-control">
              <input type="range" min="0" max="1400" step="50" v-model.number="settings.editorMaxWidth" />
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-desc">
              <strong>阅读字体集 (FontFamily)</strong>
              <p>用于正文内容的字体族</p>
            </div>
            <div class="setting-control">
              <input type="text" v-model="settings.editorFontFamily" style="width: 200px" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore, EDITOR_THEMES } from '../../stores/settings'

const settings = useSettingsStore()

function close() {
  settings.settingsModalOpen = false
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && settings.settingsModalOpen) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.settings-backdrop {
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
  align-items: center;
}

.settings-container {
  width: 90%;
  max-width: 600px;
  background-color: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.settings-header h2 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.settings-body {
  padding: 24px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h3 {
  font-size: var(--text-sm);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-desc strong {
  display: block;
  font-size: var(--text-base);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.setting-desc p {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.setting-control select,
.setting-control input[type="text"] {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.setting-control select:hover,
.setting-control input[type="text"]:focus {
  border-color: var(--color-primary);
}

.setting-control input[type="range"] {
  cursor: pointer;
  accent-color: var(--color-primary);
}

/* 主题选择网格 */
.theme-grid-item {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  width: 100%;
}

.theme-card {
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  background-color: var(--color-bg-secondary);
  overflow: hidden;
}

.theme-card:hover {
  background-color: var(--color-bg-tertiary);
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-subtle);
}

.theme-preview {
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  border-bottom: 1px solid var(--color-border-subtle);
}

.preview-text {
  font-size: 24px;
  font-family: serif;
  font-weight: 600;
  line-height: 1;
}

.preview-accent {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.theme-info {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.theme-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>
