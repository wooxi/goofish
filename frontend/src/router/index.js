import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: { name: 'shopManagement' },
  },
  {
    path: '/shop-management',
    name: 'shopManagement',
    meta: { menuKey: 'shopManagement' },
    component: () => import('../pages/StoreManagementPage.vue'),
  },
  {
    path: '/product-library',
    name: 'productLibrary',
    meta: { menuKey: 'productLibrary' },
    component: () => import('../pages/ProductLibraryPage.vue'),
  },
  {
    path: '/orders',
    name: 'orders',
    meta: { menuKey: 'orders' },
    component: () => import('../pages/OrdersPage.vue'),
  },
  // 兼容旧路由，统一收敛到新 IA
  { path: '/config', redirect: { name: 'shopManagement' } },
  { path: '/shops', redirect: { name: 'shopManagement' } },
  { path: '/products', redirect: { name: 'productLibrary' } },
  { path: '/templates', redirect: { name: 'productLibrary' } },
  { path: '/create', redirect: { name: 'productLibrary' } },
  { path: '/callback', redirect: { name: 'productLibrary' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
