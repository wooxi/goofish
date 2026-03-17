<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>🏪 已绑定店铺</span>
        <div class="header-actions">
          <el-button type="success" @click="store.queryShops" :loading="store.querying.value">🔍 查询店铺</el-button>
          <el-button @click="store.refreshShops" :loading="store.querying.value" :disabled="!store.configReady.value">🔄 重新查询</el-button>
        </div>
      </div>
    </template>

    <el-alert
      v-if="!store.configReady.value"
      title="请先完成店铺授权（AppKey + AppSecret）"
      type="warning"
      show-icon
      class="mb-4"
    />

    <el-alert
      v-if="store.lastError.value"
      :title="store.lastError.value"
      type="error"
      show-icon
      closable
      class="mb-4"
    />

    <el-alert
      v-if="store.shopsRestoredAt.value"
      :title="`已恢复你上次的查询结果（查询时间：${store.shopsRestoredAt.value}）`"
      type="info"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <el-skeleton v-if="store.querying.value && store.shops.value.length === 0" :rows="6" animated class="section-skeleton mb-4" />

    <div v-if="store.shops.value.length > 0" class="shops-list">
      <div class="result-info">
        <span>✅ 查询成功，共 <strong>{{ store.shops.value.length }}</strong> 个店铺</span>
        <span v-if="store.queryTime.value">⏱️ 耗时：{{ store.queryTime.value }}</span>
        <span v-if="store.shopsFetchedAt.value">🕒 查询时间：{{ store.shopsFetchedAt.value }}</span>
      </div>

      <div class="table-scroll">
        <el-table :data="store.shops.value" stripe class="data-table shops-table">
          <el-table-column type="expand">
            <template #default="props">
              <div class="shop-detail">
                <h4>📋 店铺详情</h4>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="授权编号">{{ props.row.authorize_id }}</el-descriptions-item>
                  <el-descriptions-item label="商家编号">{{ props.row.seller_id || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="可经营类目">{{ props.row.item_biz_types || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="授权过期">{{ props.row.authorize_expires_str || '-' }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="店铺信息" min-width="200">
            <template #default="scope">
              <div class="shop-info">
                <div class="shop-name">{{ scope.row.shop_name }}</div>
                <div class="shop-meta">
                  <span>👤 {{ scope.row.user_name }}</span>
                  <span>💭 {{ scope.row.user_nick }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="300">
            <template #default="scope">
              <div class="status-tags">
                <el-tag :type="scope.row.is_pro ? 'success' : 'info'" size="small">
                  🏆 {{ scope.row.is_pro ? '鱼小铺' : '普通店' }}
                </el-tag>
                <el-tag :type="scope.row.is_deposit_enough ? 'success' : 'warning'" size="small">
                  💰 {{ scope.row.is_deposit_enough ? '已缴足' : '未缴足' }}
                </el-tag>
                <el-tag :type="scope.row.is_valid ? 'success' : 'danger'" size="small">
                  ✓ {{ scope.row.is_valid ? '有效' : '无效' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="授权过期" width="180">
            <template #default="scope">
              <span :class="store.getExpireClass(scope.row.authorize_expires)">
                📅 {{ scope.row.authorize_expires_str || '未知' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-empty v-else-if="store.queried.value" description="暂未查到店铺，请先确认授权是否有效" />
  </el-card>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
