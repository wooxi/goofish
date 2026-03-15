<template>
  <div class="goofish-layout">
    <el-container class="layout-root">
      <el-aside width="240px" class="sidebar" :class="{ 'is-compact': isCompactViewport }">
        <div class="brand">
          <div class="brand-title">🐟 Goofish</div>
          <div class="brand-subtitle">闲鱼管理工作台</div>
        </div>

        <el-menu
          :default-active="activeMenu"
          :mode="menuMode"
          :ellipsis="false"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="config">⚙️ 账号授权配置</el-menu-item>
          <el-menu-item index="shops">🏪 已绑定店铺</el-menu-item>
          <el-menu-item index="products">📦 商品管理</el-menu-item>
          <el-menu-item index="orders">🧾 订单查询</el-menu-item>
          <el-menu-item index="batchPublish">📚 批量上架</el-menu-item>
          <el-menu-item index="templates">🧩 模板中心</el-menu-item>
          <el-menu-item index="create">➕ 创建商品</el-menu-item>
          <el-menu-item index="publish">🚀 商品上架</el-menu-item>
          <el-menu-item index="callback">📨 任务回执</el-menu-item>
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
              <span>⚙️ 账号授权配置</span>
              <el-button type="primary" @click="saveConfig" :loading="saving">💾 保存配置</el-button>
            </div>
          </template>

          <el-alert
            v-if="configLoadedFromBackend"
            :title="`已自动读取后端配置：appid=${config.appid || '-'}，${hasSavedSecret ? 'AppSecret 已保存' : 'AppSecret 未保存'}`"
            type="success"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="binding-status-card mb-4">
            <div class="binding-status-title">长期绑定状态</div>
            <div class="binding-status-grid">
              <div class="binding-status-item" :class="{ saved: bindingStatus.appidSaved }">
                <span class="label">AppKey (appid)</span>
                <span class="value">{{ bindingStatus.appidSaved ? '已保存' : '未保存' }}</span>
              </div>
              <div class="binding-status-item" :class="{ saved: bindingStatus.sellerIdSaved }">
                <span class="label">Seller ID</span>
                <span class="value">{{ bindingStatus.sellerIdSaved ? '已保存' : '未保存' }}</span>
              </div>
              <div class="binding-status-item" :class="{ saved: bindingStatus.secretSaved }">
                <span class="label">AppSecret</span>
                <span class="value">{{ bindingStatus.secretSaved ? '已保存' : '未保存' }}</span>
              </div>
            </div>
            <div class="binding-status-desc">{{ bindingStatusDesc }}</div>
          </div>

          <el-form :model="config" label-width="140px" size="large" class="panel-form">
            <el-form-item label="AppKey (appid)" required>
              <el-input v-model="config.appid" placeholder="请输入 appid" type="number" />
            </el-form-item>
            <el-form-item label="AppSecret">
              <el-input
                v-model="config.appsecret"
                placeholder="可留空（将保留后端已保存的 secret）"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="Seller ID">
              <el-input v-model="config.seller_id" placeholder="可选，商家 ID" type="number" />
            </el-form-item>
            <el-form-item label="最后更新">
              <span class="update-time">{{ config.updated_at || '从未更新' }}</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 店铺查询 -->
        <el-card v-show="activeMenu === 'shops'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🏪 已绑定店铺</span>
              <div class="header-actions">
                <el-button type="success" @click="queryShops" :loading="querying">🔍 获取店铺</el-button>
                <el-button @click="refreshShops" :loading="querying" :disabled="!configReady">🔄 刷新结果</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
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
            :title="`已恢复上次查询结果（查询时间：${shopsRestoredAt}）`"
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
                    <h4>📋 详细信息</h4>
                    <el-descriptions :column="2" border>
                      <el-descriptions-item label="授权 ID">{{ props.row.authorize_id }}</el-descriptions-item>
                      <el-descriptions-item label="商家 ID">{{ props.row.seller_id || '-' }}</el-descriptions-item>
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

          <el-empty v-else-if="queried" description="暂无店铺数据" />
        </el-card>

        <!-- 商品列表 -->
        <el-card v-show="activeMenu === 'products'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📦 商品管理</span>
              <div class="header-actions">
                <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 获取商品</el-button>
                <el-button @click="refreshProducts" :loading="queryingProducts" :disabled="!configReady">🔄 刷新结果</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
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
            :title="`已恢复上次查询结果（查询时间：${productsRestoredAt}）`"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div v-if="products.length > 0" class="products-list">
            <div class="result-info">
              <span>✅ 查询成功，共 <strong>{{ products.length }}</strong> 条记录</span>
              <div class="pagination-info">
                <span>第 {{ pagination.page_no }} 页</span>
                <span>共 {{ pagination.count }} 条</span>
                <span>每页 {{ pagination.page_size }} 条</span>
                <span>已勾选 {{ selectedProductIds.length }} 条</span>
              </div>
              <span v-if="productsQueryTime">⏱️ 耗时：{{ productsQueryTime }}</span>
              <span v-if="productsFetchedAt">🕒 查询时间：{{ productsFetchedAt }}</span>
              <div class="header-actions">
                <el-button size="small" @click="clearProductSelection" :disabled="selectedProductIds.length === 0">清空勾选</el-button>
                <el-button type="warning" size="small" @click="openBatchPublishWithSelection" :disabled="selectedProductIds.length === 0">📚 批量上架所选</el-button>
              </div>
            </div>

            <div class="table-scroll">
              <el-table
                :data="products"
                stripe
                class="data-table products-table"
                row-key="product_id"
                @selection-change="handleProductSelectionChange"
              >
                <el-table-column type="selection" width="52" reserve-selection />
                <el-table-column prop="product_id" label="商品 ID" width="180" />
                <el-table-column prop="title" label="商品标题" min-width="300" />
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
          </div>

          <el-empty v-else-if="productsQueried" description="暂无商品数据" />
        </el-card>

        <!-- 订单列表 -->
        <el-card v-show="activeMenu === 'orders'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🧾 订单查询</span>
              <div class="header-actions">
                <el-button type="success" @click="queryOrders" :loading="queryingOrders">🔍 获取订单</el-button>
                <el-button @click="refreshOrders" :loading="queryingOrders" :disabled="!configReady">🔄 刷新结果</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
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
            :title="`已恢复上次查询结果（查询时间：${ordersRestoredAt}）`"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div v-if="orders.length > 0" class="orders-list">
            <div class="result-info">
              <span>✅ 查询成功，共 <strong>{{ orders.length }}</strong> 条记录</span>
              <div class="pagination-info">
                <span>第 {{ ordersPagination.page_no }} 页</span>
                <span>共 {{ ordersPagination.count }} 条</span>
                <span>每页 {{ ordersPagination.page_size }} 条</span>
              </div>
              <span v-if="ordersQueryTime">⏱️ 耗时：{{ ordersQueryTime }}</span>
              <span v-if="ordersFetchedAt">🕒 查询时间：{{ ordersFetchedAt }}</span>
            </div>

            <div class="table-scroll">
              <el-table :data="orders" stripe class="data-table orders-table">
                <el-table-column prop="order_id" label="订单号" min-width="220" />
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
          </div>

          <el-empty v-else-if="ordersQueried" description="暂无订单数据" />
        </el-card>

        <!-- 批量上架工作台 -->
        <el-card v-show="activeMenu === 'batchPublish'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📚 批量上架</span>
              <div class="header-actions">
                <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 拉取可上架商品</el-button>
                <el-button @click="activeMenu = 'products'">📦 去勾选商品</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <div class="feature-grid mb-4">
            <div class="feature-item">
              <div class="title">执行方式</div>
              <div class="desc">系统会按勾选顺序逐条提交上架，并展示每条结果。</div>
            </div>
            <div class="feature-item">
              <div class="title">当前勾选</div>
              <div class="desc">已选择 {{ selectedProductIds.length }} 条商品，可直接一键上架。</div>
            </div>
          </div>

          <el-alert
            v-if="!hasBoundShops"
            :title="shopBindingHint"
            type="warning"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-form label-width="150px" class="compact-form panel-form mb-4">
            <div class="form-grid publish-grid">
              <el-form-item label="上架店铺账号" required>
                <el-select
                  v-model="batchPublishForm.user_name"
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
                <div class="field-meta">{{ shopBindingHint }}（技术字段：user_name）</div>
              </el-form-item>
              <el-form-item label="定时上架时间">
                <el-input v-model.trim="batchPublishForm.specify_publish_time" placeholder="可选，如 2026-03-14 12:30:00" />
              </el-form-item>
            </div>
          </el-form>

          <div class="op-actions">
            <el-button @click="clearProductSelection" :disabled="selectedProductIds.length === 0">清空勾选</el-button>
            <el-button type="warning" @click="submitBatchPublish()" :loading="batchPublishing" :disabled="selectedProductIds.length === 0">🚀 一键批量上架</el-button>
          </div>

          <el-alert v-if="batchPublishError" :title="batchPublishError" type="error" show-icon closable class="mb-4" />

          <div v-if="selectedProductsForBatch.length > 0" class="table-scroll mb-4">
            <el-table :data="selectedProductsForBatch" stripe class="data-table products-table">
              <el-table-column prop="product_id" label="商品 ID" width="180" />
              <el-table-column prop="title" label="商品标题" min-width="280" />
              <el-table-column prop="price_str" label="价格" width="120" />
              <el-table-column prop="stock" label="库存" width="90" />
              <el-table-column prop="product_status_str" label="状态" width="120" />
            </el-table>
          </div>

          <el-empty v-else description="请先到“商品管理”页勾选商品" />

          <div v-if="batchPublishResult" class="batch-result-wrap">
            <div class="result-info">
              <span>
                批量执行完成：共 {{ batchPublishResult.summary.total }} 条，成功 {{ batchPublishResult.summary.success }} 条，失败 {{ batchPublishResult.summary.failed }} 条
              </span>
              <div class="header-actions">
                <el-button
                  type="danger"
                  plain
                  size="small"
                  :disabled="failedBatchProductIds.length === 0"
                  :loading="batchRetryingFailed"
                  @click="retryFailedBatchItems"
                >
                  重试失败项（{{ failedBatchProductIds.length }}）
                </el-button>
              </div>
            </div>

            <div class="table-scroll">
              <el-table :data="batchPublishResult.results" stripe class="data-table products-table">
                <el-table-column prop="product_id" label="商品 ID" width="180" />
                <el-table-column label="结果" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.success ? 'success' : 'danger'">{{ scope.row.success ? '成功' : '失败' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="返回信息" min-width="220" show-overflow-tooltip />
                <el-table-column prop="error" label="错误信息" min-width="240" show-overflow-tooltip />
                <el-table-column prop="query_time" label="耗时" width="110" />
              </el-table>
            </div>
          </div>
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
            title="你可以新增模板、保存当前表单、删除模板或一键套用；也支持从已选商品快速生成模板。"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-alert
            title="从已有商品生成模板时，若列表里缺少完整详情（如图片、长描述），会自动沿用当前表单内容。"
            type="warning"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-form label-width="120px" class="compact-form panel-form mb-4">
            <div class="form-grid">
              <el-form-item label="模板名称" required>
                <el-input v-model.trim="templateDraft.name" maxlength="80" placeholder="例如：数码配件通用模板" />
              </el-form-item>
              <el-form-item label="模板说明">
                <el-input v-model.trim="templateDraft.description" maxlength="120" placeholder="可选" />
              </el-form-item>
            </div>
          </el-form>

          <div class="op-actions">
            <el-button @click="createBlankTemplate" :loading="savingTemplate">新增空白模板</el-button>
            <el-button type="primary" @click="saveCurrentFormAsTemplate" :loading="savingTemplate">保存当前创建表单为模板</el-button>
            <el-button @click="createTemplateFromSelectedProduct" :disabled="selectedProductRows.length !== 1" :loading="savingTemplate">从已勾选商品生成模板</el-button>
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
          <el-empty v-else description="暂无模板，先保存一个吧" />
        </el-card>

        <!-- 商品创建 -->
        <el-card v-show="activeMenu === 'create'" class="panel-card create-panel-card">
          <template #header>
            <div class="card-header">
              <span>➕ 创建商品</span>
              <div class="header-actions">
                <el-button text @click="fillCreateExample">示例填充（可选）</el-button>
                <el-button text @click="resetCreateForm">重置</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <section class="create-guide">
            <div class="create-guide-title">创建商品工作台</div>
            <p>按页面提示填写商品信息。左侧完成表单，右侧会实时提示必填项是否完善。</p>
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
                    <div class="section-title">基础信息</div>
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
                      <div class="field-meta">技术字段：item_biz_type</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="行业类目" required>
                      <el-select v-model="createForm.sp_biz_type" placeholder="请选择行业类目" style="width: 100%">
                        <el-option v-for="item in SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                      <div class="field-meta">技术字段：sp_biz_type</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="类目编号" required>
                      <el-input v-model.trim="createForm.channel_cat_id" placeholder="例如：e11455..." />
                      <div class="field-meta">技术字段：channel_cat_id</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="售价（分）" required>
                      <el-input-number v-model="createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
                      <div class="field-meta">100 分 = 1 元，技术字段：price</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="运费（分）" required>
                      <el-input-number v-model="createForm.express_fee" :step="1" style="width: 100%" />
                      <div class="field-meta">技术字段：express_fee</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="库存数量" required>
                      <el-input-number v-model="createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                      <div class="field-meta">技术字段：stock</div>
                    </el-form-item>
                  </div>
                </section>

                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">发布店铺</div>
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
                      <div class="field-meta">{{ shopBindingHint }}（技术字段：publish_shop.user_name）</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货省份编码" required>
                      <el-input-number v-model="createForm.publish_shop.province" :step="1" style="width: 100%" />
                      <div class="field-meta">技术字段：publish_shop.province</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货城市编码" required>
                      <el-input-number v-model="createForm.publish_shop.city" :step="1" style="width: 100%" />
                      <div class="field-meta">技术字段：publish_shop.city</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货区县编码" required>
                      <el-input-number v-model="createForm.publish_shop.district" :step="1" style="width: 100%" />
                      <div class="field-meta">技术字段：publish_shop.district</div>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="商品标题" required>
                      <el-input v-model.trim="createForm.publish_shop.title" maxlength="60" show-word-limit />
                      <div class="field-meta">技术字段：publish_shop.title</div>
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
                    <div class="field-meta">技术字段：publish_shop.content</div>
                  </el-form-item>
                  <el-form-item class="key-field required-field" label="商品图片链接" required>
                    <el-input
                      v-model="createForm.publish_shop.images_text"
                      type="textarea"
                      :rows="4"
                      placeholder="每行一个图片链接，或使用逗号分隔"
                    />
                    <div class="field-meta">当前已识别 {{ createImages.length }} 张（技术字段：publish_shop.images）</div>
                  </el-form-item>
                </section>

                <section class="form-section subtle create-block">
                  <el-collapse v-model="createOptionalPanels" class="optional-collapse">
                    <el-collapse-item name="advanced">
                      <template #title>
                        <div class="collapse-title-row">
                          <span class="section-title">可选高级设置</span>
                          <span class="section-badge optional">默认收起</span>
                        </div>
                      </template>
                      <el-form-item label="启用高级补充">
                        <el-switch v-model="createAdvancedEnabled" />
                        <span class="switch-tip">用于补充额外字段（可选）</span>
                      </el-form-item>
                      <el-form-item v-if="createAdvancedEnabled" label="补充信息（JSON）">
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
                <el-button type="primary" @click="createProduct" :loading="creatingProduct">➕ 创建商品</el-button>
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
              <div class="create-check-header">提交前检查</div>
              <div class="create-check-sub">必填状态与关键规则实时校验，提交前可快速自检</div>

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
                <div class="constraint-title">填写提醒</div>
                <ul>
                  <li v-for="tip in CREATE_CONSTRAINT_TIPS" :key="tip">{{ tip }}</li>
                </ul>
              </div>
            </aside>
          </div>
        </el-card>

        <!-- 商品上架 -->
        <el-card v-show="activeMenu === 'publish'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🚀 商品上架</span>
              <el-button text @click="resetPublishForm">重置</el-button>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先完成账号授权配置（AppKey + AppSecret）"
            type="warning"
            show-icon
            class="mb-4"
          />

          <p class="op-tip">填写商品与店铺后即可提交，处理结果会出现在“任务回执”页。</p>

          <div class="required-hint">
            <div class="hint-title">必填信息</div>
            <div class="hint-content">商品ID + 店铺账号</div>
            <div class="hint-sub">页面仅需填写一个店铺账号，系统会自动按平台要求处理。</div>
          </div>

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

          <el-form label-width="140px" class="compact-form panel-form">
            <section class="form-section">
              <div class="section-title-row">
                <div class="section-title">上架核心参数</div>
                <span class="section-badge required">必填</span>
              </div>
              <div class="form-grid publish-grid">
                <el-form-item class="key-field" label="商品ID" required>
                  <el-input-number v-model="publishForm.product_id" :min="1" :step="1" style="width: 100%" />
                  <div class="field-meta">技术字段：product_id</div>
                </el-form-item>
                <el-form-item class="key-field" label="上架店铺账号" required>
                  <el-select
                    v-model="publishForm.user_name"
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
                  <div class="field-meta">{{ shopBindingHint }}（技术字段：user_name）</div>
                </el-form-item>
              </div>
            </section>

            <section class="form-section subtle">
              <el-collapse v-model="publishOptionalPanels" class="optional-collapse">
                <el-collapse-item name="advanced">
                  <template #title>
                    <div class="collapse-title-row">
                      <span class="section-title">扩展设置（可选）</span>
                      <span class="section-badge optional">默认收起</span>
                    </div>
                  </template>

                  <div class="form-grid publish-grid">
                    <el-form-item label="定时上架时间">
                      <el-input
                        v-model.trim="publishForm.specify_publish_time"
                        placeholder="可选，如：2026-03-14 12:30:00"
                      />
                      <div class="field-meta">技术字段：specify_publish_time</div>
                    </el-form-item>
                  </div>

                  <el-form-item label="启用高级补充">
                    <el-switch v-model="publishAdvancedEnabled" />
                    <span class="switch-tip">用于补充额外字段（可选）</span>
                  </el-form-item>
                  <el-form-item v-if="publishAdvancedEnabled" label="补充信息（JSON）">
                    <el-input
                      v-model="publishAdvancedJson"
                      type="textarea"
                      :rows="8"
                      class="json-input"
                      placeholder='例如：{"specify_publish_time":"2026-03-14 12:30:00"}'
                    />
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>
            </section>
          </el-form>

          <div class="op-actions">
            <el-button type="warning" @click="publishProduct" :loading="publishingProduct">🚀 上架商品</el-button>
          </div>
          <el-alert
            v-if="publishProductError"
            :title="publishProductError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />
          <div v-if="publishProductResult" class="json-result">
            <pre>{{ publishProductResult }}</pre>
          </div>
        </el-card>

        <!-- 回调状态 -->
        <el-card v-show="activeMenu === 'callback'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📨 任务回执（最近记录）</span>
              <el-button size="small" @click="loadCallbackRecords" :loading="callbackLoading">🔄 刷新</el-button>
            </div>
          </template>

          <div class="callback-header-row">
            <span class="callback-tip">展示任务状态、失败原因、处理时间等关键信息</span>
          </div>

          <el-alert
            v-if="callbackError"
            :title="callbackError"
            type="error"
            show-icon
            closable
            class="mb-4"
          />
          <div v-if="callbackRecords.length > 0" class="table-scroll">
            <el-table :data="callbackRecords" stripe class="data-table callback-table">
              <el-table-column prop="received_at" label="接收时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.received_at) }}</template>
            </el-table-column>
            <el-table-column prop="task_type" label="任务类型" width="120" />
            <el-table-column prop="task_result" label="执行结果" width="120" />
            <el-table-column prop="err_code" label="错误代码" width="150" />
            <el-table-column prop="err_msg" label="失败原因" min-width="220" show-overflow-tooltip />
            <el-table-column prop="product_id" label="商品ID" width="140" />
            <el-table-column prop="publish_status" label="上架状态" width="130" />
            <el-table-column prop="user_name" label="店铺账号" width="150" />
              <el-table-column prop="task_time" label="处理时间" width="180">
                <template #default="scope">{{ formatCallbackTime(scope.row.task_time) }}</template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无回调记录" />
        </el-card>
      </el-main>
    </el-container>

    <footer class="status-bar">
      <span v-if="lastQueryTime">最后店铺查询：{{ lastQueryTime }}</span>
      <span>服务状态：{{ backendStatus }}</span>
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
  '售价、运费、库存需填写整数。',
  '商品标题建议控制在 60 字以内。',
  '商品描述建议 5~5000 字。',
  '商品图片建议 1~30 张，且不要重复。',
]

