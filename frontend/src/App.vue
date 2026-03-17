<template>
  <div class="goofish-layout">
    <el-container class="layout-root">
      <el-aside width="240px" class="sidebar" :class="{ 'is-compact': isCompactViewport }">
        <div class="brand">
          <div class="brand-title">🐟 Goofish</div>
          <div class="brand-subtitle">闲鱼商家工作台</div>
        </div>

        <el-menu
          :default-active="activeMenu"
          :mode="menuMode"
          :ellipsis="false"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="config">⚙️ 店铺授权设置</el-menu-item>
          <el-menu-item index="shops">🏪 已绑定店铺</el-menu-item>
          <el-menu-item index="products">📦 商品管理</el-menu-item>
          <el-menu-item index="orders">🧾 订单查询</el-menu-item>
          <el-menu-item index="templates">🧩 模板中心</el-menu-item>
          <el-menu-item index="create">➕ 发布新商品</el-menu-item>
          <el-menu-item index="callback">📨 处理结果</el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="workspace">
        <div class="workspace-header">
          <h2>{{ currentMenuTitle }}</h2>
          <p>{{ currentMenuDesc }}</p>
        </div>

        <!-- API 配置 -->
        <el-card v-show="activeMenu === 'config'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>⚙️ 店铺授权设置</span>
              <el-button type="primary" @click="saveConfig" :loading="saving">💾 保存并生效</el-button>
            </div>
          </template>

          <el-alert
            v-if="configLoadedFromBackend"
            :title="`已读取已保存授权：AppKey=${config.appid || '-'}，${hasSavedSecret ? 'AppSecret 已保存' : 'AppSecret 未保存'}`"
            type="success"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="binding-status-card mb-4">
            <div class="binding-status-title">授权保存状态</div>
            <div class="binding-status-grid">
              <div class="binding-status-item" :class="{ saved: bindingStatus.appidSaved }">
                <span class="label">AppKey（应用ID）</span>
                <span class="value">{{ bindingStatus.appidSaved ? '已保存' : '未保存' }}</span>
              </div>
              <div class="binding-status-item" :class="{ saved: bindingStatus.sellerIdSaved }">
                <span class="label">商家ID（选填）</span>
                <span class="value">{{ bindingStatus.sellerIdSaved ? '已保存' : '未保存' }}</span>
              </div>
              <div class="binding-status-item" :class="{ saved: bindingStatus.secretSaved }">
                <span class="label">AppSecret（密钥）</span>
                <span class="value">{{ bindingStatus.secretSaved ? '已保存' : '未保存' }}</span>
              </div>
            </div>
            <div class="binding-status-desc">{{ bindingStatusDesc }}</div>
          </div>

          <el-form :model="config" label-width="140px" size="large" class="panel-form">
            <el-form-item label="AppKey（应用ID）" required>
              <el-input v-model="config.appid" placeholder="请输入平台提供的 AppKey（数字）" type="number" />
            </el-form-item>
            <el-form-item label="AppSecret">
              <el-input
                v-model="config.appsecret"
                placeholder="如不修改可留空，系统会沿用已保存密钥"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="商家ID（选填）">
              <el-input v-model="config.seller_id" placeholder="选填：用于锁定指定商家" type="number" />
            </el-form-item>
            <el-form-item label="最后更新">
              <span class="update-time">{{ config.updated_at || '暂无记录' }}</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 店铺查询 -->
        <el-card v-show="activeMenu === 'shops'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🏪 已绑定店铺</span>
              <div class="header-actions">
                <el-button type="success" @click="queryShops" :loading="querying">🔍 查询店铺</el-button>
                <el-button @click="refreshShops" :loading="querying" :disabled="!configReady">🔄 重新查询</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成店铺授权（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <el-alert
            v-if="lastError"
            :title="lastError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />

          <el-alert
            v-if="shopsRestoredAt"
            :title="`已恢复你上次的查询结果（查询时间：${shopsRestoredAt}）`"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div v-if="shops.length > 0" class="shops-list">
            <div class="result-info">
              <span>✅ 查询成功，共 <strong>{{ shops.length }}</strong> 个店铺</span>
              <span v-if="queryTime">⏱️ 耗时：{{ queryTime }}</span>
              <span v-if="shopsFetchedAt">🕒 查询时间：{{ shopsFetchedAt }}</span>
            </div>

            <div class="table-scroll">
              <el-table :data="shops" stripe class="data-table shops-table">
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
                  <span :class="getExpireClass(scope.row.authorize_expires)">
                    📅 {{ scope.row.authorize_expires_str || '未知' }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
            </div>
          </div>

          <el-empty v-else-if="queried" description="暂未查到店铺，请先确认授权是否有效" />
        </el-card>

        <!-- 商品列表 -->
        <el-card v-show="activeMenu === 'products'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📦 商品管理</span>
              <div class="header-actions">
                <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 查询商品</el-button>
                <el-button @click="refreshProducts" :loading="queryingProducts" :disabled="!configReady">🔄 重新查询</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成店铺授权（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <el-alert
            v-if="productsError"
            :title="productsError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />

          <el-alert
            v-if="productsRestoredAt"
            :title="`已恢复你上次的查询结果（查询时间：${productsRestoredAt}）`"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="products-query-tools mb-4">
            <span class="products-query-tools__label">筛选与排序：</span>
            <el-select
              :model-value="productFilters.product_status"
              placeholder="销售状态"
              style="width: 180px"
              size="small"
              @change="handleProductsStatusFilterChange"
            >
              <el-option
                v-for="item in productStatusOptions"
                :key="`status-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              :model-value="productFilters.sort_by"
              placeholder="排序字段"
              style="width: 200px"
              size="small"
              @change="handleProductsSortFieldChange"
            >
              <el-option
                v-for="item in PRODUCT_SORT_FIELD_OPTIONS"
                :key="`sort-field-${item.value || 'default'}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              :model-value="productFilters.sort_order"
              placeholder="排序方向"
              style="width: 180px"
              size="small"
              :disabled="!productFilters.sort_by"
              @change="handleProductsSortOrderChange"
            >
              <el-option
                v-for="item in PRODUCT_SORT_ORDER_OPTIONS"
                :key="`sort-order-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button size="small" @click="resetProductsQueryControls">重置筛选与排序</el-button>
          </div>

          <div v-if="products.length > 0" class="products-list">
            <div class="result-info result-info--products">
              <div class="result-info-main">
                <span>✅ 查询成功，共 <strong>{{ pagination.count }}</strong> 件商品（本页 {{ products.length }} 条）</span>
                <div class="pagination-info">
                  <span>第 {{ pagination.page_no }} 页</span>
                  <span>共 {{ pagination.count }} 条</span>
                  <span>每页 {{ pagination.page_size }} 条</span>
                  <span class="selected-count">已选 {{ selectedProductIds.length }} 件</span>
                </div>
                <span v-if="productsFetchedAt" class="latest-query-time">🕒 最新查询时间：{{ productsFetchedAt }}</span>
              </div>
              <div class="header-actions">
                <el-select
                  :model-value="productQuery.page_size"
                  style="width: 128px"
                  size="small"
                  @change="handleProductsPageSizeChange"
                >
                  <el-option v-for="size in PRODUCT_PAGE_SIZE_OPTIONS" :key="size" :label="`每页 ${size} 条`" :value="size" />
                </el-select>
                <el-button size="small" @click="clearProductSelection" :disabled="selectedProductIds.length === 0">清空已选</el-button>
                <el-button type="warning" size="small" @click="openBatchPublishWithSelection" :loading="creatingInlineBatchPublishTask" :disabled="selectedProductIds.length === 0">📚 上架已选商品</el-button>
                <el-button type="danger" plain size="small" @click="openBatchDownShelfWithSelection" :loading="creatingInlineBatchDownshelfTask" :disabled="selectedProductIds.length === 0">📥 下架已选商品</el-button>
                <el-button type="danger" size="small" @click="openBatchDeleteWithSelection" :loading="creatingInlineBatchDeleteTask" :disabled="selectedProductIds.length === 0">🗑️ 删除已选商品</el-button>
                <el-button size="small" @click="goToCallbackRecords">📨 查看处理结果</el-button>
              </div>
            </div>

            <el-alert
              v-if="inlineTaskNotice"
              :title="inlineTaskNotice"
              type="success"
              show-icon
              closable
              class="mb-4"
            />

            <div class="table-scroll">
              <el-table
                :data="products"
                stripe
                class="data-table products-table"
                row-key="product_id"
                @selection-change="handleProductSelectionChange"
              >
                <el-table-column type="selection" width="52" reserve-selection />
                <el-table-column prop="product_id" label="商品编号" width="180" />
                <el-table-column label="商品标题" min-width="300" show-overflow-tooltip>
                  <template #default="scope">
                    <el-button
                      link
                      type="primary"
                      class="product-title-link"
                      @click="openProductDetail(scope.row)"
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
                    <el-tag :type="getStatusType(scope.row.product_status)" size="small">
                      {{ scope.row.product_status_str }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="快捷操作" width="150">
                  <template #default="scope">
                    <el-button link type="primary" @click="createTemplateFromProductRow(scope.row)">生成模板</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="pagination-wrap">
              <el-pagination
                background
                layout="total, prev, pager, next"
                :current-page="productQuery.page_no"
                :page-size="productQuery.page_size"
                :total="pagination.count"
                :disabled="queryingProducts"
                @current-change="handleProductsCurrentPageChange"
              />
            </div>
          </div>

          <el-empty v-else-if="productsQueried" description="当前暂无商品数据" />
        </el-card>

        <!-- 订单列表 -->
        <el-card v-show="activeMenu === 'orders'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🧾 订单查询</span>
              <div class="header-actions">
                <el-button type="success" @click="queryOrders" :loading="queryingOrders">🔍 查询订单</el-button>
                <el-button @click="refreshOrders" :loading="queryingOrders" :disabled="!configReady">🔄 重新查询</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成店铺授权（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <el-alert
            v-if="ordersError"
            :title="ordersError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />

          <el-alert
            v-if="ordersRestoredAt"
            :title="`已恢复你上次的查询结果（查询时间：${ordersRestoredAt}）`"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="products-query-tools mb-4">
            <span class="products-query-tools__label">筛选与排序：</span>
            <el-select
              :model-value="orderFilters.order_status"
              placeholder="订单状态"
              style="width: 180px"
              size="small"
              @change="handleOrdersStatusFilterChange"
            >
              <el-option
                v-for="item in orderStatusOptions"
                :key="`order-status-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              :model-value="orderFilters.sort_by"
              placeholder="排序字段"
              style="width: 200px"
              size="small"
              @change="handleOrdersSortFieldChange"
            >
              <el-option
                v-for="item in ORDER_SORT_FIELD_OPTIONS"
                :key="`order-sort-field-${item.value || 'default'}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              :model-value="orderFilters.sort_order"
              placeholder="排序方向"
              style="width: 180px"
              size="small"
              :disabled="!orderFilters.sort_by"
              @change="handleOrdersSortOrderChange"
            >
              <el-option
                v-for="item in ORDER_SORT_ORDER_OPTIONS"
                :key="`order-sort-order-${item.value}`"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button size="small" @click="resetOrdersQueryControls">重置筛选与排序</el-button>
          </div>

          <div v-if="orders.length > 0" class="orders-list">
            <div class="result-info result-info--products">
              <div class="result-info-main">
                <span>✅ 查询成功，共 <strong>{{ ordersPagination.count }}</strong> 条订单（本页 {{ orders.length }} 条）</span>
                <div class="pagination-info">
                  <span>第 {{ ordersPagination.page_no }} 页</span>
                  <span>共 {{ ordersPagination.count }} 条</span>
                  <span>每页 {{ ordersPagination.page_size }} 条</span>
                </div>
                <span v-if="ordersFetchedAt" class="latest-query-time">🕒 最新查询时间：{{ ordersFetchedAt }}</span>
              </div>
              <div class="header-actions">
                <el-select
                  :model-value="orderQuery.page_size"
                  style="width: 128px"
                  size="small"
                  @change="handleOrdersPageSizeChange"
                >
                  <el-option v-for="size in ORDER_PAGE_SIZE_OPTIONS" :key="`order-size-${size}`" :label="`每页 ${size} 条`" :value="size" />
                </el-select>
              </div>
            </div>

            <div class="table-scroll">
              <el-table :data="orders" stripe class="data-table orders-table">
                <el-table-column label="订单号" min-width="220">
                  <template #default="scope">
                    <el-button
                      link
                      type="primary"
                      class="order-id-link"
                      @click="openOrderDetail(scope.row)"
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
                <el-table-column prop="order_status_text" label="订单状态" width="150" />
                <el-table-column prop="buyer_name" label="买家" width="160" />
                <el-table-column prop="seller_name" label="卖家" width="160" />
                <el-table-column prop="created_at_text" label="下单时间" width="180" />
              </el-table>
            </div>

            <div class="pagination-wrap">
              <el-pagination
                background
                layout="total, prev, pager, next"
                :current-page="orderQuery.page_no"
                :page-size="orderQuery.page_size"
                :total="ordersPagination.count"
                :disabled="queryingOrders"
                @current-change="handleOrdersCurrentPageChange"
              />
            </div>
          </div>

          <el-empty v-else-if="ordersQueried" description="当前暂无订单数据" />
        </el-card>

        <!-- 模板快捷创建 -->
        <el-card v-show="activeMenu === 'templates'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🧩 模板中心</span>
              <div class="header-actions">
                <el-button @click="loadTemplates()" :loading="templatesLoading">🔄 刷新模板</el-button>
                <el-button type="primary" @click="activeMenu = 'create'">➕ 去创建商品</el-button>
              </div>
            </div>
          </template>

          <el-alert
            title="你可以新建模板、保存当前填写内容、删除模板，或一键套用；也支持从已选商品快速生成模板。"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-alert
            title="从已有商品生成模板时，如商品详情不完整（如缺少图片或长描述），系统会自动沿用你当前表单里的内容。"
            type="warning"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-form label-width="120px" class="compact-form panel-form mb-4">
            <div class="form-grid">
              <el-form-item label="模板名称" required>
                <el-input v-model.trim="templateDraft.name" maxlength="80" placeholder="例如：手机配件通用模板" />
              </el-form-item>
              <el-form-item label="模板说明">
                <el-input v-model.trim="templateDraft.description" maxlength="120" placeholder="选填，便于团队理解用途" />
              </el-form-item>
            </div>
          </el-form>

          <div class="op-actions">
            <el-button @click="createBlankTemplate" :loading="savingTemplate">新建空白模板</el-button>
            <el-button type="primary" @click="saveCurrentFormAsTemplate" :loading="savingTemplate">将当前表单保存为模板</el-button>
            <el-button @click="createTemplateFromSelectedProduct" :disabled="selectedProductRows.length !== 1" :loading="savingTemplate">从已选商品生成模板</el-button>
          </div>

          <el-alert v-if="templatesError" :title="templatesError" type="error" show-icon closable class="mb-4" />

          <div class="table-scroll" v-if="templates.length > 0">
            <el-table :data="templates" stripe class="data-table products-table">
              <el-table-column prop="name" label="模板名称" min-width="180" />
              <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
              <el-table-column prop="source" label="来源" width="120" />
              <el-table-column label="更新时间" width="180">
                <template #default="scope">{{ formatDateTime(scope.row.updated_at) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="210">
                <template #default="scope">
                  <el-button link type="primary" @click="applyTemplate(scope.row)">应用并去创建</el-button>
                  <el-button link type="danger" @click="removeTemplate(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="还没有模板，先保存一个常用模板吧" />
        </el-card>

        <!-- 商品创建 -->
        <el-card v-show="activeMenu === 'create'" class="panel-card create-panel-card">
          <template #header>
            <div class="card-header">
              <span>➕ 发布新商品</span>
              <div class="header-actions">
                <el-button text @click="fillCreateExample">一键填入示例</el-button>
                <el-button text @click="resetCreateForm">重置</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成店铺授权（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <section class="create-guide">
            <div class="create-guide-title">发布信息填写区</div>
            <p>按提示填写商品信息。左侧填写内容，右侧会实时提醒还差哪些必填项。</p>
          </section>

          <el-alert
            v-if="!hasBoundShops"
            :title="shopBindingHint"
            type="warning"
            show-icon
            :closable="false"
            class="mb-4"
          />
          <el-alert
            v-else
            :title="shopBindingHint"
            type="success"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="create-workspace">
            <div class="create-main">
              <el-form label-width="146px" class="compact-form panel-form create-form">
                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">商品基础信息</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <div class="form-grid">
                    <el-form-item class="key-field required-field" label="商品类型" required>
                      <el-select v-model="createForm.item_biz_type" placeholder="请选择商品类型" style="width: 100%">
                        <el-option
                          v-for="item in ITEM_BIZ_TYPE_OPTIONS"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                      <div class="field-meta">请选择最贴近商品实际情况的类型</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="行业类目" required>
                      <el-select v-model="createForm.sp_biz_type" placeholder="请选择行业类目" style="width: 100%">
                        <el-option v-for="item in SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                      <div class="field-meta">选择行业类目，影响审核和曝光</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="商品类目编号" required>
                      <el-input v-model.trim="createForm.channel_cat_id" placeholder="例如：e11455（可在平台类目选择器复制）" />
                      <div class="field-meta">请填写平台类目编号</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="售价（单位：分）" required>
                      <el-input-number v-model="createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
                      <div class="field-meta">100 分 = 1 元，例如 19900 表示 199 元</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="运费（单位：分）" required>
                      <el-input-number v-model="createForm.express_fee" :step="1" style="width: 100%" />
                      <div class="field-meta">包邮填 0；不包邮请填实际运费</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="库存数量" required>
                      <el-input-number v-model="createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                      <div class="field-meta">可售数量范围 1~399960，建议与真实库存一致</div>
                    </el-form-item>
                  </div>
                </section>

                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">发货与店铺信息</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <div class="form-grid">
                    <el-form-item class="key-field required-field" label="发布店铺账号" required>
                      <el-select
                        v-model="createForm.publish_shop.user_name"
                        filterable
                        allow-create
                        clearable
                        default-first-option
                        placeholder="请选择或输入店铺账号"
                        style="width: 100%"
                      >
                        <el-option
                          v-for="shop in shopOptions"
                          :key="shop.user_name"
                          :label="shop.label"
                          :value="shop.user_name"
                        />
                      </el-select>
                      <div class="field-meta">{{ shopBindingHint }}</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货省份代码" required>
                      <el-input-number v-model="createForm.publish_shop.province" :step="1" style="width: 100%" />
                      <div class="field-meta">按平台地区码填写，例如 330000</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货城市代码" required>
                      <el-input-number v-model="createForm.publish_shop.city" :step="1" style="width: 100%" />
                      <div class="field-meta">按平台地区码填写，例如 330100</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货区县代码" required>
                      <el-input-number v-model="createForm.publish_shop.district" :step="1" style="width: 100%" />
                      <div class="field-meta">按平台地区码填写，例如 330106</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="商品标题" required>
                      <el-input v-model.trim="createForm.publish_shop.title" maxlength="60" show-word-limit />
                      <div class="field-meta">建议包含品牌/型号/成色，最多 60 字</div>
                    </el-form-item>
                  </div>
                </section>

                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">图片与描述</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <el-form-item class="key-field required-field" label="商品描述" required>
                    <el-input v-model="createForm.publish_shop.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
                    <div class="field-meta">建议写清成色、功能、配件和售后说明</div>
                  </el-form-item>
                  <el-form-item class="key-field required-field" label="商品图片链接" required>
                    <el-input
                      v-model="createForm.publish_shop.images_text"
                      type="textarea"
                      :rows="4"
                      placeholder="每行一个图片链接，也支持用逗号分隔"
                    />
                    <div class="field-meta">已识别 {{ createImages.length }} 张，建议 1~30 张且不要重复</div>
                  </el-form-item>
                </section>

                <section class="form-section subtle create-block">
                  <el-collapse v-model="createOptionalPanels" class="optional-collapse">
                    <el-collapse-item name="advanced">
                      <template #title>
                        <div class="collapse-title-row">
                          <span class="section-title">更多补充信息（可选）</span>
                          <span class="section-badge optional">默认收起</span>
                        </div>
                      </template>
                      <el-form-item label="启用高级补充">
                        <el-switch v-model="createAdvancedEnabled" />
                        <span class="switch-tip">仅在你明确需要额外参数时开启</span>
                      </el-form-item>
                      <el-form-item v-if="createAdvancedEnabled" label="补充参数（JSON）">
                        <el-input
                          v-model="createAdvancedJson"
                          type="textarea"
                          :rows="8"
                          class="json-input"
                          placeholder='例如：{"channel_pv":[...],"outer_id":"123"}'
                        />
                      </el-form-item>
                    </el-collapse-item>
                  </el-collapse>
                </section>
              </el-form>

              <div class="op-actions create-actions">
                <el-button type="primary" @click="createProduct" :loading="creatingProduct">➕ 提交创建</el-button>
              </div>

              <el-alert
                v-if="createProductError"
                :title="createProductError"
                type="error"
                show-icon
                closable
                class="mb-4"
              />
              <div v-if="createProductResult" class="json-result">
                <pre>{{ createProductResult }}</pre>
              </div>
            </div>

            <aside class="create-check-card">
              <div class="create-check-header">提交前自检</div>
              <div class="create-check-sub">系统会实时检查必填项和关键规则，提交前先看一眼更稳妥</div>

              <ul class="create-check-list">
                <li
                  v-for="item in createChecklist"
                  :key="item.key"
                  class="create-check-item"
                  :class="item.ok ? 'is-ok' : 'is-pending'"
                >
                  <div class="item-title">{{ item.label }}</div>
                  <div class="item-status">{{ item.ok ? '已完成' : '待完善' }}</div>
                  <p class="item-hint">{{ item.hint }}</p>
                </li>
              </ul>

              <div class="create-constraint-box">
                <div class="constraint-title">填写小贴士</div>
                <ul>
                  <li v-for="tip in CREATE_CONSTRAINT_TIPS" :key="tip">{{ tip }}</li>
                </ul>
              </div>
            </aside>
          </div>
        </el-card>

        <!-- 回调状态 -->
        <el-card v-show="activeMenu === 'callback'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📨 处理结果（最近记录）</span>
              <el-button size="small" @click="loadProcessingResults" :loading="callbackLoading || localTaskLoading">🔄 刷新</el-button>
            </div>
          </template>

          <div class="callback-header-row">
            <span class="callback-tip">处理结果页会同时展示：①本地任务记录（批量上架/下架/删除）②平台回调记录</span>
          </div>

          <el-alert
            v-if="localTaskError"
            :title="localTaskError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />
          <el-alert
            v-if="callbackError"
            :title="callbackError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />

          <div v-if="localTaskRecords.length > 0" class="mb-4">
            <div class="section-title-row">
              <div class="section-title">🧵 本地任务记录（批量上架/下架/删除）</div>
            </div>
            <div class="table-scroll">
              <el-table :data="localTaskRecords" stripe class="data-table callback-table">
                <el-table-column prop="updated_at" label="最近更新时间" width="180">
                  <template #default="scope">{{ formatDateTime(scope.row.updated_at || scope.row.created_at) }}</template>
                </el-table-column>
                <el-table-column prop="task_type_text" label="任务类型" width="130" />
                <el-table-column label="任务状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getTaskStatusType(scope.row.status)">{{ scope.row.status_text || scope.row.status }}</el-tag>
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

          <div v-if="callbackRecords.length > 0">
            <div class="section-title-row">
              <div class="section-title">🔔 平台回调记录</div>
            </div>
            <div class="table-scroll">
              <el-table :data="callbackRecords" stripe class="data-table callback-table">
                <el-table-column prop="received_at" label="接收时间" width="180">
                  <template #default="scope">{{ formatDateTime(scope.row.received_at) }}</template>
                </el-table-column>
                <el-table-column prop="task_type" label="任务类型" width="120" />
                <el-table-column prop="task_result" label="处理结果" width="120" />
                <el-table-column prop="err_code" label="错误码" width="150" />
                <el-table-column prop="err_msg" label="失败原因" min-width="220" show-overflow-tooltip />
                <el-table-column prop="product_id" label="商品编号" width="140" />
                <el-table-column prop="publish_status" label="上架状态" width="130" />
                <el-table-column prop="user_name" label="店铺账号" width="150" />
                <el-table-column prop="task_time" label="处理时间" width="180">
                  <template #default="scope">{{ formatCallbackTime(scope.row.task_time) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <el-empty v-if="localTaskRecords.length === 0 && callbackRecords.length === 0" description="暂时没有处理记录" />
        </el-card>
      </el-main>
    </el-container>

    <el-dialog
      v-model="productDetailDialogVisible"
      width="760px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="product-detail-dialog__header">
          <span>🧾 商品详情</span>
          <span v-if="productDetailProductId" class="product-detail-dialog__id">商品编号：{{ productDetailProductId }}</span>
        </div>
      </template>

      <el-skeleton v-if="productDetailLoading" :rows="8" animated />

      <template v-else>
        <el-alert
          v-if="productDetailError"
          :title="productDetailError"
          type="warning"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <section class="product-detail-overview">
          <div class="product-detail-overview__title-wrap">
            <h3>{{ productDetailDisplay.title }}</h3>
            <el-tag v-if="productDetailDisplay.statusCode !== null" :type="getStatusType(productDetailDisplay.statusCode)" size="small">
              {{ productDetailDisplay.statusText }}
            </el-tag>
            <span v-else class="product-detail-overview__status-text">{{ productDetailDisplay.statusText }}</span>
          </div>
          <p class="product-detail-overview__meta">
            商品编号：{{ productDetailProductId || '-' }}
            <span class="dot">•</span>
            店铺账号：{{ productDetailDisplay.userName }}
          </p>
        </section>

        <div class="product-detail-metrics">
          <div class="metric-card">
            <div class="label">售价</div>
            <div class="value value--price">{{ productDetailDisplay.priceText }}</div>
          </div>
          <div class="metric-card">
            <div class="label">原价</div>
            <div class="value">{{ productDetailDisplay.originalPriceText }}</div>
          </div>
          <div class="metric-card">
            <div class="label">库存</div>
            <div class="value">{{ productDetailDisplay.stockText }}</div>
          </div>
          <div class="metric-card">
            <div class="label">销量</div>
            <div class="value">{{ productDetailDisplay.soldText }}</div>
          </div>
          <div class="metric-card">
            <div class="label">运费</div>
            <div class="value">{{ productDetailDisplay.expressFeeText }}</div>
          </div>
        </div>

        <div class="product-detail-main-grid">
          <section class="product-detail-section product-detail-section--description">
            <h4>📝 商品描述</h4>
            <div class="product-detail-description-box">
              {{ productDetailDisplay.content || '暂无商品描述' }}
            </div>
          </section>

          <section class="product-detail-section product-detail-section--images">
            <h4>🖼️ 商品图片（{{ productDetailImageUrls.length }}）</h4>
            <div v-if="productDetailImageUrls.length > 0" class="product-detail-image-grid">
              <div v-for="(url, index) in productDetailImageUrls" :key="`${url}-${index}`" class="product-detail-image-item">
                <el-image
                  :src="url"
                  fit="cover"
                  class="product-detail-image"
                  :preview-src-list="productDetailImageUrls"
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

        <details v-if="productDetailRawJson" class="product-detail-raw">
          <summary>查看完整原始详情</summary>
          <pre>{{ productDetailRawJson }}</pre>
        </details>
      </template>
    </el-dialog>

    <el-dialog
      v-model="orderDetailDialogVisible"
      width="860px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="product-detail-dialog__header">
          <span>📋 订单详情</span>
          <span v-if="orderDetailOrderId" class="product-detail-dialog__id">订单号：{{ orderDetailOrderId }}</span>
        </div>
      </template>

      <el-skeleton v-if="orderDetailLoading" :rows="10" animated />

      <template v-else>
        <el-alert
          v-if="orderDetailError"
          :title="orderDetailError"
          type="warning"
          show-icon
          :closable="false"
          class="mb-4"
        />

        <section class="product-detail-overview">
          <div class="product-detail-overview__title-wrap">
            <h3>{{ orderDetailDisplay.title }}</h3>
            <el-tag type="info" size="small">{{ orderDetailDisplay.statusText }}</el-tag>
          </div>
          <p class="product-detail-overview__meta">
            订单号：{{ orderDetailDisplay.orderId }}
            <span class="dot">•</span>
            金额：{{ orderDetailDisplay.amountText }}
          </p>
        </section>

        <div class="order-detail-grid">
          <section class="product-detail-section">
            <h4>👥 交易信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">{{ orderDetailDisplay.orderId }}</el-descriptions-item>
              <el-descriptions-item label="订单状态">{{ orderDetailDisplay.statusText }}</el-descriptions-item>
              <el-descriptions-item label="买家">{{ orderDetailDisplay.buyerText }}</el-descriptions-item>
              <el-descriptions-item label="卖家">{{ orderDetailDisplay.sellerText }}</el-descriptions-item>
              <el-descriptions-item label="金额">{{ orderDetailDisplay.amountText }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="product-detail-section">
            <h4>⏰ 时间信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="下单时间">{{ orderDetailDisplay.createdAtText }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ orderDetailDisplay.payTimeText }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="product-detail-section">
            <h4>📦 商品信息</h4>
            <div class="table-scroll">
              <el-table :data="orderDetailGoods" stripe class="data-table" empty-text="暂无商品信息">
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
            <div v-if="orderDetailLogistics.length > 0" class="order-logistics-list">
              <div v-for="(item, index) in orderDetailLogistics" :key="`logistics-${index}`" class="order-logistics-card">
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

        <details v-if="orderDetailRawJson" class="product-detail-raw">
          <summary>查看完整原始详情</summary>
          <pre>{{ orderDetailRawJson }}</pre>
        </details>
      </template>
    </el-dialog>

    <footer class="status-bar">
      <span v-if="lastQueryTime">最后店铺查询：{{ lastQueryTime }}</span>
      <span>接口服务状态：{{ backendStatus }}</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8001'
  : `http://${window.location.hostname}:8001`

const SHOP_QUERY_CACHE_KEY = 'goofish:shops-query-cache:v1'
const PRODUCT_QUERY_CACHE_KEY = 'goofish:products-query-cache:v1'
const ORDER_QUERY_CACHE_KEY = 'goofish:orders-query-cache:v1'
const INTERNAL_CALLBACK_PATH = '/api/products/callback/receive'
const PRODUCT_PAGE_SIZE_OPTIONS = [10, 30, 50]
const PRODUCT_SORT_FIELD_OPTIONS = [
  { value: '', label: '默认排序（平台返回顺序）' },
  { value: 'price', label: '按价格排序' },
  { value: 'stock', label: '按库存排序' },
  { value: 'sold', label: '按销量排序' },
  { value: 'status', label: '按状态排序' },
]
const PRODUCT_SORT_ORDER_OPTIONS = [
  { value: 'desc', label: '倒序（从高到低）' },
  { value: 'asc', label: '正序（从低到高）' },
]
const ORDER_PAGE_SIZE_OPTIONS = [10, 30, 50]
const ORDER_SORT_FIELD_OPTIONS = [
  { value: '', label: '默认排序（平台返回顺序）' },
  { value: 'amount', label: '按金额排序' },
  { value: 'status', label: '按订单状态排序' },
  { value: 'created_at', label: '按下单时间排序' },
]
const ORDER_SORT_ORDER_OPTIONS = [
  { value: 'desc', label: '倒序（从高到低）' },
  { value: 'asc', label: '正序（从低到高）' },
]
const DEFAULT_PRODUCT_STATUS_OPTIONS = [
  { value: 22, label: '销售中' },
  { value: 21, label: '仓库中' },
  { value: 31, label: '已下架' },
  { value: 23, label: '已售罄' },
  { value: 33, label: '售出下架' },
  { value: 36, label: '自动下架' },
  { value: -1, label: '已删除' },
]

const ITEM_BIZ_TYPE_OPTIONS = [
  { value: 2, label: '普通商品' },
  { value: 0, label: '已验货商品' },
  { value: 10, label: '验货宝商品' },
  { value: 16, label: '品牌授权商品' },
  { value: 19, label: '闲鱼严选商品' },
  { value: 24, label: '闲鱼特卖商品' },
  { value: 26, label: '品牌捡漏商品' },
  { value: 35, label: '跨境商品' },
]

const SP_BIZ_TYPE_OPTIONS = [
  1, 2, 3, 8, 9, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 33, 99,
].map((value) => ({ value, label: `类目 ${value}` }))

const CREATE_CONSTRAINT_TIPS = [
  '售价、运费、库存请填写整数。',
  '商品标题建议控制在 60 字以内，突出卖点。',
  '商品描述建议 5~5000 字，尽量写清成色与配件。',
  '商品图片建议 1~30 张，尽量清晰且不重复。',
]

const MENU_META = {
  config: { title: '店铺授权设置', desc: '保存 AppKey、AppSecret 等授权信息，后续页面会自动复用。' },
  shops: { title: '已绑定店铺', desc: '查看当前授权下可用店铺，并自动选择默认店铺。' },
  products: { title: '商品管理', desc: '查看商品列表、库存、价格和状态，并支持勾选批量上架、下架、删除。' },
  orders: { title: '订单查询', desc: '查看订单金额、状态、买卖双方和下单时间。' },
  templates: { title: '模板中心', desc: '沉淀常用模板，快速复用创建信息。' },
  create: { title: '发布新商品', desc: '按步骤填写商品信息，提交前可先完成自检。' },
  callback: { title: '处理结果', desc: '查看最近任务进度、结果与失败原因。' },
}

const activeMenu = ref('config')
const viewportWidth = ref(window.innerWidth)
const isCompactViewport = computed(() => viewportWidth.value <= 960)
const menuMode = computed(() => (isCompactViewport.value ? 'horizontal' : 'vertical'))

const currentMenuTitle = computed(() => MENU_META[activeMenu.value]?.title || 'Goofish')
const currentMenuDesc = computed(() => MENU_META[activeMenu.value]?.desc || '')

function syncViewport() {
  viewportWidth.value = window.innerWidth
}

function handleMenuSelect(index) {
  activeMenu.value = index
  if (index === 'callback') {
    loadProcessingResults(true)
  }

  if (['create'].includes(index)) {
    ensureBoundShopsReady()
  }
}

function getInternalCallbackUrl() {
  return `${API_BASE}${INTERNAL_CALLBACK_PATH}`
}

function getDefaultCreateForm() {
  return {
    item_biz_type: 2,
    sp_biz_type: 1,
    channel_cat_id: '',
    price: 1,
    express_fee: 0,
    stock: 1,
    publish_shop: {
      user_name: '',
      province: null,
      city: null,
      district: null,
      title: '',
      content: '',
      images_text: '',
    },
  }
}

// 配置
const config = reactive({
  appid: 0,
  appsecret: '',
  seller_id: null,
  updated_at: '',
})

const hasSavedSecret = ref(false)
const configLoadedFromBackend = ref(false)
const configReady = computed(() => {
  const appidReady = Boolean(config.appid)
  const secretReady = hasSavedSecret.value || Boolean((config.appsecret || '').trim())
  return appidReady && secretReady
})

const bindingStatus = computed(() => {
  const sellerIdValue = config.seller_id
  const sellerIdSaved = !(sellerIdValue === null || sellerIdValue === '' || sellerIdValue === 0)
  return {
    appidSaved: Boolean(config.appid),
    sellerIdSaved,
    secretSaved: hasSavedSecret.value,
  }
})

const bindingStatusDesc = computed(() => {
  const status = bindingStatus.value
  if (status.appidSaved && status.secretSaved) {
    return status.sellerIdSaved
      ? '授权信息已完整保存：AppKey、商家ID、AppSecret 均可长期复用。'
      : '核心授权已完成：AppKey 和 AppSecret 已保存；商家ID可按需补充。'
  }
  return '请至少先保存 AppKey 和 AppSecret，避免刷新页面后授权失效。'
})

// 状态
const saving = ref(false)
const querying = ref(false)
const shops = ref([])
const queried = ref(false)
const lastQueryTime = ref('')
const lastError = ref('')
const queryTime = ref('')
const shopsFetchedAt = ref('')
const shopsRestoredAt = ref('')
const backendStatus = ref('检测中...')

const shopOptions = computed(() => {
  return shops.value
    .map((shop) => {
      const userName = String(shop?.user_name || '').trim()
      if (!userName) return null
      const shopName = String(shop?.shop_name || '').trim()
      const status = shop?.is_valid ? '可用' : '需检查授权'
      return {
        user_name: userName,
        shop_name: shopName,
        is_valid: Boolean(shop?.is_valid),
        is_deposit_enough: Boolean(shop?.is_deposit_enough),
        is_pro: Boolean(shop?.is_pro),
        authorize_expires: Number(shop?.authorize_expires) || 0,
        label: shopName ? `${shopName}（${userName}）·${status}` : `${userName} · ${status}`,
      }
    })
    .filter(Boolean)
})

const hasBoundShops = computed(() => shopOptions.value.length > 0)

function getShopPriorityScore(shop) {
  let score = 0
  if (shop?.is_valid) score += 100
  if (shop?.is_deposit_enough) score += 20
  if (shop?.is_pro) score += 8

  const expires = Number(shop?.authorize_expires) || 0
  const now = Date.now() / 1000
  if (expires > now) {
    const monthsLeft = (expires - now) / 86400 / 30
    score += Math.min(12, Math.max(0, monthsLeft))
  }
  return score
}

const preferredShopOption = computed(() => {
  if (!shopOptions.value.length) return null
  const ranked = [...shopOptions.value].sort((a, b) => getShopPriorityScore(b) - getShopPriorityScore(a))
  return ranked[0]
})

const defaultShopUserName = computed(() => preferredShopOption.value?.user_name || '')

const shopBindingHint = computed(() => {
  if (hasBoundShops.value) {
    const best = preferredShopOption.value
    return best?.shop_name
      ? `已为你优先选择「${best.shop_name}（${best.user_name}）」作为默认店铺，可随时切换。`
      : `已为你自动选择默认店铺账号：${best?.user_name || '-'}`
  }
  return '暂未获取到已绑定店铺。请先到“已绑定店铺”页获取，或先手动填写店铺账号。'
})

function applyDefaultShopUserNames(force = false) {
  const defaultUserName = defaultShopUserName.value
  if (!defaultUserName) return

  if (force || !createForm.publish_shop.user_name) {
    createForm.publish_shop.user_name = defaultUserName
  }
  if (force || !batchPublishForm.user_name) {
    batchPublishForm.user_name = defaultUserName
  }
}

// 商品状态
const queryingProducts = ref(false)
const products = ref([])
const productsQueried = ref(false)
const productsError = ref('')
const productsQueryTime = ref('')
const productsFetchedAt = ref('')
const productsRestoredAt = ref('')
const pagination = reactive({
  count: 0,
  page_no: 1,
  page_size: 10,
})

const productQuery = reactive({
  page_no: 1,
  page_size: 10,
})

function normalizeProductStatusFilter(value) {
  if (value === null || value === undefined || value === '' || value === 'all') return 'all'
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : 'all'
}

function normalizeOrderStatusFilter(value) {
  if (value === null || value === undefined || value === '' || value === 'all') return 'all'
  const parsed = Number(value)
  if (Number.isInteger(parsed)) return parsed
  const text = String(value).trim()
  return text || 'all'
}

const productStatusOptions = ref([{ value: 'all', label: '全部状态' }, ...DEFAULT_PRODUCT_STATUS_OPTIONS])
const productFilters = reactive({
  product_status: 'all',
  sort_by: '',
  sort_order: 'desc',
})

const selectedProductRows = ref([])
const selectedProductIds = computed(() => {
  const ids = selectedProductRows.value
    .map((item) => Number(item?.product_id))
    .filter((id) => Number.isInteger(id) && id > 0)
  return Array.from(new Set(ids))
})

const creatingInlineBatchPublishTask = ref(false)
const creatingInlineBatchDownshelfTask = ref(false)
const creatingInlineBatchDeleteTask = ref(false)
const inlineTaskNotice = ref('')

const productDetailDialogVisible = ref(false)
const productDetailLoading = ref(false)
const productDetailError = ref('')
const productDetail = ref(null)
const productDetailFallbackRow = ref(null)
const productDetailProductId = ref(null)

const productDetailSource = computed(() => {
  const detail = productDetail.value && typeof productDetail.value === 'object' ? productDetail.value : {}
  const fallback = productDetailFallbackRow.value && typeof productDetailFallbackRow.value === 'object'
    ? productDetailFallbackRow.value
    : {}
  return { ...fallback, ...detail }
})

function parseDetailMaybeJson(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  const first = text[0]
  const last = text[text.length - 1]
  if (!((first === '[' && last === ']') || (first === '{' && last === '}'))) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getPublishShopItems(value) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object')
  if (value && typeof value === 'object') return [value]
  const parsed = parseDetailMaybeJson(value)
  if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === 'object')
  if (parsed && typeof parsed === 'object') return [parsed]
  return []
}

function normalizeDetailImageUrl(value) {
  if (typeof value !== 'string') return ''
  let text = value.trim()
  if (!text) return ''
  text = text.replace(/^["'“”‘’`]+/, '').replace(/["'“”‘’`]+$/, '').trim()
  text = text.replace(/[，。；、！!？?）)】\]》」』]+$/g, '').trim()
  return text
}

function collectDetailImageUrls(value, candidates) {
  if (!value) return
  if (Array.isArray(value)) {
    value.forEach((item) => collectDetailImageUrls(item, candidates))
    return
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectDetailImageUrls(item, candidates))
    return
  }

  if (typeof value !== 'string') return

  const parsed = parseDetailMaybeJson(value)
  if (parsed !== null) {
    collectDetailImageUrls(parsed, candidates)
    return
  }

  value
    .split(/[\n,\s]+/g)
    .map((item) => normalizeDetailImageUrl(item))
    .filter((item) => /^https?:\/\//i.test(item))
    .forEach((item) => candidates.push(item))
}

const productDetailDisplay = computed(() => {
  const source = productDetailSource.value
  const statusCode = Number.isInteger(Number(source.product_status)) ? Number(source.product_status) : null
  const statusText = source.product_status_str || (statusCode === null ? '-' : `状态 ${statusCode}`)
  const directContent = String(source.content || '').trim()
  const publishShopContent = getPublishShopItems(source.publish_shop)
    .map((shop) => String(shop?.content || '').trim())
    .find(Boolean)

  return {
    title: String(source.title || '').trim() || `商品-${productDetailProductId.value || '-'}`,
    statusCode,
    statusText,
    priceText: formatPriceDisplay(source.price_str, source.price),
    originalPriceText: formatPriceDisplay(source.original_price_str, source.original_price),
    stockText: formatIntegerDisplay(source.stock),
    soldText: formatIntegerDisplay(source.sold),
    expressFeeText: formatPriceDisplay(source.express_fee_str, source.express_fee),
    userName: String(source.user_name || source.shop_user_name || source.publish_user_name || '').trim() || '-',
    content: directContent || publishShopContent || String(source.description || '').trim(),
  }
})

const productDetailImageUrls = computed(() => {
  const source = productDetailSource.value
  const candidates = []

  collectDetailImageUrls(source.images, candidates)
  collectDetailImageUrls(source.image_urls, candidates)
  collectDetailImageUrls(source.pic_urls, candidates)
  collectDetailImageUrls(source.image, candidates)
  collectDetailImageUrls(source.main_image, candidates)
  collectDetailImageUrls(source.images_text, candidates)

  getPublishShopItems(source.publish_shop).forEach((shop) => {
    collectDetailImageUrls(shop.images, candidates)
    collectDetailImageUrls(shop.image_urls, candidates)
    collectDetailImageUrls(shop.pic_urls, candidates)
    collectDetailImageUrls(shop.image, candidates)
    collectDetailImageUrls(shop.main_image, candidates)
    collectDetailImageUrls(shop.images_text, candidates)
  })

  return Array.from(new Set(candidates))
})

const productDetailRawJson = computed(() => {
  const detail = productDetail.value && typeof productDetail.value === 'object' ? productDetail.value : null
  if (!detail) return ''
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return ''
  }
})

const batchPublishForm = reactive({
  user_name: '',
})

const templates = ref([])
const templatesLoading = ref(false)
const templatesError = ref('')
const savingTemplate = ref(false)
const templateDraft = reactive({
  name: '',
  description: '',
})

// 订单状态
const queryingOrders = ref(false)
const orders = ref([])
const ordersQueried = ref(false)
const ordersError = ref('')
const ordersQueryTime = ref('')
const ordersFetchedAt = ref('')
const ordersRestoredAt = ref('')
const ordersPagination = reactive({
  count: 0,
  page_no: 1,
  page_size: 10,
})
const orderQuery = reactive({
  page_no: 1,
  page_size: 10,
})
const orderStatusOptions = ref([{ value: 'all', label: '全部状态' }])
const orderFilters = reactive({
  order_status: 'all',
  sort_by: '',
  sort_order: 'desc',
})

const orderDetailDialogVisible = ref(false)
const orderDetailLoading = ref(false)
const orderDetailError = ref('')
const orderDetail = ref(null)
const orderDetailFallbackRow = ref(null)
const orderDetailOrderId = ref('')

const orderDetailSource = computed(() => {
  const detail = orderDetail.value && typeof orderDetail.value === 'object' ? orderDetail.value : {}
  const fallback = orderDetailFallbackRow.value && typeof orderDetailFallbackRow.value === 'object'
    ? orderDetailFallbackRow.value
    : {}
  return { ...fallback, ...detail }
})

const orderDetailDisplay = computed(() => {
  const source = orderDetailSource.value
  const orderId = String(source.order_id || source.order_no || orderDetailOrderId.value || '-').trim() || '-'
  const statusText = String(source.order_status_text || source.order_status || '-').trim() || '-'
  const buyerName = String(source.buyer_name || source.buyer_nick || source.buyer_id || '-').trim() || '-'
  const sellerName = String(source.seller_name || source.seller_nick || source.user_name || source.seller_id || '-').trim() || '-'

  return {
    title: String(source.title || source.product_title || source.item_title || `订单 ${orderId}`).trim(),
    orderId,
    statusText,
    buyerText: buyerName,
    sellerText: sellerName,
    amountText: formatPriceDisplay(source.amount_str, source.amount),
    createdAtText: formatOrderDateTimeDisplay(source.created_at_text || source.created_at || source.create_time || source.order_time),
    payTimeText: formatOrderDateTimeDisplay(source.pay_time_text || source.pay_time || source.pay_at || source.payment_time),
  }
})

const orderDetailLogistics = computed(() => {
  const source = orderDetailSource.value
  const logistics = Array.isArray(source.logistics_items)
    ? source.logistics_items
    : []

  return logistics
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      company: String(item.company || item.logistics_company || item.express_company || '-').trim() || '-',
      logisticsNo: String(item.logistics_no || item.tracking_no || item.waybill_no || '-').trim() || '-',
      status: String(item.status || item.logistics_status || item.shipping_status || '-').trim() || '-',
      receiver: String(item.receiver || item.receiver_name || '-').trim() || '-',
      receiverPhone: String(item.receiver_phone || item.phone || '-').trim() || '-',
      address: String(item.address || item.receiver_address || '-').trim() || '-',
    }))
})

