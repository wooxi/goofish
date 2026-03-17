<template>
  <header class="workspace-header modern-header">
    <div class="header-main">
      <a-breadcrumb class="header-breadcrumb">
        <a-breadcrumb-item>Goofish 工作台</a-breadcrumb-item>
        <a-breadcrumb-item>{{ title }}</a-breadcrumb-item>
      </a-breadcrumb>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="header-controls">
      <a-button @click="$emit('refresh')" :loading="refreshing">刷新当前页</a-button>
      <a-tag :color="backendTagColor" class="status-chip">{{ backendStatus }}</a-tag>
      <div class="user-chip">
        <a-avatar size="small" class="user-avatar">G</a-avatar>
        <div>
          <div class="user-name">Goofish Ops</div>
          <div class="user-meta">{{ lastQueryTime ? `店铺查询：${lastQueryTime}` : '等待首次查询' }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Goofish',
  },
  description: {
    type: String,
    default: '',
  },
  backendStatus: {
    type: String,
    default: '',
  },
  lastQueryTime: {
    type: String,
    default: '',
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['refresh'])

const backendTagColor = computed(() => {
  if (props.backendStatus.includes('✅')) return 'success'
  if (props.backendStatus.includes('检测')) return 'processing'
  return 'error'
})
</script>

<style scoped>
.modern-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-main h2 {
  margin-top: 4px;
}

.header-breadcrumb {
  margin-bottom: 6px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f8fafc;
}

.user-avatar {
  background: linear-gradient(90deg, #4f46e5, #6366f1);
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.user-meta {
  font-size: 11px;
  color: #64748b;
}

@media (max-width: 960px) {
  .modern-header {
    flex-direction: column;
  }

  .header-controls {
    justify-content: flex-start;
  }
}
</style>
