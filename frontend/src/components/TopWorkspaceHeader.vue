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
      <el-badge :value="runningTaskCount" :hidden="runningTaskCount <= 0" :max="99">
        <button class="task-center-btn" type="button" @click="taskDrawerVisible = true">
          <span>🧩</span>
          <span>任务中心</span>
        </button>
      </el-badge>
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

  <el-drawer
    v-model="taskDrawerVisible"
    direction="rtl"
    size="380px"
    :append-to-body="true"
    :destroy-on-close="false"
    :with-header="false"
    class="task-center-drawer"
  >
    <div class="task-center-panel">
      <div class="task-center-top">
        <div>
          <div class="task-center-title">全局任务中心</div>
          <div class="task-center-sub">批量任务 + 回调记录按时间线展示</div>
        </div>
        <el-button size="small" @click="$emit('refresh-task-center')" :loading="taskLoading">刷新</el-button>
      </div>

      <el-skeleton v-if="taskLoading && timelineEntries.length === 0" :rows="6" animated />

      <template v-else>
        <div v-if="timelineEntries.length > 0" class="timeline-wrap">
          <div v-for="(item, index) in timelineEntries" :key="item.key" class="timeline-item">
            <div class="timeline-dot" :class="item.dotClass" />
            <div class="timeline-line" v-if="index !== timelineEntries.length - 1" />
            <div class="timeline-card">
              <div class="timeline-card-head">
                <div class="timeline-title">{{ item.title }}</div>
                <span class="status-pill" :class="item.pillClass">{{ item.statusText }}</span>
              </div>
              <div class="timeline-time">{{ item.timeText }}</div>
              <div class="timeline-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无任务记录">
          <el-button type="primary" @click="$emit('refresh-task-center')">立即刷新</el-button>
        </el-empty>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'

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
  runningTaskCount: {
    type: Number,
    default: 0,
  },
  taskRecords: {
    type: Array,
    default: () => [],
  },
  callbackRecords: {
    type: Array,
    default: () => [],
  },
  taskLoading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['refresh', 'refresh-task-center'])

const taskDrawerVisible = ref(false)

const backendTagColor = computed(() => {
  if (props.backendStatus.includes('✅')) return 'success'
  if (props.backendStatus.includes('检测')) return 'processing'
  return 'error'
})

function toTs(value) {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function formatTime(value) {
  if (!value) return '时间未知'
  const ts = new Date(value)
  if (Number.isNaN(ts.getTime())) return String(value)
  return ts.toLocaleString('zh-CN')
}

function getTaskPill(status) {
  const map = {
    running: 'pill-running',
    queued: 'pill-queued',
    finished: 'pill-finished',
    partial_failed: 'pill-warning',
    failed: 'pill-failed',
  }
  return map[String(status || '')] || 'pill-default'
}

const timelineEntries = computed(() => {
  const taskEntries = (props.taskRecords || []).map((task) => {
    const updatedAt = task?.updated_at || task?.created_at || ''
    const status = String(task?.status || '')
    const processed = Number(task?.summary?.processed) || 0
    const total = Number(task?.summary?.total) || 0
    const ok = Number(task?.summary?.success) || 0
    const failed = Number(task?.summary?.failed) || 0
    return {
      key: `task-${task?.task_id || Math.random()}-${updatedAt}`,
      ts: toTs(updatedAt),
      timeText: formatTime(updatedAt),
      title: `任务 · ${task?.task_type_text || task?.task_type || '批量操作'}`,
      statusText: task?.status_text || status || '未知',
      pillClass: getTaskPill(status),
      dotClass: getTaskPill(status),
      desc: `进度 ${processed}/${total}（成功 ${ok}，失败 ${failed}）${task?.operator_user_name ? ` · 店铺 ${task.operator_user_name}` : ''}${task?.message ? ` · ${task.message}` : ''}`,
    }
  })

  const callbackEntries = (props.callbackRecords || []).map((record) => {
    const receivedAt = record?.received_at || record?.task_time || ''
    const result = String(record?.task_result || '').trim() || '回调'
    const success = ['success', 'ok', 'finished'].includes(result.toLowerCase())
    return {
      key: `callback-${record?.id || record?.task_id || Math.random()}-${receivedAt}`,
      ts: toTs(receivedAt),
      timeText: formatTime(receivedAt),
      title: `回调 · ${record?.task_type || '商品任务'}`,
      statusText: result,
      pillClass: success ? 'pill-finished' : 'pill-warning',
      dotClass: success ? 'pill-finished' : 'pill-warning',
      desc: `${record?.product_id ? `商品 ${record.product_id}` : '未关联商品'}${record?.err_msg ? ` · ${record.err_msg}` : ''}${record?.user_name ? ` · ${record.user_name}` : ''}`,
    }
  })

  return [...taskEntries, ...callbackEntries]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 60)
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

.task-center-btn {
  border: 1px solid #c7d2fe;
  color: #4338ca;
  background: #eef2ff;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.task-center-btn:hover {
  background: #e0e7ff;
  transform: translateY(-1px);
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

.task-center-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-center-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.task-center-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.task-center-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.timeline-wrap {
  overflow-y: auto;
  padding-right: 2px;
}

.timeline-item {
  position: relative;
  padding-left: 18px;
  margin-bottom: 12px;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #94a3b8;
}

.timeline-line {
  position: absolute;
  left: 4px;
  top: 18px;
  width: 2px;
  bottom: -14px;
  background: #e2e8f0;
}

.timeline-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  padding: 10px;
}

.timeline-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.timeline-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.timeline-time {
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
}

.timeline-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #334155;
  line-height: 1.45;
}

.status-pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.pill-running {
  background: #fef3c7;
  color: #92400e;
}

.pill-queued,
.pill-default {
  background: #e2e8f0;
  color: #475569;
}

.pill-finished {
  background: #dcfce7;
  color: #166534;
}

.pill-warning {
  background: #ffedd5;
  color: #9a3412;
}

.pill-failed {
  background: #fee2e2;
  color: #b91c1c;
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