const orderDetailGoods = computed(() => {
  const source = orderDetailSource.value
  const rawGoods = Array.isArray(source.goods_items)
    ? source.goods_items
    : []

  const goods = rawGoods
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      title: String(item.title || item.product_title || item.item_title || '-').trim() || '-',
      image: String(item.image || item.image_url || item.pic_url || '').trim(),
      quantityText: formatIntegerDisplay(item.quantity || item.num || 1),
      unitPriceText: formatPriceDisplay(item.unit_price_str, item.unit_price),
      totalPriceText: formatPriceDisplay(item.total_price_str, item.total_price),
    }))

  if (goods.length > 0) return goods

  return [{
    title: String(source.title || source.product_title || source.item_title || '-').trim() || '-',
    image: '',
    quantityText: '1',
    unitPriceText: formatPriceDisplay(source.amount_str, source.amount),
    totalPriceText: formatPriceDisplay(source.amount_str, source.amount),
  }]
})

const orderDetailRawJson = computed(() => {
  const detail = orderDetail.value && typeof orderDetail.value === 'object' ? orderDetail.value : null
  if (!detail) return ''
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return ''
  }
})

// 创建状态
const createForm = reactive(getDefaultCreateForm())

const createAdvancedEnabled = ref(false)
const createAdvancedJson = ref('{}')
const createOptionalPanels = ref([])

