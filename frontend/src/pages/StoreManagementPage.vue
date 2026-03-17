<template>
  <div class="space-y-4">
    <el-card class="panel-card">
      <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
        <el-tabs v-model="store.shopManagementTab.value" class="shop-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="绑定的店铺" name="shops" />
          <el-tab-pane label="授权设置" name="config" />
        </el-tabs>
        <div class="flex items-center gap-2">
          <el-button
            v-if="store.shopManagementTab.value === 'shops'"
            type="primary"
            @click="store.queryShops"
            :loading="store.querying.value"
          >
            查询店铺
          </el-button>
          <el-button
            v-else
            type="primary"
            @click="store.saveConfig"
            :loading="store.saving.value"
          >
            保存配置
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="store.shopManagementTab.value === 'shops' && !store.configReady.value"
        title="请先完成授权设置（AppKey + AppSecret）"
        type="warning"
        show-icon
        class="mb-4"
      />

      <template v-if="store.shopManagementTab.value === 'shops'">
        <el-alert v-if="store.lastError.value" :title="store.lastError.value" type="error" show-icon closable class="mb-4" />

        <el-skeleton v-if="store.querying.value && store.shops.value.length === 0" :rows="6" animated class="section-skeleton mb-4" />

        <template v-else>
          <div v-if="store.shops.value.length > 0" class="mb-4 text-xs text-slate-500">
            已绑定 {{ store.shops.value.length }} 个店铺
            <span v-if="store.shopsFetchedAt.value"> · 查询时间：{{ store.shopsFetchedAt.value }}</span>
          </div>

          <div v-if="store.shops.value.length > 0" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="shop in store.shops.value"
              :key="`${shop.user_name}-${shop.authorize_id}`"
              class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-slate-900 font-semibold text-base">{{ shop.shop_name || '未命名店铺' }}</h3>
                  <p class="text-xs text-slate-500 mt-1">账号：{{ shop.user_name || '-' }}</p>
                </div>
                <span class="status-pill" :class="shop.is_valid ? 'pill-green' : 'pill-red'">
                  {{ shop.is_valid ? '授权有效' : '待检查' }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span class="status-pill" :class="shop.is_pro ? 'pill-indigo' : 'pill-slate'">
                  {{ shop.is_pro ? '鱼小铺' : '普通店' }}
                </span>
                <span class="status-pill" :class="shop.is_deposit_enough ? 'pill-green' : 'pill-amber'">
                  {{ shop.is_deposit_enough ? '保证金已足额' : '保证金不足' }}
                </span>
              </div>

              <div class="mt-3 text-xs text-slate-600 space-y-1">
                <div>商家 ID：{{ shop.seller_id || '-' }}</div>
                <div>授权编号：{{ shop.authorize_id || '-' }}</div>
                <div :class="store.getExpireClass(shop.authorize_expires)">过期时间：{{ shop.authorize_expires_str || '未知' }}</div>
              </div>
            </article>
          </div>

          <el-empty v-else description="暂未查询到店铺">
            <el-button type="primary" @click="store.queryShops" :loading="store.querying.value">立即查询</el-button>
          </el-empty>
        </template>
      </template>

      <template v-else>
        <div class="mx-auto max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <el-alert
            v-if="store.configLoadedFromBackend.value"
            :title="`已读取配置：AppKey=${store.config.appid || '-'}，${store.hasSavedSecret.value ? 'AppSecret 已保存' : 'AppSecret 未保存'}`"
            type="success"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-form :model="store.config" label-width="140px" size="large">
            <el-form-item label="AppKey（应用ID）" required>
              <el-input v-model="store.config.appid" placeholder="请输入 AppKey（数字）" type="number" />
            </el-form-item>
            <el-form-item label="AppSecret" required>
              <el-input
                v-model="store.config.appsecret"
                placeholder="如不修改可留空，系统沿用已保存密钥"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="商家ID（选填）">
              <el-input v-model="store.config.seller_id" placeholder="选填：用于锁定指定商家" type="number" />
            </el-form-item>
            <el-form-item label="最后更新">
              <span class="text-slate-500">{{ store.config.updated_at || '暂无记录' }}</span>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')

function handleTabChange(tab) {
  if (tab === 'shops' && store.shops.value.length === 0 && store.configReady.value) {
    store.queryShops(false, true)
  }
}
</script>

<style scoped>
.status-pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.3;
  font-weight: 600;
}

.pill-green {
  background: #dcfce7;
  color: #166534;
}

.pill-red {
  background: #fee2e2;
  color: #b91c1c;
}

.pill-indigo {
  background: #e0e7ff;
  color: #3730a3;
}

.pill-slate {
  background: #e2e8f0;
  color: #475569;
}

.pill-amber {
  background: #fef3c7;
  color: #92400e;
}

:deep(.shop-tabs .el-tabs__item.is-active) {
  color: #4f46e5;
}

:deep(.shop-tabs .el-tabs__active-bar) {
  background-color: #4f46e5;
}
</style>
