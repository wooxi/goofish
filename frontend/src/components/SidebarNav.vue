<template>
  <div class="sidebar-shell">
    <div class="brand">
      <div class="brand-title">🐟 Goofish</div>
      <div class="brand-subtitle">闲鱼商家工作台</div>
    </div>

    <nav class="sidebar-menu" :class="{ 'is-compact': compact }">
      <button
        v-for="item in menuItems"
        :key="item.key"
        type="button"
        class="sidebar-menu-item"
        :class="{ 'is-active': activeMenu === item.key }"
        @click="$emit('select', item.key)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span class="menu-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  menuItems: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])
</script>

<style scoped>
.sidebar-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 10px;
}

.sidebar-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  color: #cbd5e1;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-menu-item:hover {
  background: #1e293b;
  color: #ffffff;
}

.sidebar-menu-item.is-active {
  color: #ffffff;
  font-weight: 600;
  background: linear-gradient(90deg, #4f46e5, #6366f1);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.32);
}

.menu-icon {
  width: 18px;
  text-align: center;
}

.menu-label {
  white-space: nowrap;
}

@media (max-width: 960px) {
  .sidebar-menu {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 6px;
    padding-bottom: 10px;
  }

  .sidebar-menu-item {
    width: auto;
    flex: 0 0 auto;
    padding: 8px 12px;
    border-radius: 999px;
  }

  .menu-label {
    font-size: 12px;
  }
}
</style>