const creatingProduct = ref(false)
const createProductError = ref('')
const createProductResult = ref('')

const createImages = computed(() => parseImages(createForm.publish_shop.images_text))

const createAdvancedJsonValid = computed(() => {
  if (!createAdvancedEnabled.value) return true
  const text = (createAdvancedJson.value || '').trim()
  if (!text) return false
  try {
    const parsed = JSON.parse(text)
    return isPlainObject(parsed)
  } catch {
    return false
  }
})

const createChecklist = computed(() => {
  const shop = createForm.publish_shop

  const basicOk =
    ITEM_BIZ_TYPE_OPTIONS.some((item) => item.value === createForm.item_biz_type) &&
    SP_BIZ_TYPE_OPTIONS.some((item) => item.value === createForm.sp_biz_type) &&
    Boolean(createForm.channel_cat_id) &&
    isInteger(createForm.price) &&
    createForm.price >= 1 &&
    createForm.price <= 9999999900 &&
    isInteger(createForm.express_fee) &&
    isInteger(createForm.stock) &&
    createForm.stock >= 1 &&
    createForm.stock <= 399960

  const shopOk =
    Boolean(shop.user_name) &&
    isInteger(shop.province) &&
    isInteger(shop.city) &&
    isInteger(shop.district)

  const textOk =
    Boolean(shop.title) &&
    shop.title.length <= 60 &&
    Boolean(shop.content) &&
    shop.content.length >= 5 &&
    shop.content.length <= 5000

  const imagesOk =
    createImages.value.length >= 1 &&
    createImages.value.length <= 30 &&
    new Set(createImages.value).size === createImages.value.length

  return [
    {
      key: 'basic',
      label: '基础信息已完整',
      ok: basicOk,
      hint: '请确认商品类型、行业类目、类目编号、售价、运费、库存都已填写',
    },
    {
      key: 'shop',
      label: '店铺与发货地信息已完善',
      ok: shopOk,
      hint: '店铺账号 + 发货地省/市/区代码',
    },
    {
      key: 'content',
      label: '标题与描述符合平台规则',
      ok: textOk,
      hint: `标题 ${shop.title?.length || 0}/60，描述 ${shop.content?.length || 0}/5000`,
    },
    {
      key: 'images',
      label: '图片数量与去重检查通过',
      ok: imagesOk,
      hint: `已识别 ${createImages.value.length} 张，建议 1~30 张且不重复`,
    },
    {
      key: 'advanced',
      label: '补充参数格式正确',
      ok: createAdvancedJsonValid.value,
      hint: createAdvancedEnabled.value ? '已启用高级补充，内容需为 JSON 对象格式' : '未启用高级补充，可忽略此项',
    },
  ]
})

