import { reactive } from 'vue'

export interface MenuItem {
  label: string
  action: () => void
  danger?: boolean
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: MenuItem[]
}

export const contextMenuState = reactive<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: []
})

export function useContextMenu() {
  function openMenu(e: MouseEvent, items: MenuItem[]) {
    e.preventDefault()
    contextMenuState.x = e.clientX
    contextMenuState.y = e.clientY
    contextMenuState.items = items
    contextMenuState.visible = true
    
    // 监听任意点击以关闭菜单
    requestAnimationFrame(() => {
      document.addEventListener('click', closeMenu, { once: true })
      document.addEventListener('contextmenu', closeMenu, { once: true })
    })
  }

  function closeMenu() {
    contextMenuState.visible = false
    document.removeEventListener('click', closeMenu)
    document.removeEventListener('contextmenu', closeMenu)
  }

  return {
    state: contextMenuState,
    openMenu,
    closeMenu
  }
}
