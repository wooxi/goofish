<template>
  <div class="page-products">
    <el-card class="panel-card">
      <template #header>
        <div class="card-header">
          <span>📦 商品管理</span>
          <div class="header-actions">
            <el-button type="success" @click="store.queryProducts" :loading="store.queryingProducts.value">🔍 查询商品</el-button>
            <el-button @click="store.refreshProducts" :loading="store.queryingProducts.value" :disabled="!store.configReady.value">🔄 重新查询</el-button>
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
        v-if="store.productsError.value"
        :title="store.productsError.value"
        type="error"
        show-icon
        closable
        class="mb-4"
      />

      <el-alert
        v-if="store.productsRestoredAt.value"
        :title="`已恢复你上次的查询结果（查询时间：${store.productsRestoredAt.value}）`"
        type="info"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <div class="products-query-tools mb-4">
        <span class="products-query-tools__label">筛选与排序：</span>
        <el-select
          :model-value="store.productFilters.product_status"
          placeholder="销售状态"
          style="width: 180px"
          size="small"
          @change="store.handleProductsStatusFilterChange"
        >
          <el-option
            v-for="item in store.productStatusOptions.value"
            :key="`status-${item.value}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          :model-value="store.productFilters.sort_by"
          placeholder="排序字段"
          style="width: 200px"
          size="small"
          @change="store.handleProductsSortFieldChange"
        >
          <el-option
            v-for="item in store.PRODUCT_SORT_FIELD_OPTIONS"
            :key="`sort-field-${item.value || 'default'}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          :model-value="store.productFilters.sort_order"
          placeholder="排序方向"
          style="width: 180px"
          size="small"
          :disabled="!store.productFilters.sort_by"
          @change="store.handleProductsSortOrderChange"
        >
          <el-option
            v-for="item in store.PRODUCT_SORT_ORDER_OPTIONS"
            :key="`sort-order-${item.value}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button size="small" @click="store.resetProductsQueryControls">重置筛选与排序</el-button>
      </div>

      <el-skeleton v-if="store.queryingProducts.value && store.products.value.length === 0" :rows="8" animated class="section-skeleton mb-4" />

      <div v-if="store.products.value.length > 0" class="products-list">
        <div class="result-info result-info--products">
          <div class="result-info-main">
            <span>✅ 查询成功，共 <strong>{{ store.pagination.count }}</strong> 件商品（本页 {{ store.products.value.length }} 条）</span>
            <div class="pagination-info">
              <span>第 {{ store.pagination.page_no }} 页</span>
              <span>共 {{ store.pagination.count }} 条</span>
              <span>每页 {{ store.pagination.page_size }} 条</span>
              <span class="selected-count">已选 {{ store.selectedProductIds.value.length }} 件</span>
            </div>
            <span v-if="store.productsFetchedAt.value" class="latest-query-time">🕒 最新查询时间：{{ store.productsFetchedAt.value }}</span>
          </div>
          <div class="header-actions">
            <el-select
              :model-value="store.productQuery.page_size"
              style="width: 128px"
              size="small"
              @change="store.handleProductsPageSizeChange"
            >
              <el-option v-for="size in store.PRODUCT_PAGE_SIZE_OPTIONS" :key="size" :label="`每页 ${size} 条`" :value="size" />
            </el-select>
            <el-button size="small" @click="store.clearProductSelection" :disabled="store.selectedProductIds.value.length === 0">清空已选</el-button>
            <el-button type="warning" size="small" @click="store.openBatchPublishWithSelection" :loading="store.creatingInlineBatchPublishTask.value" :disabled="store.selectedProductIds.value.length === 0">📚 上架已选商品</el-button>
            <el-button type="danger" plain size="small" @click="store.openBatchDownShelfWithSelection" :loading="store.creatingInlineBatchDownshelfTask.value" :disabled="store.selectedProductIds.value.length === 0">📥 下架已选商品</el-button>
            <el-button type="danger" size="small" @click="store.openBatchDeleteWithSelection" :loading="store.creatingInlineBatchDeleteTask.value" :disabled="store.selectedProductIds.value.length === 0">🗑️ 删除已选商品</el-button>
            <el-button size="small" @click="goToCallbackRecords">📨 查看处理结果</el-button>
          </div>
        </div>

        <el-alert
          v-if="store.inlineTaskNotice.value"
          :title="store.inlineTaskNotice.value"
          type="success"
          show-icon
          closable
          class="mb-4"
        />

        <div class="table-scroll">
          <el-table
            :data="store.products.value"
            stripe
            class="data-table products-table"
            row-key="product_id"
            @selection-change="store.handleProductSelectionChange"
          >
            <el-table-column type="selection" width="52" reserve-selection />
            <el-table-column prop="product_id" label="商品编号" width="180" />
            <el-table-column label="商品标题" min-width="300" show-overflow-tooltip>
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  class="product-title-link"
                  @click="store.openProductDetail(scope.row)"
                >
                  {{ scope.row.title || `商品-${scope.row.product_id || '-'}` }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="价格" width="120">
              <template #default="scope">
                <span class="price">💰 {{ scope.row.price_str }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80" />
            <el-table-column prop="sold" label="销量" width="80" />
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="store.getStatusType(scope.row.product_status)" size="small">
                  {{ scope.row.product_status_str }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="快捷操作" width="150">
              <template #default="scope">
                <el-button link type="primary" @click="store.createTemplateFromProductRow(scope.row)">生成模板</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrap">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="store.productQuery.page_no"
            :page-size="store.productQuery.page_size"
            :total="store.pagination.count"
            :disabled="store.queryingProducts.value"
            @current-change="store.handleProductsCurrentPageChange"
          />
        </div>
      </div>

      <el-empty v-else-if="store.productsQueried.value" description="当前暂无商品数据" />
    </el-card>

    <ProductDetailDialog />
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import ProductDetailDialog from '../components/ProductDetailDialog.vue'

const store = inject('goofishWorkspace')
const router = useRouter()

function goToCallbackRecords() {
  store.handleMenuSelect('callback')
  store.loadProcessingResults(true)
  router.push({ name: 'callback' })
}
</script>
