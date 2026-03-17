import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import Antd from 'ant-design-vue'
import 'element-plus/dist/index.css'
import 'ant-design-vue/dist/reset.css'
import './styles/tailwind.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(Antd)
app.use(router)
app.mount('#app')
