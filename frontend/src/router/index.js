import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: { name: 'config' },
  },
  {
    path: '/config',
    name: 'config',
    meta: { menuKey: 'config' },
    component: () => import('../pages/ConfigPage.vue'),
  },
  {
    path: '/shops',
    name: 'shops',
    meta: { menuKey: 'shops' },
    component: () => import('../pages/ShopsPage.vue'),
  },
  {
    path: '/products',
    name: 'products',
    meta: { menuKey: 'products' },
    component: () => import('../pages/ProductsPage.vue'),
  },
  {
    path: '/orders',
    name: 'orders',
    meta: { menuKey: 'orders' },
    component: () => import('../pages/OrdersPage.vue'),
  },
  {
    path: '/templates',
    name: 'templates',
    meta: { menuKey: 'templates' },
    component: () => import('../pages/TemplatesPage.vue'),
  },
  {
    path: '/create',
    name: 'create',
    meta: { menuKey: 'create' },
    component: () => import('../pages/CreateProductPage.vue'),
  },
  {
    path: '/callback',
    name: 'callback',
    meta: { menuKey: 'callback' },
    component: () => import('../pages/CallbackPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