// 回调记录 + 本地任务记录
const callbackRecords = ref([])
const callbackLoading = ref(false)
const callbackError = ref('')
const localTaskRecords = ref([])
const localTaskLoading = ref(false)
const localTaskError = ref('')
let callbackTimer = null

onMounted(async () => {
  syncViewport()
  window.addEventListener('resize', syncViewport)

  await checkBackend()
  await loadConfig()
  restoreShopsCache()
  applyDefaultShopUserNames()
  restoreProductsCache()
  restoreOrdersCache()

  if (configReady.value && !hasBoundShops.value) {
    await queryShops(false, true)
  }

  applyDefaultShopUserNames()
  await loadTemplates(true)
  await loadProcessingResults(true)
  callbackTimer = setInterval(() => {
    loadProcessingResults(true)
  }, 30000)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)

  if (callbackTimer) {
    clearInterval(callbackTimer)
    callbackTimer = null
  }
})

// 检查后端状态
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`)
    backendStatus.value = res.ok ? '✅ 运行中' : '❌ 异常'
  } catch {
    backendStatus.value = '❌ 未连接'
  }
}

// 加载配置
async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`)
    const data = await res.json()
    hasSavedSecret.value = Boolean(data.has_secret)
    configLoadedFromBackend.value = Boolean(data.appid || data.has_secret || data.seller_id || data.updated_at)

    config.appid = Number(data.appid) || 0
    config.seller_id = data.seller_id ?? ''
    config.updated_at = data.updated_at || ''
  } catch (e) {
    console.error('配置加载失败:', e)
  }
}

