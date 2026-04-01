import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 样式引入顺序：token → 基础 → 编辑器 → 组件
import './styles/variables.css'
import './styles/base.css'
import './styles/editor.css'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 错误:', err, info)
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error('全局错误:', message, error)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未捕获的 Promise:', event.reason)
})

app.use(createPinia())
app.mount('#app')
