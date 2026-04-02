import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 样式引入顺序：token → 基础 → 编辑器 → 主题
import './styles/variables.css'
import './styles/base.css'
import './styles/editor.css'

// 编辑区主题
import './styles/themes/github.css'
import './styles/themes/gothic.css'
import './styles/themes/newsprint.css'
import './styles/themes/night.css'
import './styles/themes/pixyll.css'
import './styles/themes/whitey.css'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('Vue 错误:', err, info)
}

window.onerror = (message, _source, _lineno, _colno, error) => {
  console.error('全局错误:', message, error)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未捕获的 Promise:', event.reason)
})

app.use(createPinia())
app.mount('#app')
