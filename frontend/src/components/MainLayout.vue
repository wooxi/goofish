<template>
  <div class="goofish-layout min-h-screen bg-slate-100 p-4">
    <el-container class="layout-root">
      <el-aside width="248px" class="sidebar" :class="{ 'is-compact': store.isCompactViewport.value }">
        <SidebarNav
          :active-menu="store.activeMenu.value"
          :menu-items="store.menuItems"
          :compact="store.isCompactViewport.value"
          @select="handleMenuSelect"
        />
      </el-aside>

      <el-main class="workspace">
        <TopWorkspaceHeader
          :title="store.currentMenuTitle.value"
          :description="store.currentMenuDesc.value"
          :backend-status="store.backendStatus.value"
          :last-query-time="store.lastQueryTime.value"
          :refreshing="store.headerRefreshing.value"
          @refresh="store.handleHeaderRefresh"
        />

        <transition name="page-fade" mode="out-in">
          <div :key="store.activeMenu.value" class="page-scene">
            <router-view />
          </div>
        </transition>
      </el-main>
    </el-container>

    <footer class="status-bar">
      <span v-if="store.lastQueryTime.value">最后店铺查询：{{ store.lastQueryTime.value }}</span>
      <span>接口服务状态：{{ store.backendStatus.value }}</span>
    </footer>
  </div>
</template>

<script setup>
import { inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarNav from './SidebarNav.vue'
import TopWorkspaceHeader from './TopWorkspaceHeader.vue'

const store = inject('goofishWorkspace')
const route = useRoute()
const router = useRouter()

function syncMenuByRoute() {
  const menuKey = route.meta?.menuKey || route.name || 'config'
  store.handleMenuSelect(String(menuKey))
}

function handleMenuSelect(key) {
  if (String(route.name) !== String(key)) {
    router.push({ name: key })
    return
  }
  store.handleMenuSelect(key)
}

watch(() => route.fullPath, syncMenuByRoute, { immediate: true })
</script>