const MENU_META = {
  config: { title: '账号授权配置', desc: '保存 AppKey、AppSecret 等授权信息，其他功能会自动复用。' },
  shops: { title: '已绑定店铺', desc: '查看当前授权下可用店铺，并自动选择默认店铺。' },
  products: { title: '商品管理', desc: '查看商品列表、库存、价格和状态，并支持勾选批量上架。' },
  orders: { title: '订单查询', desc: '查看订单金额、状态、买卖双方和下单时间。' },
  batchPublish: { title: '批量上架', desc: '把勾选的商品批量上架，失败项可一键重试。' },
  templates: { title: '模板中心', desc: '沉淀常用模板，快速复用创建信息。' },
  create: { title: '创建商品', desc: '分步骤填写商品信息，支持高级补充项。' },
  publish: { title: '上架商品', desc: '默认带出已绑定店铺，可手动切换后提交上架。' },
  callback: { title: '任务回执', desc: '查看最近任务处理状态与失败原因。' },
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
    loadCallbackRecords(true)
  }

  if (['create', 'publish', 'batchPublish'].includes(index)) {
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

function getDefaultPublishForm() {
  return {
    product_id: null,
    user_name: '',
    specify_publish_time: '',
    notify_url: getInternalCallbackUrl(),
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
      ? '绑定完整：appid / seller_id / secret 已保存，查询能力可长期复用。'
      : '核心绑定已完成：appid / secret 已保存；seller_id 可按需补充。'
  }
  return '请至少确保 appid + AppSecret 已保存，避免刷新后配置失效。'
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
  if (force || !publishForm.user_name) {
    publishForm.user_name = defaultUserName
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
  page_size: 20,
})

const selectedProductRows = ref([])
const selectedProductIds = computed(() => {
  const ids = selectedProductRows.value
    .map((item) => Number(item?.product_id))
    .filter((id) => Number.isInteger(id) && id > 0)
  return Array.from(new Set(ids))
})
const selectedProductsForBatch = computed(() => {
  const idSet = new Set(selectedProductIds.value)
  return products.value.filter((item) => idSet.has(Number(item?.product_id)))
})

const batchPublishForm = reactive({
  user_name: '',
  specify_publish_time: '',
  notify_url: getInternalCallbackUrl(),
})
const batchPublishing = ref(false)
const batchRetryingFailed = ref(false)
const batchPublishError = ref('')
const batchPublishResult = ref(null)
const failedBatchProductIds = computed(() => {
  if (!batchPublishResult.value || !Array.isArray(batchPublishResult.value.results)) return []
  return batchPublishResult.value.results
    .filter((item) => !item.success)
    .map((item) => Number(item.product_id))
    .filter((id) => Number.isInteger(id) && id > 0)
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
  page_size: 20,
})

// 创建/上架状态
const createForm = reactive(getDefaultCreateForm())
const publishForm = reactive(getDefaultPublishForm())

const createAdvancedEnabled = ref(false)
const publishAdvancedEnabled = ref(false)
const createAdvancedJson = ref('{}')
const publishAdvancedJson = ref('{}')
const createOptionalPanels = ref([])
const publishOptionalPanels = ref([])

const creatingProduct = ref(false)
const publishingProduct = ref(false)
const createProductError = ref('')
const publishProductError = ref('')
const createProductResult = ref('')
const publishProductResult = ref('')

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
      label: '基础信息已完善',
      ok: basicOk,
      hint: '商品类型、行业类目、类目编号、售价、运费、库存',
    },
    {
      key: 'shop',
      label: '发布店铺信息已完善',
      ok: shopOk,
      hint: '店铺账号 + 省/市/区编码',
    },
    {
      key: 'content',
      label: '标题与描述符合规则',
      ok: textOk,
      hint: `标题 ${shop.title?.length || 0}/60，描述 ${shop.content?.length || 0}/5000`,
    },
    {
      key: 'images',
      label: '图片数量和去重通过',
      ok: imagesOk,
      hint: `已识别 ${createImages.value.length} 张，建议 1~30 张且不重复`,
    },
    {
      key: 'advanced',
      label: '高级补充格式正确',
      ok: createAdvancedJsonValid.value,
      hint: createAdvancedEnabled.value ? '已启用高级补充，内容需为 JSON 对象' : '未启用高级补充，可忽略',
    },
  ]
})

