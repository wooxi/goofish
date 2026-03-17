<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>📨 处理结果（最近记录）</span>
        <el-button size="small" @click="store.loadProcessingResults" :loading="store.callbackLoading.value || store.localTaskLoading.value">🔄 刷新</el-button>
      </div>
    </template>

    <div class="callback-header-row">
      <span class="callback-tip">处理结果页会同时展示：①本地任务记录（批量上架/下架/删除）②平台回调记录</span>
    </div>

    <el-alert
      v-if="store.localTaskError.value"
      :title="store.localTaskError.value"
      type="error"
      show-icon
      closable
      class="mb-4"
    />
    <el-alert
      v-if="store.callbackError.value"
      :title="store.callbackError.value"
      type="error"
      show-icon
      closable
      class="mb-4"
    />

    <el-skeleton
      v-if="(store.callbackLoading.value || store.localTaskLoading.value) && store.localTaskRecords.value.length === 0 && store.callbackRecords.value.length === 0"
      :rows="8"
      animated
      class="section-skeleton mb-4"
    />

    <div v-if="store.localTaskRecords.value.length > 0" class="mb-4">
      <div class="section-title-row">
        <div class="section-title">🧵 本地任务记录（批量上架/下架/删除）</div>
      </div>
      <div class="table-scroll">
        <el-table :data="store.localTaskRecords.value" stripe class="data-table callback-table">
          <el-table-column prop="updated_at" label="最近更新时间" width="180">
            <template #default="scope">{{ store.formatDateTime(scope.row.updated_at || scope.row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="task_type_text" label="任务类型" width="130" />
          <el-table-column label="任务状态" width="120">
            <template #default="scope">
              <el-tag :type="store.getTaskStatusType(scope.row.status)">{{ scope.row.status_text || scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="task_id" label="任务ID" width="180" show-overflow-tooltip />
          <el-table-column label="进度" width="200">
            <template #default="scope">
              {{ scope.row.summary?.processed || 0 }}/{{ scope.row.summary?.total || 0 }}（成功 {{ scope.row.summary?.success || 0 }}，失败 {{ scope.row.summary?.failed || 0 }}）
            </template>
          </el-table-column>
          <el-table-column prop="operator_user_name" label="店铺账号" width="160" />
          <el-table-column prop="message" label="说明" min-width="240" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <div v-if="store.callbackRecords.value.length > 0">
      <div class="section-title-row">
        <div class="section-title">🔔 平台回调记录</div>
      </div>
      <div class="table-scroll">
        <el-table :data="store.callbackRecords.value" stripe class="data-table callback-table">
          <el-table-column prop="received_at" label="接收时间" width="180">
            <template #default="scope">{{ store.formatDateTime(scope.row.received_at) }}</template>
          </el-table-column>
          <el-table-column prop="task_type" label="任务类型" width="120" />
          <el-table-column prop="task_result" label="处理结果" width="120" />
          <el-table-column prop="err_code" label="错误码" width="150" />
          <el-table-column prop="err_msg" label="失败原因" min-width="220" show-overflow-tooltip />
          <el-table-column prop="product_id" label="商品编号" width="140" />
          <el-table-column prop="publish_status" label="上架状态" width="130" />
          <el-table-column prop="user_name" label="店铺账号" width="150" />
          <el-table-column prop="task_time" label="处理时间" width="180">
            <template #default="scope">{{ store.formatCallbackTime(scope.row.task_time) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-empty v-if="store.localTaskRecords.value.length === 0 && store.callbackRecords.value.length === 0" description="暂时没有处理记录" />
  </el-card>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
