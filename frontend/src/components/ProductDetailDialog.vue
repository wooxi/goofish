<template>
  <el-dialog
    v-model="store.productDetailDialogVisible.value"
    width="760px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template #header>
      <div class="product-detail-dialog__header">
        <span>🧾 商品详情</span>
        <span v-if="store.productDetailProductId.value" class="product-detail-dialog__id">商品编号：{{ store.productDetailProductId.value }}</span>
      </div>
    </template>

    <el-skeleton v-if="store.productDetailLoading.value" :rows="8" animated />

    <template v-else>
      <el-alert
        v-if="store.productDetailError.value"
        :title="store.productDetailError.value"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <section class="product-detail-overview">
        <div class="product-detail-overview__title-wrap">
          <h3>{{ store.productDetailDisplay.value.title }}</h3>
          <el-tag v-if="store.productDetailDisplay.value.statusCode !== null" :type="store.getStatusType(store.productDetailDisplay.value.statusCode)" size="small">
            {{ store.productDetailDisplay.value.statusText }}
          </el-tag>
          <span v-else class="product-detail-overview__status-text">{{ store.productDetailDisplay.value.statusText }}</span>
        </div>
        <p class="product-detail-overview__meta">
          商品编号：{{ store.productDetailProductId.value || '-' }}
          <span class="dot">•</span>
          店铺账号：{{ store.productDetailDisplay.value.userName }}
        </p>
      </section>

      <div class="product-detail-metrics">
        <div class="metric-card">
          <div class="label">售价</div>
          <div class="value value--price">{{ store.productDetailDisplay.value.priceText }}</div>
        </div>
        <div class="metric-card">
          <div class="label">原价</div>
          <div class="value">{{ store.productDetailDisplay.value.originalPriceText }}</div>
        </div>
        <div class="metric-card">
          <div class="label">库存</div>
          <div class="value">{{ store.productDetailDisplay.value.stockText }}</div>
        </div>
        <div class="metric-card">
          <div class="label">销量</div>
          <div class="value">{{ store.productDetailDisplay.value.soldText }}</div>
        </div>
        <div class="metric-card">
          <div class="label">运费</div>
          <div class="value">{{ store.productDetailDisplay.value.expressFeeText }}</div>
        </div>
      </div>

      <div class="product-detail-main-grid">
        <section class="product-detail-section product-detail-section--description">
          <h4>📝 商品描述</h4>
          <div class="product-detail-description-box">
            {{ store.productDetailDisplay.value.content || '暂无商品描述' }}
          </div>
        </section>

        <section class="product-detail-section product-detail-section--images">
          <h4>🖼️ 商品图片（{{ store.productDetailImageUrls.value.length }}）</h4>
          <div v-if="store.productDetailImageUrls.value.length > 0" class="product-detail-image-grid">
            <div v-for="(url, index) in store.productDetailImageUrls.value" :key="`${url}-${index}`" class="product-detail-image-item">
              <el-image
                :src="url"
                fit="cover"
                class="product-detail-image"
                :preview-src-list="store.productDetailImageUrls.value"
                :initial-index="index"
                preview-teleported
              >
                <template #placeholder>
                  <div class="product-detail-image-placeholder">图片加载中...</div>
                </template>
                <template #error>
                  <div class="product-detail-image-fallback">图片加载失败</div>
                </template>
              </el-image>
              <a :href="url" target="_blank" rel="noopener noreferrer" class="product-detail-image-link">查看原图</a>
            </div>
          </div>
          <div v-else class="product-detail-image-empty">暂无可展示图片</div>
        </section>
      </div>

      <details v-if="store.productDetailRawJson.value" class="product-detail-raw">
        <summary>查看完整原始详情</summary>
        <pre>{{ store.productDetailRawJson.value }}</pre>
      </details>
    </template>
  </el-dialog>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
