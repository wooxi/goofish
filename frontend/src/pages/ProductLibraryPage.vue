<template>
  <div class="space-y-4">
    <el-card class="panel-card">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <el-tabs v-model="store.productLibraryTab.value" class="library-tabs" @tab-change="handleLibraryTabChange">
          <el-tab-pane label="全部商品" name="products" />
          <el-tab-pane label="模板库" name="templates" />
        </el-tabs>

        <el-button type="primary" @click="openCreateDrawer" class="publish-btn">+ 发布新商品</el-button>
      </div>

      <template v-if="store.productLibraryTab.value === 'products'">
        <el-alert
          v-if="!store.configReady.value"
          title="请先完成授权设置（AppKey + AppSecret）"
          type="warning"
          show-icon
          class="mb-4"
        />

        <el-alert v-if="store.productsError.value" :title="store.productsError.value" type="error" show-icon closable class="mb-4" />

        <div class="products-query-tools mb-4">
          <span class="products-query-tools__label">筛选与排序：</span>
          <el-select
            :model-value="store.productFilters.product_status"
            placeholder="销售状态"
            style="width: 170px"
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
            style="width: 190px"
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
            style="width: 170px"
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
          <el-button size="small" @click="store.resetProductsQueryControls">重置</el-button>
          <el-button type="success" size="small" @click="store.queryProducts" :loading="store.queryingProducts.value">查询商品</el-button>
        </div>

        <el-skeleton v-if="store.queryingProducts.value && store.products.value.length === 0" :rows="7" animated class="section-skeleton mb-4" />

        <template v-else>
          <div v-if="store.products.value.length > 0" class="result-info result-info--products">
            <div class="result-info-main">
              <span>共 <strong>{{ store.pagination.count }}</strong> 件商品（本页 {{ store.products.value.length }} 条）</span>
              <div class="pagination-info">
                <span>第 {{ store.pagination.page_no }} 页</span>
                <span>每页 {{ store.pagination.page_size }} 条</span>
                <span class="selected-count">已选 {{ store.selectedProductIds.value.length }} 件</span>
              </div>
            </div>
            <div class="header-actions">
              <el-select :model-value="store.productQuery.page_size" style="width: 126px" size="small" @change="store.handleProductsPageSizeChange">
                <el-option v-for="size in store.PRODUCT_PAGE_SIZE_OPTIONS" :key="size" :label="`每页 ${size} 条`" :value="size" />
              </el-select>
              <el-button size="small" @click="store.clearProductSelection" :disabled="store.selectedProductIds.value.length === 0">清空</el-button>
              <el-button type="warning" size="small" @click="store.openBatchPublishWithSelection" :loading="store.creatingInlineBatchPublishTask.value" :disabled="store.selectedProductIds.value.length === 0">上架已选</el-button>
              <el-button type="danger" plain size="small" @click="store.openBatchDownShelfWithSelection" :loading="store.creatingInlineBatchDownshelfTask.value" :disabled="store.selectedProductIds.value.length === 0">下架已选</el-button>
              <el-button type="danger" size="small" @click="store.openBatchDeleteWithSelection" :loading="store.creatingInlineBatchDeleteTask.value" :disabled="store.selectedProductIds.value.length === 0">删除已选</el-button>
            </div>
          </div>

          <el-alert v-if="store.inlineTaskNotice.value" :title="store.inlineTaskNotice.value" type="success" show-icon closable class="mb-4" />

          <div v-if="store.products.value.length > 0" class="table-scroll">
            <el-table
              :data="store.products.value"
              stripe
              class="data-table products-table"
              row-key="product_id"
              @selection-change="store.handleProductSelectionChange"
            >
              <el-table-column type="selection" width="52" reserve-selection />
              <el-table-column prop="product_id" label="商品编号" width="170" />
              <el-table-column label="商品标题" min-width="260" show-overflow-tooltip>
                <template #default="scope">
                  <el-button link type="primary" class="product-title-link" @click="store.openProductDetail(scope.row)">
                    {{ scope.row.title || `商品-${scope.row.product_id || '-'}` }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="价格" width="110">
                <template #default="scope"><span class="price">{{ scope.row.price_str }}</span></template>
              </el-table-column>
              <el-table-column prop="stock" label="库存" width="80" />
              <el-table-column prop="sold" label="销量" width="80" />
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="store.getStatusType(scope.row.product_status)" size="small">{{ scope.row.product_status_str }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button link type="primary" @click="createTemplateFromProduct(scope.row)">生成模板</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="store.products.value.length > 0" class="pagination-wrap">
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

          <el-empty v-else description="暂无商品数据">
            <el-button type="primary" @click="store.queryProducts" :loading="store.queryingProducts.value">立即查询</el-button>
          </el-empty>
        </template>
      </template>

      <template v-else>
        <el-alert title="模板可复用发布参数，支持从当前表单或商品快速沉淀。" type="info" show-icon :closable="false" class="mb-4" />

        <el-form label-width="100px" class="compact-form mb-4">
          <div class="form-grid">
            <el-form-item label="模板名称" required>
              <el-input v-model.trim="store.templateDraft.name" maxlength="80" placeholder="例如：手机配件通用模板" />
            </el-form-item>
            <el-form-item label="模板说明">
              <el-input v-model.trim="store.templateDraft.description" maxlength="120" placeholder="选填" />
            </el-form-item>
          </div>
        </el-form>

        <div class="op-actions">
          <el-button @click="store.createBlankTemplate" :loading="store.savingTemplate.value">新建空白模板</el-button>
          <el-button type="primary" @click="store.saveCurrentFormAsTemplate" :loading="store.savingTemplate.value">保存当前表单为模板</el-button>
          <el-button @click="store.loadTemplates" :loading="store.templatesLoading.value">刷新模板</el-button>
        </div>

        <el-alert v-if="store.templatesError.value" :title="store.templatesError.value" type="error" show-icon closable class="mb-4" />

        <div v-if="store.templates.value.length > 0" class="table-scroll">
          <el-table :data="store.templates.value" stripe class="data-table products-table">
            <el-table-column prop="name" label="模板名称" min-width="180" />
            <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column label="更新时间" width="180">
              <template #default="scope">{{ store.formatDateTime(scope.row.updated_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button link type="primary" @click="applyTemplateAndOpen(scope.row)">应用到发布抽屉</el-button>
                <el-button link type="danger" @click="store.removeTemplate(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else description="暂无模板">
          <el-button type="primary" @click="openCreateDrawer">去发布商品</el-button>
        </el-empty>
      </template>
    </el-card>

    <ProductDetailDialog />

    <el-drawer
      v-model="createDrawerVisible"
      direction="rtl"
      :size="drawerSize"
      :append-to-body="true"
      :destroy-on-close="false"
      class="publish-drawer"
      title="发布新商品"
    >
      <div class="create-workspace">
        <div class="create-main">
          <div class="op-actions">
            <el-button text @click="store.fillCreateExample">一键填入示例</el-button>
            <el-button text @click="store.resetCreateForm">重置</el-button>
          </div>

          <el-alert v-if="store.createProductError.value" :title="store.createProductError.value" type="error" show-icon closable class="mb-4" />

          <el-form label-width="136px" class="compact-form panel-form">
            <section class="form-section create-block">
              <div class="section-title-row">
                <div class="section-title">基础信息</div>
                <span class="section-badge required">必填</span>
              </div>
              <div class="form-grid">
                <el-form-item class="required-field" label="商品类型" required>
                  <el-select v-model="store.createForm.item_biz_type" style="width: 100%">
                    <el-option v-for="item in store.ITEM_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item class="required-field" label="行业类目" required>
                  <el-select v-model="store.createForm.sp_biz_type" style="width: 100%">
                    <el-option v-for="item in store.SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item class="required-field" label="类目编号" required>
                  <el-input v-model.trim="store.createForm.channel_cat_id" placeholder="例如：e11455" />
                </el-form-item>
                <el-form-item class="required-field" label="售价（分）" required>
                  <el-input-number v-model="store.createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="required-field" label="运费（分）" required>
                  <el-input-number v-model="store.createForm.express_fee" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="required-field" label="库存" required>
                  <el-input-number v-model="store.createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                </el-form-item>
              </div>
            </section>

            <section class="form-section create-block">
              <div class="section-title-row">
                <div class="section-title">店铺与文案</div>
                <span class="section-badge required">必填</span>
              </div>
              <div class="form-grid">
                <el-form-item class="required-field" label="店铺账号" required>
                  <el-select
                    v-model="store.createForm.publish_shop.user_name"
                    filterable
                    allow-create
                    clearable
                    default-first-option
                    placeholder="请选择或输入店铺账号"
                    style="width: 100%"
                  >
                    <el-option v-for="shop in store.shopOptions.value" :key="shop.user_name" :label="shop.label" :value="shop.user_name" />
                  </el-select>
                </el-form-item>
                <el-form-item class="required-field" label="省份代码" required>
                  <el-input-number v-model="store.createForm.publish_shop.province" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="required-field" label="城市代码" required>
                  <el-input-number v-model="store.createForm.publish_shop.city" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="required-field" label="区县代码" required>
                  <el-input-number v-model="store.createForm.publish_shop.district" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="required-field" label="商品标题" required>
                  <el-input v-model.trim="store.createForm.publish_shop.title" maxlength="60" show-word-limit />
                </el-form-item>
              </div>

              <el-form-item class="required-field" label="商品描述" required>
                <el-input v-model="store.createForm.publish_shop.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
              </el-form-item>
              <el-form-item class="required-field" label="图片链接" required>
                <el-input v-model="store.createForm.publish_shop.images_text" type="textarea" :rows="4" placeholder="每行一个链接，也支持逗号分隔" />
              </el-form-item>
            </section>
          </el-form>

          <div class="op-actions create-actions">
            <el-button type="primary" @click="store.createProduct" :loading="store.creatingProduct.value">提交创建</el-button>
            <el-button @click="createDrawerVisible = false">关闭抽屉</el-button>
          </div>

          <div v-if="store.createProductResult.value" class="json-result">
            <pre>{{ store.createProductResult.value }}</pre>
          </div>
        </div>

        <aside class="create-check-card">
          <div class="create-check-header">右侧自检</div>
          <div class="create-check-sub">提交前请确保必填项都已通过</div>
          <ul class="create-check-list">
            <li
              v-for="item in store.createChecklist.value"
              :key="item.key"
              class="create-check-item"
              :class="item.ok ? 'is-ok' : 'is-pending'"
            >
              <div class="item-title">{{ item.label }}</div>
              <div class="item-status">{{ item.ok ? '已完成' : '待完善' }}</div>
              <p class="item-hint">{{ item.hint }}</p>
            </li>
          </ul>
        </aside>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import ProductDetailDialog from '../components/ProductDetailDialog.vue'

const store = inject('goofishWorkspace')
const createDrawerVisible = ref(false)
const drawerSize = computed(() => (store.isCompactViewport.value ? '94vw' : '60vw'))

function openCreateDrawer() {
  createDrawerVisible.value = true
  if (!store.hasBoundShops.value && store.configReady.value) {
    store.queryShops(false, true)
  }
}

function createTemplateFromProduct(row) {
  store.createTemplateFromProductRow(row)
}

function applyTemplateAndOpen(template) {
  store.applyTemplate(template)
  createDrawerVisible.value = true
}

function handleLibraryTabChange(tab) {
  if (tab === 'templates' && store.templates.value.length === 0) {
    store.loadTemplates(true)
  }
  if (tab === 'products' && store.products.value.length === 0 && store.configReady.value) {
    store.queryProducts(false)
  }
}
</script>

<style scoped>
.publish-btn {
  --el-button-bg-color: #4f46e5;
  --el-button-border-color: #4f46e5;
}

:deep(.library-tabs .el-tabs__item.is-active) {
  color: #4f46e5;
}

:deep(.library-tabs .el-tabs__active-bar) {
  background-color: #4f46e5;
}

:deep(.publish-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 10px;
}

@media (max-width: 1280px) {
  .create-workspace {
    grid-template-columns: 1fr;
  }

  .create-check-card {
    position: static;
  }
}
</style>