// 回调记录
const callbackRecords = ref([])
const callbackLoading = ref(false)
const callbackError = ref('')
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
  await loadCallbackRecords(true)
  callbackTimer = setInterval(() => {
    loadCallbackRecords(true)
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
    pagination.page_size = 20
    return
  }

  pagination.count = Number(rawPagination.count) || 0
  pagination.page_no = Number(rawPagination.page_no) || 1
  pagination.page_size = Number(rawPagination.page_size) || 20
}

function applyOrdersPagination(rawPagination) {
  if (!rawPagination || typeof rawPagination !== 'object') {
    ordersPagination.count = 0
    ordersPagination.page_no = 1
    ordersPagination.page_size = 20
    return
  }

  ordersPagination.count = Number(rawPagination.count) || 0
  ordersPagination.page_no = Number(rawPagination.page_no) || 1
  ordersPagination.page_size = Number(rawPagination.page_size) || 20
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
  queryProducts(true)
}

function refreshShops() {
  queryShops(true)
}

function refreshOrders() {
  queryOrders(true)
}

function handleProductSelectionChange(rows) {
  selectedProductRows.value = Array.isArray(rows) ? rows : []
}

function clearProductSelection() {
  selectedProductRows.value = []
}

function openBatchPublishWithSelection() {
  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请先勾选要批量上架的商品')
    return
  }
  activeMenu.value = 'batchPublish'
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
  const payload = {
    product_ids: productIds,
    user_name: (batchPublishForm.user_name || '').trim(),
    notify_url: getInternalCallbackUrl(),
  }

  if (batchPublishForm.specify_publish_time && batchPublishForm.specify_publish_time.trim()) {
    payload.specify_publish_time = batchPublishForm.specify_publish_time.trim()
  }

  return payload
}