function applyProductsPagination(rawPagination) {
  if (!rawPagination || typeof rawPagination !== 'object') {
    pagination.count = 0
    pagination.page_no = 1
    pagination.page_size = productQuery.page_size || 10
    return
  }

  pagination.count = Number(rawPagination.count) || 0
  pagination.page_no = Number(rawPagination.page_no) || 1
  pagination.page_size = Number(rawPagination.page_size) || productQuery.page_size || 10

  productQuery.page_no = pagination.page_no
  productQuery.page_size = pagination.page_size
}

function applyOrdersPagination(rawPagination) {
  if (!rawPagination || typeof rawPagination !== 'object') {
    ordersPagination.count = 0
    ordersPagination.page_no = 1
    ordersPagination.page_size = orderQuery.page_size || 10
    return
  }

  ordersPagination.count = Number(rawPagination.count) || 0
  ordersPagination.page_no = Number(rawPagination.page_no) || 1
  ordersPagination.page_size = Number(rawPagination.page_size) || orderQuery.page_size || 10

  orderQuery.page_no = ordersPagination.page_no
  orderQuery.page_size = ordersPagination.page_size
}

function persistShopsCache() {
  try {
    const cacheData = {
      shops: shops.value,
      query_time: queryTime.value || '',
      queried_at: shopsFetchedAt.value || '',
      cached_at: new Date().toISOString(),
      queried: queried.value,
    }
    localStorage.setItem(SHOP_QUERY_CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('店铺查询缓存写入失败:', e)
  }
}

function restoreShopsCache() {
  try {
    const raw = localStorage.getItem(SHOP_QUERY_CACHE_KEY)
    if (!raw) return

    const cache = JSON.parse(raw)
    if (!Array.isArray(cache.shops)) return

    shops.value = cache.shops
    queried.value = Boolean(cache.queried)
    queryTime.value = typeof cache.query_time === 'string' ? cache.query_time : ''
    shopsFetchedAt.value = typeof cache.queried_at === 'string' ? cache.queried_at : ''
    shopsRestoredAt.value = shopsFetchedAt.value || formatDateTime(cache.cached_at)
    applyDefaultShopUserNames()
  } catch (e) {
    console.warn('店铺查询缓存恢复失败，已忽略:', e)
    localStorage.removeItem(SHOP_QUERY_CACHE_KEY)
  }
}

function persistProductsCache() {
  try {
    const cacheData = {
      products: products.value,
      pagination: {
        count: pagination.count,
        page_no: pagination.page_no,
        page_size: pagination.page_size,
      },
      query: {
        page_no: productQuery.page_no,
        page_size: productQuery.page_size,
        product_status: normalizeProductStatusFilter(productFilters.product_status),
        sort_by: productFilters.sort_by || '',
        sort_order: productFilters.sort_order === 'asc' ? 'asc' : 'desc',
      },
      status_options: productStatusOptions.value,
      query_time: productsQueryTime.value || '',
      queried_at: productsFetchedAt.value || '',
      cached_at: new Date().toISOString(),
      queried: productsQueried.value,
    }
    localStorage.setItem(PRODUCT_QUERY_CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('商品查询缓存写入失败:', e)
  }
}

function restoreProductsCache() {
  try {
    const raw = localStorage.getItem(PRODUCT_QUERY_CACHE_KEY)
    if (!raw) return

    const cache = JSON.parse(raw)
    if (!Array.isArray(cache.products)) return

    products.value = cache.products
    productsQueried.value = Boolean(cache.queried)
    productsQueryTime.value = typeof cache.query_time === 'string' ? cache.query_time : ''
    productsFetchedAt.value = typeof cache.queried_at === 'string' ? cache.queried_at : ''
    productsRestoredAt.value = productsFetchedAt.value || formatDateTime(cache.cached_at)

    applyProductStatusOptions(cache.status_options)

    if (cache.query && typeof cache.query === 'object') {
      productQuery.page_no = Number(cache.query.page_no) || productQuery.page_no
      productQuery.page_size = Number(cache.query.page_size) || productQuery.page_size
      productFilters.product_status = normalizeProductStatusFilter(cache.query.product_status)
      productFilters.sort_by = String(cache.query.sort_by || '')
      productFilters.sort_order = cache.query.sort_order === 'asc' ? 'asc' : 'desc'

      const availableStatus = new Set(productStatusOptions.value.map((item) => String(item.value)))
      if (!availableStatus.has(String(productFilters.product_status))) {
        productFilters.product_status = 'all'
      }
    }

    applyProductsPagination(cache.pagination)
  } catch (e) {
    console.warn('商品查询缓存恢复失败，已忽略:', e)
    localStorage.removeItem(PRODUCT_QUERY_CACHE_KEY)
  }
}

function persistOrdersCache() {
  try {
    const cacheData = {
      orders: orders.value,
      pagination: {
        count: ordersPagination.count,
        page_no: ordersPagination.page_no,
        page_size: ordersPagination.page_size,
      },
      query: {
        page_no: orderQuery.page_no,
        page_size: orderQuery.page_size,
        order_status: normalizeOrderStatusFilter(orderFilters.order_status),
        sort_by: orderFilters.sort_by || '',
        sort_order: orderFilters.sort_order === 'asc' ? 'asc' : 'desc',
      },
      status_options: orderStatusOptions.value,
      query_time: ordersQueryTime.value || '',
      queried_at: ordersFetchedAt.value || '',
      cached_at: new Date().toISOString(),
      queried: ordersQueried.value,
    }
    localStorage.setItem(ORDER_QUERY_CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.warn('订单查询缓存写入失败:', e)
  }
}

function restoreOrdersCache() {
  try {
    const raw = localStorage.getItem(ORDER_QUERY_CACHE_KEY)
    if (!raw) return

    const cache = JSON.parse(raw)
    if (!Array.isArray(cache.orders)) return

    orders.value = cache.orders
    ordersQueried.value = Boolean(cache.queried)
    ordersQueryTime.value = typeof cache.query_time === 'string' ? cache.query_time : ''
    ordersFetchedAt.value = typeof cache.queried_at === 'string' ? cache.queried_at : ''
    ordersRestoredAt.value = ordersFetchedAt.value || formatDateTime(cache.cached_at)

    applyOrderStatusOptions(cache.status_options)

    if (cache.query && typeof cache.query === 'object') {
      orderQuery.page_no = Number(cache.query.page_no) || orderQuery.page_no
      orderQuery.page_size = Number(cache.query.page_size) || orderQuery.page_size
      orderFilters.order_status = normalizeOrderStatusFilter(cache.query.order_status)
      orderFilters.sort_by = String(cache.query.sort_by || '')
      orderFilters.sort_order = cache.query.sort_order === 'asc' ? 'asc' : 'desc'

      const availableStatus = new Set(orderStatusOptions.value.map((item) => String(item.value)))
      if (!availableStatus.has(String(orderFilters.order_status))) {
        orderFilters.order_status = 'all'
      }
    }

    applyOrdersPagination(cache.pagination)
  } catch (e) {
    console.warn('订单查询缓存恢复失败，已忽略:', e)
    localStorage.removeItem(ORDER_QUERY_CACHE_KEY)
  }
}

async function ensureBoundShopsReady() {
  if (!configReady.value || hasBoundShops.value || querying.value) {
    applyDefaultShopUserNames()
    return
  }
  await queryShops(false, true)
  applyDefaultShopUserNames()
}

function refreshProducts() {
  queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
}

function applyProductStatusOptions(rawOptions) {
  const normalized = []
  const seen = new Set()

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((item) => {
      const value = normalizeProductStatusFilter(item?.value)
      const label = String(item?.label || '').trim()
      if (value === 'all' || !label) return
      const key = String(value)
      if (seen.has(key)) return
      seen.add(key)
      normalized.push({ value, label })
    })
  }

  const finalOptions = normalized.length > 0 ? normalized : DEFAULT_PRODUCT_STATUS_OPTIONS
  productStatusOptions.value = [{ value: 'all', label: '全部状态' }, ...finalOptions]

  const currentFilter = normalizeProductStatusFilter(productFilters.product_status)
  const available = new Set(productStatusOptions.value.map((item) => String(item.value)))
  if (!available.has(String(currentFilter))) {
    productFilters.product_status = 'all'
  }
}

function getProductQueryParams(requestedPageNo, requestedPageSize) {
  const params = new URLSearchParams({
    page_no: String(requestedPageNo),
    page_size: String(requestedPageSize),
  })

  const statusFilter = normalizeProductStatusFilter(productFilters.product_status)
  if (statusFilter !== 'all') {
    params.set('product_status', String(statusFilter))
  }

  const sortBy = String(productFilters.sort_by || '').trim()
  if (sortBy) {
    params.set('sort_by', sortBy)
    params.set('sort_order', productFilters.sort_order === 'asc' ? 'asc' : 'desc')
  }

  return params
}

function applyOrderStatusOptions(rawOptions) {
  const normalized = []
  const seen = new Set()

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((item) => {
      const value = normalizeOrderStatusFilter(item?.value)
      const label = String(item?.label || '').trim()
      if (value === 'all' || !label) return
      const key = String(value)
      if (seen.has(key)) return
      seen.add(key)
      normalized.push({ value, label })
    })
  }

  const finalOptions = normalized.length > 0 ? normalized : [{ value: 0, label: '待付款' }]
  orderStatusOptions.value = [{ value: 'all', label: '全部状态' }, ...finalOptions]

  const currentFilter = normalizeOrderStatusFilter(orderFilters.order_status)
  const available = new Set(orderStatusOptions.value.map((item) => String(item.value)))
  if (!available.has(String(currentFilter))) {
    orderFilters.order_status = 'all'
  }
}

function getOrdersQueryParams(requestedPageNo, requestedPageSize) {
  const params = new URLSearchParams({
    page_no: String(requestedPageNo),
    page_size: String(requestedPageSize),
  })

  const statusFilter = normalizeOrderStatusFilter(orderFilters.order_status)
  if (statusFilter !== 'all') {
    params.set('order_status', String(statusFilter))
  }

  const sortBy = String(orderFilters.sort_by || '').trim()
  if (sortBy) {
    params.set('sort_by', sortBy)
    params.set('sort_order', orderFilters.sort_order === 'asc' ? 'asc' : 'desc')
  }

  return params
}

function handleProductsCurrentPageChange(pageNo) {
  const nextPageNo = Number(pageNo) || 1
  queryProducts(true, { page_no: nextPageNo, page_size: productQuery.page_size })
}

function handleProductsPageSizeChange(pageSize) {
  const nextPageSize = Number(pageSize) || productQuery.page_size || 10
  queryProducts(true, { page_no: 1, page_size: nextPageSize })
}

function handleProductsStatusFilterChange(value) {
  productFilters.product_status = normalizeProductStatusFilter(value)
  queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
}

function handleProductsSortFieldChange(value) {
  productFilters.sort_by = String(value || '')
  if (!productFilters.sort_by) {
    productFilters.sort_order = 'desc'
  }
  queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
}

function handleProductsSortOrderChange(value) {
  productFilters.sort_order = value === 'asc' ? 'asc' : 'desc'
  queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
}

function resetProductsQueryControls() {
  productFilters.product_status = 'all'
  productFilters.sort_by = ''
  productFilters.sort_order = 'desc'
  queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
}

function handleOrdersCurrentPageChange(pageNo) {
  const nextPageNo = Number(pageNo) || 1
  queryOrders(true, { page_no: nextPageNo, page_size: orderQuery.page_size })
}

function handleOrdersPageSizeChange(pageSize) {
  const nextPageSize = Number(pageSize) || orderQuery.page_size || 10
  queryOrders(true, { page_no: 1, page_size: nextPageSize })
}

function handleOrdersStatusFilterChange(value) {
  orderFilters.order_status = normalizeOrderStatusFilter(value)
  queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
}

function handleOrdersSortFieldChange(value) {
  orderFilters.sort_by = String(value || '')
  if (!orderFilters.sort_by) {
    orderFilters.sort_order = 'desc'
  }
  queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
}

function handleOrdersSortOrderChange(value) {
  orderFilters.sort_order = value === 'asc' ? 'asc' : 'desc'
  queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
}

function resetOrdersQueryControls() {
  orderFilters.order_status = 'all'
  orderFilters.sort_by = ''
  orderFilters.sort_order = 'desc'
  queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
}

function refreshShops() {
  queryShops(true)
}

function refreshOrders() {
  queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
}

function handleProductSelectionChange(rows) {
  selectedProductRows.value = Array.isArray(rows) ? rows : []
}

function clearProductSelection() {
  selectedProductRows.value = []
}

async function openBatchPublishWithSelection() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请先勾选要上架的商品')
    return
  }

  if (!(batchPublishForm.user_name || '').trim()) {
    const tip = hasBoundShops.value
      ? '暂未选中店铺账号，请先到“已绑定店铺”页查询或手动填写后再试'
      : '暂未获取到店铺，请先到“已绑定店铺”页查询后再提交'
    ElMessage.warning(tip)
    return
  }

  creatingInlineBatchPublishTask.value = true
  inlineTaskNotice.value = ''

  try {
    const payload = buildBatchPublishPayload(selectedProductIds.value)
    const res = await fetch(`${API_BASE}/api/products/publish/batch/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (data.success) {
      const total = Number(data?.summary?.total) || selectedProductIds.value.length
      const taskId = data.task_id ? `任务号：${data.task_id}；` : ''
      inlineTaskNotice.value = `已创建批量上架任务（共 ${total} 件）。${taskId}系统正在后台逐个提交，可前往“处理结果”查看任务进度。`
      ElMessage.success(data.message || '批量上架任务已创建，正在后台处理')
      loadProcessingResults(true)
    } else {
      ElMessage.error(data.detail || '批量上架任务创建失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '批量上架任务创建失败')
  } finally {
    creatingInlineBatchPublishTask.value = false
  }
}

async function openBatchDownShelfWithSelection() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请先勾选要下架的商品')
    return
  }

  if (!(batchPublishForm.user_name || '').trim()) {
    const tip = hasBoundShops.value
      ? '暂未选中店铺账号，请先到“已绑定店铺”页查询或手动填写后再试'
      : '暂未获取到店铺，请先到“已绑定店铺”页查询后再提交'
    ElMessage.warning(tip)
    return
  }

  creatingInlineBatchDownshelfTask.value = true
  inlineTaskNotice.value = ''

  try {
    const payload = buildBatchDownshelfPayload(selectedProductIds.value)
    const res = await fetch(`${API_BASE}/api/products/downshelf/batch/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (data.success) {
      const total = Number(data?.summary?.total) || selectedProductIds.value.length
      const taskId = data.task_id ? `任务号：${data.task_id}；` : ''
      inlineTaskNotice.value = `已创建批量下架任务（共 ${total} 件）。${taskId}系统正在后台逐个提交，可前往“处理结果”查看任务进度。`
      ElMessage.success(data.message || '批量下架任务已创建，正在后台处理')
      loadProcessingResults(true)
    } else {
      ElMessage.error(data.detail || '批量下架任务创建失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '批量下架任务创建失败')
  } finally {
    creatingInlineBatchDownshelfTask.value = false
  }
}

async function openBatchDeleteWithSelection() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请先勾选要删除的商品')
    return
  }

  if (!(batchPublishForm.user_name || '').trim()) {
    const tip = hasBoundShops.value
      ? '暂未选中店铺账号，请先到“已绑定店铺”页查询或手动填写后再试'
      : '暂未获取到店铺，请先到“已绑定店铺”页查询后再提交'
    ElMessage.warning(tip)
    return
  }

  creatingInlineBatchDeleteTask.value = true
  inlineTaskNotice.value = ''

  try {
    const payload = buildBatchDeletePayload(selectedProductIds.value)
    const res = await fetch(`${API_BASE}/api/products/delete/batch/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (data.success) {
      const total = Number(data?.summary?.total) || selectedProductIds.value.length
      const taskId = data.task_id ? `任务号：${data.task_id}；` : ''
      inlineTaskNotice.value = `已创建批量删除任务（共 ${total} 件）。${taskId}系统正在后台逐个处理，可前往“处理结果”查看任务进度。`
      ElMessage.success(data.message || '批量删除任务已创建，正在后台处理')
      loadProcessingResults(true)
    } else {
      ElMessage.error(data.detail || '批量删除任务创建失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '批量删除任务创建失败')
  } finally {
    creatingInlineBatchDeleteTask.value = false
  }
}

function goToCallbackRecords() {
  activeMenu.value = 'callback'
  loadProcessingResults(true)
}

function buildTemplateDataFromCreateForm() {
  return {
    item_biz_type: createForm.item_biz_type,
    sp_biz_type: createForm.sp_biz_type,
    channel_cat_id: createForm.channel_cat_id,
    price: createForm.price,
    express_fee: createForm.express_fee,
    stock: createForm.stock,
    publish_shop: {
      user_name: createForm.publish_shop.user_name,
      province: createForm.publish_shop.province,
      city: createForm.publish_shop.city,
      district: createForm.publish_shop.district,
      title: createForm.publish_shop.title,
      content: createForm.publish_shop.content,
      images: parseImages(createForm.publish_shop.images_text),
    },
  }
}

function buildTemplateDataFromProductRow(row) {
  const base = buildTemplateDataFromCreateForm()
  return {
    ...base,
    price: Number.isInteger(Number(row?.price)) ? Number(row.price) : base.price,
    stock: Number.isInteger(Number(row?.stock)) ? Number(row.stock) : base.stock,
    express_fee: Number.isInteger(Number(row?.express_fee)) ? Number(row.express_fee) : base.express_fee,
    publish_shop: {
      ...base.publish_shop,
      title: (row?.title || '').trim() || base.publish_shop.title,
      content: base.publish_shop.content || `商品参考：${(row?.title || '').trim() || '请补充商品描述'}`,
    },
  }
}

function applyTemplateData(templateData) {
  if (!isPlainObject(templateData)) {
    throw new Error('模板数据格式错误')
  }

  if (templateData.item_biz_type !== undefined) createForm.item_biz_type = Number(templateData.item_biz_type)
  if (templateData.sp_biz_type !== undefined) createForm.sp_biz_type = Number(templateData.sp_biz_type)
  if (templateData.channel_cat_id !== undefined) createForm.channel_cat_id = String(templateData.channel_cat_id || '')
  if (templateData.price !== undefined) createForm.price = Number(templateData.price)
  if (templateData.express_fee !== undefined) createForm.express_fee = Number(templateData.express_fee)
  if (templateData.stock !== undefined) createForm.stock = Number(templateData.stock)

  const shop = templateData.publish_shop
  if (isPlainObject(shop)) {
    if (shop.user_name !== undefined) createForm.publish_shop.user_name = String(shop.user_name || '')
    if (shop.province !== undefined) createForm.publish_shop.province = shop.province === null || shop.province === '' ? null : Number(shop.province)
    if (shop.city !== undefined) createForm.publish_shop.city = shop.city === null || shop.city === '' ? null : Number(shop.city)
    if (shop.district !== undefined) createForm.publish_shop.district = shop.district === null || shop.district === '' ? null : Number(shop.district)
    if (shop.title !== undefined) createForm.publish_shop.title = String(shop.title || '')
    if (shop.content !== undefined) createForm.publish_shop.content = String(shop.content || '')
    if (Array.isArray(shop.images)) createForm.publish_shop.images_text = shop.images.join('\n')
  }
}

async function loadTemplates(silent = false) {
  if (!silent) templatesLoading.value = true
  templatesError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/templates`)
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      templates.value = data.data
    } else {
      templatesError.value = data.detail || '模板读取失败'
      if (!silent) ElMessage.error(templatesError.value)
    }
  } catch (e) {
    templatesError.value = `模板读取失败：${e.message}`
    if (!silent) ElMessage.error(templatesError.value)
  } finally {
    if (!silent) templatesLoading.value = false
  }
}

