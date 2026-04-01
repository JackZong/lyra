<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      class="context-menu"
      :style="{ left: `${state.x}px`, top: `${state.y}px` }"
      @click.stop
    >
      <div
        v-for="(item, index) in state.items"
        :key="index"
        :class="['menu-item', { 'is-danger': item.danger }]"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useContextMenu, type MenuItem } from '../../composables/useContextMenu'

const { state, closeMenu } = useContextMenu()

function handleClick(item: MenuItem) {
  item.action()
  closeMenu()
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 150px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  font-size: 13px;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.1s;
}

.menu-item:hover {
  background-color: var(--primary-color);
  color: var(--bg-color);
}

.menu-item.is-danger {
  color: #ff4d4f;
}

.menu-item.is-danger:hover {
  background-color: #ff4d4f;
  color: #fff;
}
</style>
