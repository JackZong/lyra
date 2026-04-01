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
  min-width: 160px;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
  padding: 4px;
  font-size: 12px;
  line-height: 1;
}

.menu-item {
  padding: 6px 10px;
  cursor: pointer;
  color: #333;
  border-radius: 6px;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
  color: #222;
}

.menu-item.is-danger {
  color: #d92d20;
}

.menu-item.is-danger:hover {
  background-color: rgba(217, 45, 32, 0.10);
  color: #b42318;
}
</style>