async function createTemplate(payload) {
  savingTemplate.value = true
  templatesError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success(data.message || '模板创建成功')
      await loadTemplates(true)
      return data.data
    }
    throw new Error(data.detail || '模板创建失败')
  } catch (e) {
    templatesError.value = e.message || '模板创建失败'
    ElMessage.error(templatesError.value)
    return null
  } finally {
    savingTemplate.value = false
  }
}

function getTemplateName(defaultPrefix) {
  const name = (templateDraft.name || '').trim()
  if (name) return name
  const stamp = new Date().toLocaleString('zh-CN').replace(/[\/:\s]/g, '-')
  return `${defaultPrefix}-${stamp}`
}

async function createBlankTemplate() {
  const name = getTemplateName('空白模板')
  const payload = {
    name,
    description: (templateDraft.description || '').trim(),
    source: 'blank',
    template_data: {
      item_biz_type: 2,
      sp_biz_type: 1,
      express_fee: 0,
      stock: 1,
      publish_shop: {
        user_name: defaultShopUserName.value || '',
        title: '',
        content: '',
        images: [],
      },
    },
  }

  const created = await createTemplate(payload)
  if (created) {
    templateDraft.name = ''
    templateDraft.description = ''
  }
}

async function saveCurrentFormAsTemplate() {
  const name = getTemplateName('表单模板')
  const payload = {
    name,
    description: (templateDraft.description || '').trim(),
    source: 'form',
    template_data: buildTemplateDataFromCreateForm(),
  }

  const created = await createTemplate(payload)
  if (created) {
    templateDraft.name = ''
    templateDraft.description = ''
  }
}

async function createTemplateFromProductRow(row) {
  const title = (row?.title || '').trim() || `商品-${row?.product_id || 'unknown'}`
  const payload = {
    name: `${title}-模板`,
    description: `从商品 ${row?.product_id || '-'} 生成`,
    source: 'product',
    template_data: buildTemplateDataFromProductRow(row),
  }
  await createTemplate(payload)
}

async function createTemplateFromSelectedProduct() {
  if (selectedProductRows.value.length !== 1) {
    ElMessage.warning('请先在商品列表中勾选 1 条商品')
    return
  }
  await createTemplateFromProductRow(selectedProductRows.value[0])
}

function applyTemplate(template) {
  try {
    applyTemplateData(template.template_data || {})
    applyDefaultShopUserNames()
    activeMenu.value = 'create'
    ElMessage.success(`已应用模板：${template.name}`)
  } catch (e) {
    ElMessage.error(e.message || '模板应用失败')
  }
}

async function removeTemplate(template) {
  try {
    const res = await fetch(`${API_BASE}/api/templates/${template.template_id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      ElMessage.success(data.message || '模板已删除')
      await loadTemplates(true)
    } else {
      ElMessage.error(data.detail || '模板删除失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '模板删除失败')
  }
}

function buildBatchPublishPayload(productIds) {
  return {
    product_ids: productIds,
    user_name: (batchPublishForm.user_name || '').trim(),
    notify_url: getInternalCallbackUrl(),
    source: 'products_page',
  }
}

function buildBatchDownshelfPayload(productIds) {
  return {
    product_ids: productIds,
    user_name: (batchPublishForm.user_name || '').trim(),
    notify_url: getInternalCallbackUrl(),
    source: 'products_page',
  }
}

function buildBatchDeletePayload(productIds) {
  return {
    product_ids: productIds,
    user_name: (batchPublishForm.user_name || '').trim(),
    notify_url: getInternalCallbackUrl(),
    source: 'products_page',
  }
}


// 保存配置
async function saveConfig() {
  if (!config.appid) {
    ElMessage.warning('请先填写 AppKey（应用ID）')
    return
  }

  const localSecret = (config.appsecret || '').trim()
  if (!localSecret && !hasSavedSecret.value) {
    ElMessage.warning('尚未保存 AppSecret，请先输入后再保存')
    return
  }

  saving.value = true
  try {
    const payload = {
      appid: Number(config.appid),
      seller_id: config.seller_id ? parseInt(config.seller_id) : null,
    }
    if (localSecret) {
      payload.appsecret = localSecret
    }

    const res = await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (data.success) {
      config.updated_at = data.updated_at || new Date().toISOString()
      hasSavedSecret.value = Boolean(data.has_secret)
      configLoadedFromBackend.value = true
      config.appsecret = ''
      ElMessage.success(data.secret_preserved ? '已保存设置（沿用已保存的 AppSecret）' : (data.message || '设置已保存'))
      if (!hasBoundShops.value) {
        await queryShops(false, true)
      }
      applyDefaultShopUserNames()
    } else {
      ElMessage.error(data.detail || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败：' + e.message)
  } finally {
    saving.value = false
  }
}

// 查询店铺
async function queryShops(forceRefresh = false, silent = false) {
  if (!configReady.value) {
    if (!silent) ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  querying.value = true
  queried.value = false
  shops.value = []
  lastError.value = ''
  shopsRestoredAt.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/shops`)
    const data = await res.json()

    if (data.success && Array.isArray(data.data)) {
      shops.value = data.data
      queried.value = true
      lastQueryTime.value = new Date().toLocaleString('zh-CN')
      queryTime.value = data.query_time || ''
      shopsFetchedAt.value = new Date().toLocaleString('zh-CN')

      applyDefaultShopUserNames()
      persistShopsCache()

      if (shops.value.length === 0) {
        if (!silent) ElMessage.warning('暂未查到可用店铺，请先确认店铺授权是否完成。')
      } else if (!silent) {
        const actionText = forceRefresh ? '店铺信息已刷新' : '店铺信息已获取'
        ElMessage.success(`${actionText}，共 ${shops.value.length} 个店铺`)
      }
    } else {
      lastError.value = data.detail || '获取店铺失败'
      if (!silent) ElMessage.error(lastError.value)
    }
  } catch (e) {
    lastError.value = '获取店铺失败：' + e.message
    if (!silent) ElMessage.error(lastError.value)
  } finally {
    querying.value = false
  }
}

