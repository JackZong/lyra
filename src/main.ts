import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 样式引入顺序：token → 基础 → 编辑器 → 组件
import './styles/variables.css'
import './styles/base.css'
import './styles/editor.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
