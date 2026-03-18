import { createRouter, createWebHistory } from 'vue-router'

const CHUNK_RELOAD_KEY_PREFIX = 'goofish:route-chunk-reload:'
const CHUNK_RETRY_TTL_MS = 5 * 60 * 1000
const CHUNK_LOAD_ERROR_RE = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

function isChunkLoadError(error) {
  const message = String(error?.message || '')
  return CHUNK_LOAD_ERROR_RE.test(message)
}

function getChunkRetryKey(routeKey) {
  return `${CHUNK_RELOAD_KEY_PREFIX}${routeKey}`
}

function hasRecentChunkRetry(routeKey) {
  if (typeof window === 'undefined') {
    return false
  }

  const retryKey = getChunkRetryKey(routeKey)
  const raw = window.sessionStorage.getItem(retryKey)
  if (!raw) {
    return false
  }

  const ts = Number(raw)
  if (!Number.isFinite(ts) || (Date.now() - ts) > CHUNK_RETRY_TTL_MS) {
    window.sessionStorage.removeItem(retryKey)
    return false
  }

  return true
}

function markChunkRetry(routeKey) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(getChunkRetryKey(routeKey), String(Date.now()))
  }
}

function clearChunkRetry(routeKey) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(getChunkRetryKey(routeKey))
  }
}

function withChunkRetry(routeKey, routePath, loader) {
  return () => loader()
    .then((module) => {
      clearChunkRetry(routeKey)
      return module
    })
    .catch((error) => {
      if (typeof window === 'undefined' || !isChunkLoadError(error)) {
        throw error
      }

      if (!hasRecentChunkRetry(routeKey)) {
        markChunkRetry(routeKey)
        const fallbackPath = typeof routePath === 'string' && routePath ? routePath : window.location.pathname
        window.location.assign(fallbackPath)
        return new Promise(() => {})
      }

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
    component: withChunkRetry('shopManagement', '/shop-management', () => import('../pages/StoreManagementPage.vue')),
  },
  {
    path: '/product-library',
    name: 'productLibrary',
    meta: { menuKey: 'productLibrary' },
    component: withChunkRetry('productLibrary', '/product-library', () => import('../pages/ProductLibraryPage.vue')),
  },
  {
    path: '/orders',
    name: 'orders',
    meta: { menuKey: 'orders' },
    component: withChunkRetry('orders', '/orders', () => import('../pages/OrdersPage.vue')),
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