// 查询商品
async function queryProducts(forceRefresh = false, options = {}) {
  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  const requestedPageNo = Number(options.page_no) || productQuery.page_no || 1
  const requestedPageSize = Number(options.page_size) || productQuery.page_size || 10

  queryingProducts.value = true
  productsError.value = ''
  productsRestoredAt.value = ''
  inlineTaskNotice.value = ''

  try {
    const params = getProductQueryParams(requestedPageNo, requestedPageSize)

    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`)
    const data = await res.json()

    if (data.success && Array.isArray(data.data)) {
      products.value = data.data
      productsQueried.value = true
      productsQueryTime.value = data.query_time || ''
      productsFetchedAt.value = new Date().toLocaleString('zh-CN')
      clearProductSelection()

      applyProductStatusOptions(data.status_options)

      const apiPagination = data.pagination && typeof data.pagination === 'object' ? data.pagination : {}
      const normalizedPagination = {
        count: Number(apiPagination.count) || 0,
        page_no: Number(apiPagination.page_no) || requestedPageNo,
        page_size: Number(apiPagination.page_size) || requestedPageSize,
      }

      applyProductsPagination(normalizedPagination)
      persistProductsCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，当前第 ${normalizedPagination.page_no} 页，每页 ${normalizedPagination.page_size} 条，共 ${normalizedPagination.count} 条`)
    } else {
      productsError.value = data.detail || '查询失败'
      ElMessage.error(productsError.value)
    }
  } catch (e) {
    productsError.value = '查询失败：' + e.message
    ElMessage.error(productsError.value)
  } finally {
    queryingProducts.value = false
  }
}

async function openProductDetail(row) {
  const productId = Number(row?.product_id)
  if (!Number.isInteger(productId) || productId <= 0) {
    ElMessage.warning('当前商品编号无效，暂时无法查看详情')
    return
  }

  productDetailDialogVisible.value = true
  productDetailLoading.value = true
  productDetailError.value = ''
  productDetailProductId.value = productId
  productDetailFallbackRow.value = row && typeof row === 'object' ? { ...row } : null
  productDetail.value = null

  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}`)
    const data = await res.json()

    if (data.success && data.data && typeof data.data === 'object') {
      productDetail.value = data.data
    } else {
      productDetailError.value = data.detail || '商品详情暂时没取到，请稍后再试'
      ElMessage.warning(productDetailError.value)
    }
  } catch (e) {
    productDetailError.value = `商品详情加载失败：${e.message}`
    ElMessage.warning(productDetailError.value)
  } finally {
    productDetailLoading.value = false
  }
}

async function openOrderDetail(row) {
  const orderId = String(row?.order_id || row?.order_no || row?.biz_order_id || row?.id || '').trim()
  if (!orderId) {
    ElMessage.warning('当前订单号无效，暂时无法查看详情')
    return
  }

  orderDetailDialogVisible.value = true
  orderDetailLoading.value = true
  orderDetailError.value = ''
  orderDetailOrderId.value = orderId
  orderDetailFallbackRow.value = row && typeof row === 'object' ? { ...row } : null
  orderDetail.value = null

  try {
    const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`)
    const data = await res.json()

    if (data.success && data.data && typeof data.data === 'object') {
      orderDetail.value = data.data
      if (data.warning) {
        orderDetailError.value = data.warning
      }
    } else {
      orderDetailError.value = data.detail || '订单详情暂时没取到，已展示列表可得字段'
      ElMessage.warning(orderDetailError.value)
    }
  } catch (e) {
    orderDetailError.value = `订单详情加载失败：${e.message}`
    ElMessage.warning(orderDetailError.value)
  } finally {
    orderDetailLoading.value = false
  }
}

async function queryOrders(forceRefresh = false, options = {}) {
  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  const requestedPageNo = Number(options.page_no) || orderQuery.page_no || 1
  const requestedPageSize = Number(options.page_size) || orderQuery.page_size || 10

  queryingOrders.value = true
  ordersError.value = ''
  ordersRestoredAt.value = ''

  try {
    const params = getOrdersQueryParams(requestedPageNo, requestedPageSize)
    const res = await fetch(`${API_BASE}/api/orders?${params.toString()}`)
    const data = await res.json()

    if (data.success && Array.isArray(data.data)) {
      orders.value = data.data
      ordersQueried.value = true
      ordersQueryTime.value = data.query_time || ''
      ordersFetchedAt.value = new Date().toLocaleString('zh-CN')

      applyOrderStatusOptions(data.status_options)

      const apiPagination = data.pagination && typeof data.pagination === 'object' ? data.pagination : {}
      const normalizedPagination = {
        count: Number(apiPagination.count) || 0,
        page_no: Number(apiPagination.page_no) || requestedPageNo,
        page_size: Number(apiPagination.page_size) || requestedPageSize,
      }

      applyOrdersPagination(normalizedPagination)
      persistOrdersCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，当前第 ${normalizedPagination.page_no} 页，每页 ${normalizedPagination.page_size} 条，共 ${normalizedPagination.count} 条`)
    } else {
      ordersError.value = data.detail || '查询失败'
      ElMessage.error(ordersError.value)
    }
  } catch (e) {
    ordersError.value = '查询失败：' + e.message
    ElMessage.error(ordersError.value)
  } finally {
    queryingOrders.value = false
  }
}

function formatOrderDateTimeDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return formatCallbackTime(value)
}

function formatPriceDisplay(priceText, priceValue) {
  if (typeof priceText === 'string' && priceText.trim()) {
    return priceText.trim()
  }

  if (priceValue === null || priceValue === undefined || priceValue === '') {
    return '-'
  }

  const amount = Number(priceValue)
  if (!Number.isFinite(amount)) {
    return '-'
  }

  return `¥${(amount / 100).toFixed(2)}`
}

function formatIntegerDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    return '-'
  }

  return String(Math.trunc(normalized))
}

function isInteger(value) {
  return Number.isInteger(value)
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function deepMerge(base, extra) {
  const output = Array.isArray(base) ? [...base] : { ...base }
  Object.keys(extra).forEach((key) => {
    const baseVal = output[key]
    const extraVal = extra[key]
    if (isPlainObject(baseVal) && isPlainObject(extraVal)) {
      output[key] = deepMerge(baseVal, extraVal)
    } else {
      output[key] = extraVal
    }
  })
  return output
}

function parseExtraJson(raw, actionName) {
  const text = (raw || '').trim()
  if (!text) return {}

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(`${actionName}补充参数格式错误：${e.message}`)
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${actionName}补充参数必须是 JSON 对象`)
  }
  return parsed
}

function parseImages(text) {
  return (text || '')
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateCreateForm() {
  if (!ITEM_BIZ_TYPE_OPTIONS.some((item) => item.value === createForm.item_biz_type)) {
    return '请选择有效的商品类型'
  }
  if (!SP_BIZ_TYPE_OPTIONS.some((item) => item.value === createForm.sp_biz_type)) {
    return '请选择有效的行业类目'
  }
  if (!createForm.channel_cat_id) return '请填写商品类目编号'
  if (!isInteger(createForm.price) || createForm.price < 1 || createForm.price > 9999999900) {
    return '售价需为整数，范围 1~9999999900（分）'
  }
  if (!isInteger(createForm.express_fee)) return '运费需为整数（分）'
  if (!isInteger(createForm.stock) || createForm.stock < 1 || createForm.stock > 399960) {
    return '库存需为整数，范围 1~399960'
  }

  const shop = createForm.publish_shop
  if (!shop.user_name) {
    return hasBoundShops.value
      ? '请先选择发布店铺账号'
      : '暂未获取到店铺，请先到“已绑定店铺”页查询后再提交'
  }
  if (!isInteger(shop.province)) return '请填写发货省份代码（平台地区码）'
  if (!isInteger(shop.city)) return '请填写发货城市代码（平台地区码）'
  if (!isInteger(shop.district)) return '请填写发货区县代码（平台地区码）'
  if (!shop.title || shop.title.length > 60) return '商品标题长度需为 1~60 字'
  if (!shop.content || shop.content.length < 5 || shop.content.length > 5000) {
    return '商品描述长度需为 5~5000 字'
  }

  const images = parseImages(shop.images_text)
  if (images.length < 1 || images.length > 30) return '请提供 1~30 张商品图片链接'
  if (new Set(images).size !== images.length) return '商品图片链接存在重复，请检查'

  return ''
}

function buildCreatePayload() {
  const basePayload = {
    item_biz_type: createForm.item_biz_type,
    sp_biz_type: createForm.sp_biz_type,
    channel_cat_id: createForm.channel_cat_id,
    price: createForm.price,
    express_fee: createForm.express_fee,
    stock: createForm.stock,
    publish_shop: [
      {
        user_name: createForm.publish_shop.user_name,
        province: createForm.publish_shop.province,
        city: createForm.publish_shop.city,
        district: createForm.publish_shop.district,
        title: createForm.publish_shop.title,
        content: createForm.publish_shop.content,
        images: parseImages(createForm.publish_shop.images_text),
      },
    ],
  }

  if (!createAdvancedEnabled.value) return basePayload
  const extra = parseExtraJson(createAdvancedJson.value, '创建商品')
  return deepMerge(basePayload, extra)
}


function sanitizeResultForDisplay(value, parentKey = '') {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResultForDisplay(item, parentKey))
  }
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeResultForDisplay(value[key], key)
      return acc
    }, {})
  }
  if (typeof value === 'string') {
    const normalizedKey = String(parentKey || '').toLowerCase()
    if (normalizedKey.includes('url') || normalizedKey.includes('endpoint')) {
      return '（地址已隐藏）'
    }
    if (/^https?:\/\//i.test(value)) {
      return '（地址已隐藏）'
    }
  }
  return value
}

function formatApiResult(result) {
  return JSON.stringify(sanitizeResultForDisplay(result), null, 2)
}

function fillCreateExample() {
  createForm.item_biz_type = 2
  createForm.sp_biz_type = 1
  createForm.channel_cat_id = 'e11455'
  createForm.price = 19900
  createForm.express_fee = 0
  createForm.stock = 5

  createForm.publish_shop.user_name = defaultShopUserName.value || 'tb_demo_shop'
  createForm.publish_shop.province = 330000
  createForm.publish_shop.city = 330100
  createForm.publish_shop.district = 330106
  createForm.publish_shop.title = '九成新演示商品（请先改成你的真实信息）'
  createForm.publish_shop.content = '演示填充：功能联调用文案，提交前请替换为真实商品描述。'
  createForm.publish_shop.images_text = [
    'https://via.placeholder.com/1200x1200.png?text=goofish-demo-1',
    'https://via.placeholder.com/1200x1200.png?text=goofish-demo-2',
  ].join('\n')

  createAdvancedEnabled.value = false
  createAdvancedJson.value = '{}'
  createOptionalPanels.value = []
  createProductError.value = ''
  createProductResult.value = ''
  ElMessage.success('已填入示例内容（未提交）')
}

function resetCreateForm() {
  Object.assign(createForm, getDefaultCreateForm())
  applyDefaultShopUserNames()
  createAdvancedEnabled.value = false
  createAdvancedJson.value = '{}'
  createOptionalPanels.value = []
  createProductError.value = ''
  createProductResult.value = ''
}


async function createProduct() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  const err = validateCreateForm()
  if (err) {
    createProductError.value = err
    ElMessage.error(err)
    return
  }

  creatingProduct.value = true
  createProductError.value = ''
  createProductResult.value = ''

  try {
    const payload = buildCreatePayload()
    const res = await fetch(`${API_BASE}/api/products/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (data.success) {
      createProductResult.value = formatApiResult(data.raw || data)
      ElMessage.success(data.message || '创建商品请求成功')
    } else {
      createProductError.value = data.detail || '创建商品失败'
      ElMessage.error(createProductError.value)
    }
  } catch (e) {
    createProductError.value = e.message || '创建商品失败'
    ElMessage.error(createProductError.value)
  } finally {
    creatingProduct.value = false
  }
}


async function loadProcessingResults(silent = false) {
  if (!silent) {
    callbackLoading.value = true
    localTaskLoading.value = true
  }

  try {
    await Promise.all([
      loadLocalTaskRecords(true),
      loadCallbackRecords(true),
    ])
  } finally {
    if (!silent) {
      callbackLoading.value = false
      localTaskLoading.value = false
    }
  }
}

async function loadLocalTaskRecords(silent = false) {
  if (!silent) localTaskLoading.value = true
  localTaskError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/products/task/records?limit=50`)
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      localTaskRecords.value = data.data
    } else {
      localTaskError.value = data.detail || '任务记录读取失败'
      if (!silent) ElMessage.error(localTaskError.value)
    }
  } catch (e) {
    localTaskError.value = '任务记录读取失败：' + e.message
    if (!silent) ElMessage.error(localTaskError.value)
  } finally {
    if (!silent) localTaskLoading.value = false
  }
}

