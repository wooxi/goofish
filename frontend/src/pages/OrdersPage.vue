<template>
  <div class="page-orders">
    <el-card class="panel-card">
      <template #header>
        <div class="card-header">
          <span>🧾 订单查询</span>
          <div class="header-actions">
            <el-button type="success" @click="store.queryOrders" :loading="store.queryingOrders.value">🔍 查询订单</el-button>
            <el-button @click="store.refreshOrders" :loading="store.queryingOrders.value" :disabled="!store.configReady.value">🔄 重新查询</el-button>
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
        v-if="store.ordersError.value"
        :title="store.ordersError.value"
        type="error"
        show-icon
        closable
        class="mb-4"
      />

      <el-alert
        v-if="store.ordersRestoredAt.value"
        :title="`已恢复你上次的查询结果（查询时间：${store.ordersRestoredAt.value}）`"
        type="info"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <div class="products-query-tools mb-4">
        <span class="products-query-tools__label">筛选与排序：</span>
        <el-select
          :model-value="store.orderFilters.order_status"
          placeholder="订单状态"
          style="width: 180px"
          size="small"
          @change="store.handleOrdersStatusFilterChange"
        >
          <el-option
            v-for="item in store.orderStatusOptions.value"
            :key="`order-status-${item.value}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          :model-value="store.orderFilters.sort_by"
          placeholder="排序字段"
          style="width: 200px"
          size="small"
          @change="store.handleOrdersSortFieldChange"
        >
          <el-option
            v-for="item in store.ORDER_SORT_FIELD_OPTIONS"
            :key="`order-sort-field-${item.value || 'default'}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          :model-value="store.orderFilters.sort_order"
          placeholder="排序方向"
          style="width: 180px"
          size="small"
          :disabled="!store.orderFilters.sort_by"
          @change="store.handleOrdersSortOrderChange"
        >
          <el-option
            v-for="item in store.ORDER_SORT_ORDER_OPTIONS"
            :key="`order-sort-order-${item.value}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button size="small" @click="store.resetOrdersQueryControls">重置筛选与排序</el-button>
      </div>

      <el-skeleton v-if="store.queryingOrders.value && store.orders.value.length === 0" :rows="8" animated class="section-skeleton mb-4" />

      <div v-if="store.orders.value.length > 0" class="orders-list">
        <div class="result-info result-info--products">
          <div class="result-info-main">
            <span>✅ 查询成功，共 <strong>{{ store.ordersPagination.count }}</strong> 条订单（本页 {{ store.orders.value.length }} 条）</span>
            <div class="pagination-info">
              <span>第 {{ store.ordersPagination.page_no }} 页</span>
              <span>共 {{ store.ordersPagination.count }} 条</span>
              <span>每页 {{ store.ordersPagination.page_size }} 条</span>
            </div>
            <span v-if="store.ordersFetchedAt.value" class="latest-query-time">🕒 最新查询时间：{{ store.ordersFetchedAt.value }}</span>
          </div>
          <div class="header-actions">
            <el-select
              :model-value="store.orderQuery.page_size"
              style="width: 128px"
              size="small"
              @change="store.handleOrdersPageSizeChange"
            >
              <el-option v-for="size in store.ORDER_PAGE_SIZE_OPTIONS" :key="`order-size-${size}`" :label="`每页 ${size} 条`" :value="size" />
            </el-select>
          </div>
        </div>

        <div class="table-scroll">
          <el-table :data="store.orders.value" stripe class="data-table orders-table">
            <el-table-column label="订单号" min-width="220">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  class="order-id-link"
                  @click="store.openOrderDetail(scope.row)"
                >
                  {{ scope.row.order_id || '-' }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="商品信息" min-width="220" />
            <el-table-column label="金额" width="140">
              <template #default="scope">
                <span class="price">💰 {{ scope.row.amount_str }}</span>
              </template>
            </el-table-column>
            <el-table-column label="订单状态" width="150">
              <template #default="scope">
                <el-tag :type="store.getOrderStatusType(scope.row.order_status_text)" size="small">
                  {{ scope.row.order_status_text || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="buyer_name" label="买家" width="160" />
            <el-table-column prop="seller_name" label="卖家" width="160" />
            <el-table-column prop="created_at_text" label="下单时间" width="180" />
          </el-table>
        </div>

        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="store.orderQuery.page_no"
            :page-size="store.orderQuery.page_size"
            :total="store.ordersPagination.count"
            :disabled="store.queryingOrders.value"
            @current-change="store.handleOrdersCurrentPageChange"
          />
        </div>
      </div>

      <el-empty v-else-if="store.ordersQueried.value" description="当前暂无订单数据" />
    </el-card>

    <OrderDetailDialog />
  </div>
</template>

<script setup>
import { inject } from 'vue'
import OrderDetailDialog from '../components/OrderDetailDialog.vue'

const store = inject('goofishWorkspace')
</script>