async function submitBatchPublish(productIds = null) {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成账号授权配置')
    return
  }

  const targetIds = Array.isArray(productIds) && productIds.length > 0
    ? productIds
    : selectedProductIds.value

  if (!targetIds.length) {
    ElMessage.warning('请先勾选要上架的商品')
    return
  }

  if (!(batchPublishForm.user_name || '').trim()) {
    batchPublishError.value = hasBoundShops.value
      ? '批量上架前请先选择店铺账号'
      : '暂无已绑定店铺，请先到“已绑定店铺”获取店铺后再提交'
    ElMessage.error(batchPublishError.value)
    return
  }

  if (Array.isArray(productIds) && productIds.length > 0) {
    batchRetryingFailed.value = true
  } else {
    batchPublishing.value = true
  }
  batchPublishError.value = ''

  try {
    const payload = buildBatchPublishPayload(targetIds)
    const res = await fetch(`${API_BASE}/api/products/publish/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      batchPublishResult.value = data
      ElMessage.success(data.message || '批量上架执行完成')
    } else {
      batchPublishError.value = data.detail || '批量上架失败'
      ElMessage.error(batchPublishError.value)
    }
  } catch (e) {
    batchPublishError.value = e.message || '批量上架失败'
    ElMessage.error(batchPublishError.value)
  } finally {
    batchPublishing.value = false
    batchRetryingFailed.value = false
  }
}

async function retryFailedBatchItems() {
  if (failedBatchProductIds.value.length === 0) {
    ElMessage.info('当前没有失败项可重试')
    return
  }
  await submitBatchPublish(failedBatchProductIds.value)
}

// 保存配置
async function saveConfig() {
  if (!config.appid) {
    ElMessage.warning('请先填写 AppKey (appid)')
    return
  }

  const localSecret = (config.appsecret || '').trim()
  if (!localSecret && !hasSavedSecret.value) {
    ElMessage.warning('当前无已保存 secret，请输入 AppSecret 后再保存')
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
      ElMessage.success(data.secret_preserved ? '配置已保存（沿用已保存的 AppSecret）' : (data.message || '配置已保存'))
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
    if (!silent) ElMessage.warning('请先完成账号授权配置')
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
        const actionText = forceRefresh ? '已刷新店铺信息' : '已获取店铺信息'
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
async function queryProducts(forceRefresh = false) {
  if (!configReady.value) {
    ElMessage.warning('请先完成账号授权配置')
    return
  }

  queryingProducts.value = true
  productsError.value = ''
  productsRestoredAt.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/products`)
    const data = await res.json()

    if (data.success && Array.isArray(data.data)) {
      products.value = data.data
      productsQueried.value = true
      productsQueryTime.value = data.query_time || ''
      productsFetchedAt.value = new Date().toLocaleString('zh-CN')
      clearProductSelection()

      applyProductsPagination(data.pagination)
      persistProductsCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，共 ${products.value.length} 条记录`)
    } else {
      productsError.value = data.detail || '获取失败'
      ElMessage.error(productsError.value)
    }
  } catch (e) {
    productsError.value = '获取失败：' + e.message
    ElMessage.error(productsError.value)
  } finally {
    queryingProducts.value = false
  }
}

async function queryOrders(forceRefresh = false) {
  if (!configReady.value) {
    ElMessage.warning('请先完成账号授权配置')
    return
  }

  queryingOrders.value = true
  ordersError.value = ''
  ordersRestoredAt.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/orders`)
    const data = await res.json()

    if (data.success && Array.isArray(data.data)) {
      orders.value = data.data
      ordersQueried.value = true
      ordersQueryTime.value = data.query_time || ''
      ordersFetchedAt.value = new Date().toLocaleString('zh-CN')

      applyOrdersPagination(data.pagination)
      persistOrdersCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，共 ${orders.value.length} 条记录`)
    } else {
      ordersError.value = data.detail || '获取失败'
      ElMessage.error(ordersError.value)
    }
  } catch (e) {
    ordersError.value = '获取失败：' + e.message
    ElMessage.error(ordersError.value)
  } finally {
    queryingOrders.value = false
  }
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
    throw new Error(`${actionName}扩展 JSON 格式错误：${e.message}`)
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${actionName}扩展 JSON 必须是对象`)
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
  if (!createForm.channel_cat_id) return '请填写类目编号'
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
      : '暂无已绑定店铺，请先到“已绑定店铺”获取店铺后再提交'
  }
  if (!isInteger(shop.province)) return '请填写发货省份编码'
  if (!isInteger(shop.city)) return '请填写发货城市编码'
  if (!isInteger(shop.district)) return '请填写发货区县编码'
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