async function loadCallbackRecords(silent = false) {
  if (!silent) callbackLoading.value = true
  callbackError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/products/callback/records?limit=50`)
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      callbackRecords.value = data.data
    } else {
      callbackError.value = data.detail || '处理记录读取失败'
      if (!silent) ElMessage.error(callbackError.value)
    }
  } catch (e) {
    callbackError.value = '处理记录读取失败：' + e.message
    if (!silent) ElMessage.error(callbackError.value)
  } finally {
    if (!silent) callbackLoading.value = false
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN')
}

function formatCallbackTime(value) {
  if (value === null || value === undefined || value === '') return '-'

  // 兼容秒/毫秒时间戳
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const num = Number(value)
    const ms = num > 1e12 ? num : num * 1000
    const date = new Date(ms)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('zh-CN')
  }

  return formatDateTime(value)
}

function getTaskStatusType(status) {
  const map = {
    queued: 'info',
    running: 'warning',
    finished: 'success',
    partial_failed: 'warning',
    failed: 'danger',
  }
  return map[status] || 'info'
}

// 获取过期时间样式
function getExpireClass(timestamp) {
  if (!timestamp) return 'expire-unknown'
  const now = Date.now() / 1000
  const daysLeft = (timestamp - now) / 86400
  if (daysLeft < 7) return 'expire-danger'
  if (daysLeft < 30) return 'expire-warning'
  return 'expire-success'
}

// 商品状态类型
function getStatusType(status) {
  const map = {
    21: 'info',
    22: 'success',
    23: 'warning',
    31: 'info',
    33: 'success',
    36: 'danger',
  }
  return map[status] || 'info'
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f3f5f9;
  color: #1f2937;
}

.goofish-layout {
  min-height: 100vh;
  padding: 16px;
}

.layout-root {
  min-height: calc(100vh - 72px);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.sidebar {
  background: #0f172a;
  color: #e2e8f0;
  border-right: 1px solid #1e293b;
}

.brand {
  padding: 20px 16px 14px;
  border-bottom: 1px solid #1e293b;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
}

.brand-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.sidebar-menu {
  border-right: none !important;
  background: transparent !important;
}

.sidebar-menu .el-menu-item {
  color: #cbd5e1;
  height: 46px;
  line-height: 46px;
  margin: 6px 10px;
  border-radius: 8px;
  position: relative;
  transition: all 0.2s ease;
}

.sidebar-menu .el-menu-item:hover {
  color: #fff;
  background: #1e293b !important;
}

.sidebar-menu .el-menu-item.is-active {
  color: #fff;
  font-weight: 600;
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.sidebar-menu .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 11px;
  bottom: 11px;
  width: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
}

.workspace {
  background: #f8fafc;
  padding: 18px;
}

.workspace-header {
  margin-bottom: 14px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.workspace-header h2 {
  font-size: 20px;
  color: #0f172a;
}

.workspace-header p {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.panel-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.panel-card .el-card__header {
  padding: 14px 18px;
}

.panel-card .el-card__body {
  padding: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header > span {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.panel-form {
  max-width: 1120px;
}

.products-query-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #f8fbff;
}

.products-query-tools__label {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
}

.mb-4 { margin-bottom: 16px; }

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: linear-gradient(90deg, rgba(239, 246, 255, 0.95), rgba(248, 250, 252, 0.95));
  border: 1px solid #bfdbfe;
  border-left: 4px solid #3b82f6;
  border-radius: 10px;
}

.result-info > span:first-child {
  font-weight: 600;
  color: #0f172a;
}

.pagination-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
  flex-wrap: wrap;
}

.result-info-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 300px;
}

.result-info--products .header-actions {
  margin-left: auto;
}

.result-info--products .pagination-info .selected-count {
  color: #0f766e;
  font-weight: 600;
}

.latest-query-time {
  font-size: 12px;
  color: #475569;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.update-time { color: #64748b; font-size: 13px; }

.binding-status-card {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: linear-gradient(95deg, #eff6ff 0%, #f8fafc 55%, #ffffff 100%);
  padding: 12px;
}

.binding-status-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 8px;
}

.binding-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}

.binding-status-item {
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.binding-status-item.saved {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.binding-status-item .label {
  font-size: 12px;
  color: #334155;
}

.binding-status-item .value {
  font-size: 12px;
  font-weight: 700;
  color: #991b1b;
}

.binding-status-item.saved .value {
  color: #166534;
}

.binding-status-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #475569;
}

.shop-info { padding: 8px 0; }
.shop-name { font-weight: 600; color: #0f172a; margin-bottom: 6px; }
.shop-meta { display: flex; gap: 15px; font-size: 13px; color: #64748b; }
.status-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.price { color: #dc2626; font-weight: 700; }
.shop-detail { padding: 15px; background: #f8fafc; }
.shop-detail h4 { margin-bottom: 10px; color: #334155; }

.op-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.form-section {
  padding: 14px 14px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  margin-bottom: 14px;
}

.form-section.subtle {
  background: #f8fafc;
}

.create-guide {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  background: linear-gradient(95deg, #eff6ff 0%, #f8fafc 55%, #ffffff 100%);
}

.create-guide-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 6px;
}

.create-guide p {
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.create-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: start;
}

.create-main {
  min-width: 0;
}

.create-block {
  border-color: #dbeafe;
  background: #fff;
}

.required-field {
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  border-radius: 4px;
}

.field-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.create-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-check-card {
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
  position: sticky;
  top: 12px;
}

.create-check-header {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.create-check-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.create-check-list {
  list-style: none;
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.create-check-item {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.create-check-item .item-title {
  font-size: 13px;
  font-weight: 600;
}

.create-check-item .item-status {
  margin-top: 2px;
  font-size: 12px;
}

.create-check-item .item-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.create-check-item.is-ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.create-check-item.is-ok .item-title,
.create-check-item.is-ok .item-status {
  color: #166534;
}

.create-check-item.is-pending {
  border-color: #fecaca;
  background: #fef2f2;
}

.create-check-item.is-pending .item-title,
.create-check-item.is-pending .item-status {
  color: #991b1b;
}

.create-constraint-box {
  margin-top: 12px;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.constraint-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.create-constraint-box ul {
  margin-top: 8px;
  padding-left: 18px;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.section-badge {
  font-size: 11px;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 999px;
}

.section-badge.required {
  color: #1d4ed8;
  background: #dbeafe;
}

.section-badge.optional {
  color: #475569;
  background: #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px 12px;
}


.compact-form .el-form-item {
  margin-bottom: 14px;
}

.compact-form .el-form-item__label {
  color: #334155;
  font-weight: 500;
  padding-right: 12px;
}

.key-field .el-form-item__label {
  color: #0f172a;
  font-weight: 700;
}






.optional-collapse {
  border-top: none;
  border-bottom: none;
}

.optional-collapse .el-collapse-item__header {
  border-bottom: none;
  background: transparent;
  height: auto;
  line-height: 1.4;
  padding: 2px 0 8px;
}

.optional-collapse .el-collapse-item__wrap {
  border-bottom: none;
  background: transparent;
}

.optional-collapse .el-collapse-item__content {
  padding-bottom: 0;
}

.collapse-title-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.switch-tip {
  margin-left: 10px;
  color: #64748b;
  font-size: 12px;
}

.op-actions {
  margin-top: 4px;
  margin-bottom: 10px;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
}

.data-table {
  min-width: 820px;
}

.shops-table {
  min-width: 980px;
}

.products-table {
  min-width: 860px;
}

.orders-table {
  min-width: 1160px;
}

.callback-table {
  min-width: 1260px;
}

.json-input textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
}

.json-result {
  margin-top: 8px;
  background: #0f172a;
  border-radius: 8px;
  padding: 10px;
  max-height: 320px;
  overflow: auto;
}

.json-result pre {
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.callback-header-row {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.callback-tip {
  color: #64748b;
  font-size: 13px;
}

.product-title-link {
  padding: 0;
  font-weight: 500;
  justify-content: flex-start;
  max-width: 100%;
  text-align: left;
  white-space: normal;
  line-height: 1.4;
}

.order-id-link {
  padding: 0;
  justify-content: flex-start;
  max-width: 100%;
  text-align: left;
}

.product-detail-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.product-detail-dialog__id {
  font-size: 12px;
  color: #64748b;
}

.product-detail-overview {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: linear-gradient(95deg, #eff6ff 0%, #f8fafc 60%, #ffffff 100%);
  padding: 12px;
  margin-bottom: 10px;
}

.product-detail-overview__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.product-detail-overview__title-wrap h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
  line-height: 1.4;
}

.product-detail-overview__status-text {
  color: #475569;
  font-size: 13px;
}

.product-detail-overview__meta {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.product-detail-overview__meta .dot {
  margin: 0 6px;
}

.product-detail-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.metric-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}

.metric-card .label {
  font-size: 12px;
  color: #64748b;
}

.metric-card .value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.metric-card .value--price {
  color: #dc2626;
}

.product-detail-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.product-detail-section {
  margin-top: 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.product-detail-section h4 {
  margin-bottom: 10px;
  color: #1e293b;
}

.product-detail-description-box {
  max-height: 240px;
  overflow: auto;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding-right: 4px;
}

.product-detail-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.product-detail-image-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-detail-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  background: #f1f5f9;
  overflow: hidden;
}

.product-detail-image-placeholder,
.product-detail-image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
}

.product-detail-image-fallback {
  color: #991b1b;
  background: #fef2f2;
}

.product-detail-image-link {
  font-size: 12px;
  color: #2563eb;
  word-break: break-all;
}

.product-detail-image-empty {
  color: #64748b;
  font-size: 13px;
}

.product-detail-raw {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.product-detail-raw summary {
  cursor: pointer;
  color: #334155;
  font-weight: 600;
}

.product-detail-raw pre {
  margin-top: 10px;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  color: #0f172a;
}

.order-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.product-detail-section--logistics-secondary {
  padding: 10px;
  border-color: #e5e7eb;
  background: #f8fafc;
}

.product-detail-section--logistics-secondary h4 {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.order-logistics-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.order-logistics-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 8px 10px;
  display: grid;
  gap: 4px;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}

.order-goods-title {
  line-height: 1.4;
  color: #1e293b;
}

.order-goods-image {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  background: #f8fafc;
}

.status-bar {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}

.expire-success { color: #16a34a; font-weight: 500; }
.expire-warning { color: #d97706; font-weight: 500; }
.expire-danger { color: #dc2626; font-weight: 500; }
.expire-unknown { color: #94a3b8; }

@media (max-width: 960px) {
  .goofish-layout {
    padding: 8px;
  }

  .layout-root {
    min-height: auto;
    display: block;
  }

  .layout-root > .sidebar {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #1e293b;
  }

  .sidebar.is-compact .brand {
    padding: 12px 14px 10px;
  }

  .sidebar.is-compact .brand-title {
    font-size: 18px;
  }

  .sidebar.is-compact .brand-subtitle {
    display: none;
  }

  .sidebar-menu.el-menu--horizontal {
    border-bottom: none !important;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    padding: 0 8px 10px;
  }

  .sidebar-menu.el-menu--horizontal::-webkit-scrollbar {
    height: 6px;
  }

  .sidebar-menu.el-menu--horizontal .el-menu-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 38px;
    line-height: 38px;
    margin: 6px 6px 0 0;
    padding: 0 12px !important;
    border-bottom: none !important;
  }

  .sidebar-menu .el-menu-item.is-active::before {
    display: none;
  }

  .workspace {
    padding: 12px;
  }

  .workspace-header {
    margin-bottom: 10px;
    padding: 12px;
  }

  .workspace-header h2 {
    font-size: 18px;
  }

  .panel-card .el-card__header,
  .panel-card .el-card__body {
    padding: 12px;
  }

  .card-header {
    gap: 8px;
    align-items: flex-start;
  }

  .card-header > span {
    font-size: 14px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .result-info {
    align-items: flex-start;
  }

  .products-query-tools {
    align-items: flex-start;
  }

  .products-query-tools__label {
    width: 100%;
  }

  .pagination-info {
    width: 100%;
  }

  .result-info-main {
    min-width: 0;
    width: 100%;
  }

  .pagination-wrap {
    justify-content: flex-start;
  }

  .form-section {
    padding: 12px 10px 8px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .create-workspace {
    grid-template-columns: 1fr;
  }

  .create-check-card {
    position: static;
    top: auto;
  }

  .required-field {
    border-left-width: 2px;
    padding-left: 6px;
  }

  .compact-form .el-form-item {
    margin-bottom: 10px;
  }

  .compact-form .el-form-item__label {
    line-height: 1.3;
  }

  .table-scroll {
    margin: 0 -2px;
  }

  .data-table {
    min-width: 760px;
  }

  .status-bar {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
