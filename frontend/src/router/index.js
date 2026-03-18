import { createRouter, createWebHistory } from 'vue-router'

const CHUNK_RELOAD_KEY = 'goofish:route-chunk-reload'
const CHUNK_LOAD_ERROR_RE = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

function isChunkLoadError(error) {
  const message = String(error?.message || '')
  return CHUNK_LOAD_ERROR_RE.test(message)
}

function withChunkRetry(loader) {
  return () => loader().catch((error) => {
    if (typeof window === 'undefined' || !isChunkLoadError(error)) {
      throw error
    }

    const hasRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
    if (!hasRetried) {
      window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
      window.location.reload()
      return new Promise(() => {})
    }

    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    throw error
  })
}

const routes = [
  {
    path: '/',
    redirect: { name: 'shopManagement' },
  },
  {
    path: '/shop-management',
    name: 'shopManagement',
    meta: { menuKey: 'shopManagement' },
    component: withChunkRetry(() => import('../pages/StoreManagementPage.vue')),
  },
  {
    path: '/product-library',
    name: 'productLibrary',
    meta: { menuKey: 'productLibrary' },
    component: withChunkRetry(() => import('../pages/ProductLibraryPage.vue')),
  },
  {
    path: '/orders',
    name: 'orders',
    meta: { menuKey: 'orders' },
    component: withChunkRetry(() => import('../pages/OrdersPage.vue')),
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

router.afterEach(() => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  }
})

export default router