function validatePublishForm() {
  if (!isInteger(publishForm.product_id) || publishForm.product_id <= 0) {
    return '请填写正确的商品ID'
  }
  if (!publishForm.user_name) {
    return hasBoundShops.value
      ? '请选择上架店铺账号'
      : '暂无已绑定店铺，请先到“已绑定店铺”获取店铺后再提交'
  }
  if (publishForm.specify_publish_time && typeof publishForm.specify_publish_time !== 'string') {
    return '定时上架时间格式不正确'
  }
  return ''
}

function buildPublishPayload() {
  const basePayload = {
    product_id: publishForm.product_id,
    user_name: [publishForm.user_name],
    notify_url: getInternalCallbackUrl(),
  }

  if (publishForm.specify_publish_time) {
    basePayload.specify_publish_time = publishForm.specify_publish_time
  }

  if (!publishAdvancedEnabled.value) return basePayload
  const extra = parseExtraJson(publishAdvancedJson.value, '上架商品')
  const merged = deepMerge(basePayload, extra)
  merged.notify_url = getInternalCallbackUrl()
  return merged
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
  ElMessage.success('已填充演示示例（未提交）')
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

function resetPublishForm() {
  Object.assign(publishForm, getDefaultPublishForm())
  applyDefaultShopUserNames()
  publishAdvancedEnabled.value = false
  publishAdvancedJson.value = '{}'
  publishOptionalPanels.value = []
  publishProductError.value = ''
  publishProductResult.value = ''
}

async function createProduct() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成账号授权配置')
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

async function publishProduct() {
  applyDefaultShopUserNames()

  if (!configReady.value) {
    ElMessage.warning('请先完成账号授权配置')
    return
  }

  const err = validatePublishForm()
  if (err) {
    publishProductError.value = err
    ElMessage.error(err)
    return
  }

  publishingProduct.value = true
  publishProductError.value = ''
  publishProductResult.value = ''

  try {
    const payload = buildPublishPayload()
    const res = await fetch(`${API_BASE}/api/products/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (data.success) {
      publishProductResult.value = formatApiResult(data.raw || data)
      ElMessage.success((data.message || '上架商品请求成功') + '（接口为异步处理）')
    } else {
      publishProductError.value = data.detail || '上架商品失败'
      ElMessage.error(publishProductError.value)
    }
  } catch (e) {
    publishProductError.value = e.message || '上架商品失败'
    ElMessage.error(publishProductError.value)
  } finally {
    publishingProduct.value = false
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
      callbackError.value = data.detail || '回调记录读取失败'
      if (!silent) ElMessage.error(callbackError.value)
    }
  } catch (e) {
    callbackError.value = '回调记录读取失败：' + e.message
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

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.feature-item {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #eff6ff;
  padding: 12px;
}

.feature-item .title {
  font-size: 13px;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 6px;
}

.feature-item .desc {
  color: #475569;
  font-size: 12px;
  line-height: 1.55;
}

.op-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.batch-result-wrap {
  margin-top: 14px;
  border-top: 1px dashed #cbd5e1;
  padding-top: 12px;
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

.publish-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.op-tip {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 10px;
}

.required-hint {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #dbeafe;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  background: #f8fbff;
}

.hint-title {
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.hint-content {
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  word-break: break-all;
}

.hint-sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
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

  .pagination-info {
    width: 100%;
  }

  .form-section {
    padding: 12px 10px 8px;
  }

  .form-grid,
  .publish-grid {
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
