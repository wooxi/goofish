<template>
  <el-dialog
    v-model="store.orderDetailDialogVisible.value"
    width="860px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <div class="product-detail-dialog__header">
        <span>📋 订单详情</span>
        <span v-if="store.orderDetailOrderId.value" class="product-detail-dialog__id">订单号：{{ store.orderDetailOrderId.value }}</span>
      </div>
    </template>

    <el-skeleton v-if="store.orderDetailLoading.value" :rows="10" animated />

    <template v-else>
      <el-alert
        v-if="store.orderDetailError.value"
        :title="store.orderDetailError.value"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <section class="product-detail-overview">
        <div class="product-detail-overview__title-wrap">
          <h3>{{ store.orderDetailDisplay.value.title }}</h3>
          <el-tag type="info" size="small">{{ store.orderDetailDisplay.value.statusText }}</el-tag>
        </div>
        <p class="product-detail-overview__meta">
          订单号：{{ store.orderDetailDisplay.value.orderId }}
          <span class="dot">•</span>
          金额：{{ store.orderDetailDisplay.value.amountText }}
        </p>
      </section>

      <div class="order-detail-grid">
        <section class="product-detail-section">
          <h4>👥 交易信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ store.orderDetailDisplay.value.orderId }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">{{ store.orderDetailDisplay.value.statusText }}</el-descriptions-item>
            <el-descriptions-item label="买家">{{ store.orderDetailDisplay.value.buyerText }}</el-descriptions-item>
            <el-descriptions-item label="卖家">{{ store.orderDetailDisplay.value.sellerText }}</el-descriptions-item>
            <el-descriptions-item label="金额">{{ store.orderDetailDisplay.value.amountText }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="product-detail-section">
          <h4>⏰ 时间信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="下单时间">{{ store.orderDetailDisplay.value.createdAtText }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ store.orderDetailDisplay.value.payTimeText }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="product-detail-section">
          <h4>📦 商品信息</h4>
          <div class="table-scroll">
            <el-table :data="store.orderDetailGoods.value" stripe class="data-table" empty-text="暂无商品信息">
              <el-table-column label="商品" min-width="260" show-overflow-tooltip>
                <template #default="scope">
                  <div class="order-goods-title">{{ scope.row.title }}</div>
                </template>
              </el-table-column>
              <el-table-column label="图片" width="92">
                <template #default="scope">
                  <el-image
                    v-if="scope.row.image"
                    :src="scope.row.image"
                    fit="cover"
                    class="order-goods-image"
                    :preview-src-list="[scope.row.image]"
                    preview-teleported
                  />
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="quantityText" label="数量" width="80" />
              <el-table-column prop="unitPriceText" label="单价" width="120" />
              <el-table-column prop="totalPriceText" label="小计" width="120" />
            </el-table>
          </div>
        </section>

        <section class="product-detail-section product-detail-section--logistics-secondary">
          <h4>🚚 物流信息</h4>
          <div v-if="store.orderDetailLogistics.value.length > 0" class="order-logistics-list">
            <div v-for="(item, index) in store.orderDetailLogistics.value" :key="`logistics-${index}`" class="order-logistics-card">
              <div>物流公司：{{ item.company }}</div>
              <div>物流单号：{{ item.logisticsNo }}</div>
              <div>物流状态：{{ item.status }}</div>
              <div>收件人：{{ item.receiver }}</div>
              <div>联系方式：{{ item.receiverPhone }}</div>
              <div>收货地址：{{ item.address }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无物流信息" :image-size="64" />
        </section>
      </div>

      <details v-if="store.orderDetailRawJson.value" class="product-detail-raw">
        <summary>查看完整原始详情</summary>
        <pre>{{ store.orderDetailRawJson.value }}</pre>
      </details>
    </template>
  </el-dialog>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
