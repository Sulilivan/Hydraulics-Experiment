import { createRouter, createWebHistory } from 'vue-router'
// 确保这三个文件真实存在于 views 文件夹下
import HomeView from '../views/HomeView.vue'
import HydrostaticPressure from '../views/HydrostaticPressure.vue'
import HydrostaticForce from '../views/HydrostaticForce.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/pressure', component: HydrostaticPressure },
  { path: '/force', component: HydrostaticForce }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router