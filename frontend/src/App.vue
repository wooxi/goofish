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
          <el-menu-item index="config">⚙️ API 配置</el-menu-item>
          <el-menu-item index="shops">🏪 店铺信息查询</el-menu-item>
          <el-menu-item index="products">📦 商品列表查询</el-menu-item>
          <el-menu-item index="orders">🧾 订单信息查询</el-menu-item>
          <el-menu-item index="batchPublish">📚 批量上架工作台</el-menu-item>
          <el-menu-item index="templates">🧩 模板快捷创建</el-menu-item>
          <el-menu-item index="create">➕ 商品创建</el-menu-item>
          <el-menu-item index="publish">🚀 商品上架</el-menu-item>
          <el-menu-item index="callback">📨 回调状态</el-menu-item>
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
              <span>⚙️ API 配置</span>
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
              <span>🏪 店铺信息查询</span>
              <div class="header-actions">
                <el-button type="success" @click="queryShops" :loading="querying">🔍 查询店铺</el-button>
                <el-button @click="refreshShops" :loading="querying" :disabled="!configReady">🔄 重新获取</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
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
                      <el-descriptions-item label="业务类型">{{ props.row.item_biz_types || '-' }}</el-descriptions-item>
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
              <span>📦 商品列表查询</span>
              <div class="header-actions">
                <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 查询商品</el-button>
                <el-button @click="refreshProducts" :loading="queryingProducts" :disabled="!configReady">🔄 重新获取</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
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
              </div>
              <span v-if="productsQueryTime">⏱️ 耗时：{{ productsQueryTime }}</span>
              <span v-if="productsFetchedAt">🕒 查询时间：{{ productsFetchedAt }}</span>
            </div>

            <div class="table-scroll">
              <el-table :data="products" stripe class="data-table products-table">
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
              </el-table>
            </div>
          </div>

          <el-empty v-else-if="productsQueried" description="暂无商品数据" />
        </el-card>

        <!-- 订单列表 -->
        <el-card v-show="activeMenu === 'orders'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🧾 订单信息查询</span>
              <div class="header-actions">
                <el-button type="success" @click="queryOrders" :loading="queryingOrders">🔍 查询订单</el-button>
                <el-button @click="refreshOrders" :loading="queryingOrders" :disabled="!configReady">🔄 重新获取</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
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

        <!-- 批量上架工作台（Phase-2 规划位） -->
        <el-card v-show="activeMenu === 'batchPublish'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📚 批量上架工作台</span>
              <div class="header-actions">
                <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 拉取可上架商品</el-button>
                <el-button @click="activeMenu = 'publish'">🚀 去单商品上架</el-button>
              </div>
            </div>
          </template>

          <el-alert
            title="Phase-2 规划：支持勾选多个商品，一键批量上架（后端顺序逐个调用 publish 接口）。"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="roadmap-grid">
            <div class="roadmap-item done">
              <div class="title">阶段 1（已完成）</div>
              <ul>
                <li>绑定配置长期保存</li>
                <li>店铺/商品/订单查询与缓存恢复</li>
                <li>订单查询后端链路打通</li>
              </ul>
            </div>
            <div class="roadmap-item next">
              <div class="title">阶段 2（下一步）</div>
              <ul>
                <li>商品表格支持复选框多选</li>
                <li>后端顺序调用 publish，返回逐条结果</li>
                <li>失败项可重试 + 回调状态追踪</li>
              </ul>
            </div>
            <div class="roadmap-item plan">
              <div class="title">当前准备度</div>
              <ul>
                <li>可查询商品总数：{{ products.length }}</li>
                <li>可直接复用现有 publish 接口</li>
                <li>建议先在 5 条以内灰度验证</li>
              </ul>
            </div>
          </div>
        </el-card>

        <!-- 模板快捷创建（Phase-3 规划位） -->
        <el-card v-show="activeMenu === 'templates'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>🧩 模板快捷创建</span>
              <div class="header-actions">
                <el-button type="primary" @click="activeMenu = 'create'">➕ 去创建商品</el-button>
              </div>
            </div>
          </template>

          <el-alert
            title="Phase-3 规划：基于已有商品沉淀模板，新建时仅填写少数字段即可一键创建。"
            type="info"
            show-icon
            :closable="false"
            class="mb-4"
          />

          <div class="roadmap-grid">
            <div class="roadmap-item next">
              <div class="title">模板字段设计</div>
              <ul>
                <li>保留稳定字段：类目、发货地、图文模板</li>
                <li>覆盖易变字段：标题、价格、库存、图片</li>
                <li>支持从已有商品一键生成模板</li>
              </ul>
            </div>
            <div class="roadmap-item plan">
              <div class="title">交互方案</div>
              <ul>
                <li>模板列表 + 最近使用排序</li>
                <li>一键应用到创建表单并可二次编辑</li>
                <li>提交前显示最终请求体预览</li>
              </ul>
            </div>
            <div class="roadmap-item done">
              <div class="title">当前可先做</div>
              <ul>
                <li>先通过“商品创建”表单完成手工创建</li>
                <li>利用“示例填充”快速改少数字段</li>
                <li>后续平滑切换到模板模式</li>
              </ul>
            </div>
          </div>
        </el-card>

        <!-- 商品创建 -->
        <el-card v-show="activeMenu === 'create'" class="panel-card create-panel-card">
          <template #header>
            <div class="card-header">
              <span>➕ 商品创建</span>
              <div class="header-actions">
                <el-button text @click="fillCreateExample">示例填充（可选）</el-button>
                <el-button text @click="resetCreateForm">重置</el-button>
              </div>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
            type="warning"
            show-icon
            class="mb-4"
          />

          <section class="create-guide">
            <div class="create-guide-title">创建商品工作台</div>
            <p>按 create 接口标准字段填写。左侧完成分块表单，右侧实时检查必填状态与字段约束，提交前可快速自检。</p>
          </section>

          <div class="create-workspace">
            <div class="create-main">
              <el-form label-width="146px" class="compact-form panel-form create-form">
                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">基础信息</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <div class="form-grid">
                    <el-form-item class="key-field required-field" label="商品类型 item_biz_type" required>
                      <el-select v-model="createForm.item_biz_type" placeholder="请选择" style="width: 100%">
                        <el-option v-for="item in ITEM_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="行业类型 sp_biz_type" required>
                      <el-select v-model="createForm.sp_biz_type" placeholder="请选择" style="width: 100%">
                        <el-option v-for="item in SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="类目ID channel_cat_id" required>
                      <el-input v-model.trim="createForm.channel_cat_id" placeholder="如：e11455..." />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="售价 price(分)" required>
                      <el-input-number v-model="createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="运费 express_fee(分)" required>
                      <el-input-number v-model="createForm.express_fee" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="库存 stock" required>
                      <el-input-number v-model="createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                    </el-form-item>
                  </div>
                </section>

                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">发布店铺</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <div class="form-grid">
                    <el-form-item class="key-field required-field" label="闲鱼会员名 user_name" required>
                      <el-input v-model.trim="createForm.publish_shop.user_name" placeholder="tbxxxx" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货省 province" required>
                      <el-input-number v-model="createForm.publish_shop.province" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货市 city" required>
                      <el-input-number v-model="createForm.publish_shop.city" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="发货区 district" required>
                      <el-input-number v-model="createForm.publish_shop.district" :step="1" style="width: 100%" />
                    </el-form-item>
                    <el-form-item class="key-field required-field" label="标题 title" required>
                      <el-input v-model.trim="createForm.publish_shop.title" maxlength="60" show-word-limit />
                    </el-form-item>
                  </div>
                </section>

                <section class="form-section create-block">
                  <div class="section-title-row">
                    <div class="section-title">图片与描述</div>
                    <span class="section-badge required">必填</span>
                  </div>
                  <el-form-item class="key-field required-field" label="描述 content" required>
                    <el-input v-model="createForm.publish_shop.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
                  </el-form-item>
                  <el-form-item class="key-field required-field" label="图片 URLs" required>
                    <el-input
                      v-model="createForm.publish_shop.images_text"
                      type="textarea"
                      :rows="4"
                      placeholder="每行一个 URL（或逗号分隔）"
                    />
                    <div class="field-meta">当前解析图片：{{ createImages.length }} 张</div>
                  </el-form-item>
                </section>

                <section class="form-section subtle create-block">
                  <el-collapse v-model="createOptionalPanels" class="optional-collapse">
                    <el-collapse-item name="advanced">
                      <template #title>
                        <div class="collapse-title-row">
                          <span class="section-title">可选高级参数</span>
                          <span class="section-badge optional">默认收起</span>
                        </div>
                      </template>
                      <el-form-item label="高级模式">
                        <el-switch v-model="createAdvancedEnabled" />
                        <span class="switch-tip">附加扩展 JSON（可选）</span>
                      </el-form-item>
                      <el-form-item v-if="createAdvancedEnabled" label="扩展 JSON">
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
              <div class="create-check-sub">必填状态与关键规则实时校验（提交时仍以接口校验为准）</div>

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
                <div class="constraint-title">字段约束提示</div>
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
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
            type="warning"
            show-icon
            class="mb-4"
          />

          <p class="op-tip">按接口最小必填字段提交；接口为异步处理，结果看回调状态页。</p>

          <div class="required-hint">
            <div class="hint-title">最小必填字段（publish）</div>
            <div class="hint-content">product_id + user_name（数组）</div>
            <div class="hint-sub">当前页面输入单个 user_name，提交时自动按接口规范转换为 user_name: ["..."]。</div>
          </div>

          <el-form label-width="140px" class="compact-form panel-form">
            <section class="form-section">
              <div class="section-title-row">
                <div class="section-title">上架核心参数</div>
                <span class="section-badge required">必填</span>
              </div>
              <div class="form-grid publish-grid">
                <el-form-item class="key-field" label="商品ID product_id" required>
                  <el-input-number v-model="publishForm.product_id" :min="1" :step="1" style="width: 100%" />
                </el-form-item>
                <el-form-item class="key-field" label="闲鱼会员名 user_name" required>
                  <el-input v-model.trim="publishForm.user_name" placeholder="tbxxxx" />
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
                    </el-form-item>
                    <el-form-item label="回调地址 notify_url">
                      <el-input
                        v-model.trim="publishForm.notify_url"
                        placeholder="可选，建议填写后端回调接收地址"
                      />
                    </el-form-item>
                  </div>

                  <el-form-item label="高级模式">
                    <el-switch v-model="publishAdvancedEnabled" />
                    <span class="switch-tip">附加扩展 JSON（可选）</span>
                  </el-form-item>
                  <el-form-item v-if="publishAdvancedEnabled" label="扩展 JSON">
                    <el-input
                      v-model="publishAdvancedJson"
                      type="textarea"
                      :rows="8"
                      class="json-input"
                      placeholder='例如：{"notify_url":"https://xxx/callback"}'
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
              <span>📨 商品回调状态（最近记录）</span>
              <el-button size="small" @click="loadCallbackRecords" :loading="callbackLoading">🔄 刷新</el-button>
            </div>
          </template>

          <div class="callback-header-row">
            <span class="callback-tip">字段：task_type / task_result / err_code / err_msg / task_time 等</span>
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
            <el-table-column prop="task_type" label="task_type" width="120" />
            <el-table-column prop="task_result" label="task_result" width="120" />
            <el-table-column prop="err_code" label="err_code" width="150" />
            <el-table-column prop="err_msg" label="err_msg" min-width="220" show-overflow-tooltip />
            <el-table-column prop="product_id" label="product_id" width="140" />
            <el-table-column prop="publish_status" label="publish_status" width="130" />
            <el-table-column prop="user_name" label="user_name" width="150" />
              <el-table-column prop="task_time" label="task_time" width="180">
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
      <span>后端状态：{{ backendStatus }}</span>
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

const ITEM_BIZ_TYPE_OPTIONS = [
  { value: 2, label: '2 - 普通商品' },
  { value: 0, label: '0 - 已验货' },
  { value: 10, label: '10 - 验货宝' },
  { value: 16, label: '16 - 品牌授权' },
  { value: 19, label: '19 - 闲鱼严选' },
  { value: 24, label: '24 - 闲鱼特卖' },
  { value: 26, label: '26 - 品牌捡漏' },
  { value: 35, label: '35 - 跨境商品' },
]

const SP_BIZ_TYPE_OPTIONS = [
  1, 2, 3, 8, 9, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 33, 99,
].map((value) => ({ value, label: String(value) }))

const CREATE_CONSTRAINT_TIPS = [
  'price / express_fee / stock 必须为整数。',
  'publish_shop.title 长度需为 1~60。',
  'publish_shop.content 长度需为 5~5000。',
  'publish_shop.images 数量需为 1~30，且不可重复。',
]

const MENU_META = {
  config: { title: 'API 配置', desc: '配置 appid / appsecret / seller_id，作为全部功能的基础。' },
  shops: { title: '店铺信息查询', desc: '查询店铺授权与状态信息。' },
  products: { title: '商品列表查询', desc: '查询商品列表、价格、库存与状态。' },
  orders: { title: '订单信息查询', desc: '查询订单列表、金额、状态和买卖双方信息。' },
  batchPublish: { title: '批量上架工作台', desc: '面向 Phase-2：批量勾选商品并顺序调用上架接口。' },
  templates: { title: '模板快捷创建', desc: '面向 Phase-3：基于模板少填字段快速创建商品。' },
  create: { title: '商品创建', desc: '按接口字段化创建商品，支持可选高级 JSON 扩展。' },
  publish: { title: '商品上架', desc: '提交上架请求（异步），结果在回调状态查看。' },
  callback: { title: '回调状态', desc: '查看最近商品回调记录，追踪任务状态与错误信息。' },
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
    notify_url: `${API_BASE}/api/products/callback/receive`,
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
      label: '基础参数完整',
      ok: basicOk,
      hint: 'item_biz_type / sp_biz_type / channel_cat_id / price / express_fee / stock',
    },
    {
      key: 'shop',
      label: '发布店铺信息完整',
      ok: shopOk,
      hint: 'publish_shop.user_name + province/city/district',
    },
    {
      key: 'content',
      label: '标题与描述符合规则',
      ok: textOk,
      hint: `title ${shop.title?.length || 0}/60，content ${shop.content?.length || 0}/5000`,
    },
    {
      key: 'images',
      label: '图片数量与去重校验',
      ok: imagesOk,
      hint: `已解析 ${createImages.value.length} 张，要求 1~30 且不能重复`,
    },
    {
      key: 'advanced',
      label: '高级 JSON 配置合法',
      ok: createAdvancedJsonValid.value,
      hint: createAdvancedEnabled.value ? '已启用高级模式，JSON 必须为对象' : '未启用高级模式，可忽略',
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
  restoreProductsCache()
  restoreOrdersCache()
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

function refreshProducts() {
  queryProducts(true)
}

function refreshShops() {
  queryShops(true)
}

function refreshOrders() {
  queryOrders(true)
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
async function queryShops(forceRefresh = false) {
  if (!configReady.value) {
    ElMessage.warning('请先完成 API 配置')
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

      persistShopsCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，共 ${shops.value.length} 个店铺`)
    } else {
      lastError.value = data.detail || '查询失败'
      ElMessage.error(lastError.value)
    }
  } catch (e) {
    lastError.value = '查询失败：' + e.message
    ElMessage.error(lastError.value)
  } finally {
    querying.value = false
  }
}

// 查询商品
async function queryProducts(forceRefresh = false) {
  if (!configReady.value) {
    ElMessage.warning('请先完成 API 配置')
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

      applyProductsPagination(data.pagination)
      persistProductsCache()

      const actionText = forceRefresh ? '重新获取成功，缓存已更新' : '查询成功'
      ElMessage.success(`${actionText}，共 ${products.value.length} 条记录`)
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

async function queryOrders(forceRefresh = false) {
  if (!configReady.value) {
    ElMessage.warning('请先完成 API 配置')
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
    return 'item_biz_type 不在文档枚举范围内'
  }
  if (!SP_BIZ_TYPE_OPTIONS.some((item) => item.value === createForm.sp_biz_type)) {
    return 'sp_biz_type 不在文档枚举范围内'
  }
  if (!createForm.channel_cat_id) return 'channel_cat_id 为必填'
  if (!isInteger(createForm.price) || createForm.price < 1 || createForm.price > 9999999900) {
    return 'price 必须是整数，范围 1~9999999900'
  }
  if (!isInteger(createForm.express_fee)) return 'express_fee 必须是整数'
  if (!isInteger(createForm.stock) || createForm.stock < 1 || createForm.stock > 399960) {
    return 'stock 必须是整数，范围 1~399960'
  }

  const shop = createForm.publish_shop
  if (!shop.user_name) return 'publish_shop.user_name 为必填'
  if (!isInteger(shop.province)) return 'publish_shop.province 必须是整数'
  if (!isInteger(shop.city)) return 'publish_shop.city 必须是整数'
  if (!isInteger(shop.district)) return 'publish_shop.district 必须是整数'
  if (!shop.title || shop.title.length > 60) return 'publish_shop.title 长度需为 1~60'
  if (!shop.content || shop.content.length < 5 || shop.content.length > 5000) {
    return 'publish_shop.content 长度需为 5~5000'
  }

  const images = parseImages(shop.images_text)
  if (images.length < 1 || images.length > 30) return 'publish_shop.images 数量需为 1~30'
  if (new Set(images).size !== images.length) return 'publish_shop.images 不能包含重复项'

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
    return 'product_id 必须是正整数'
  }
  if (!publishForm.user_name) return 'user_name 为必填'
  if (publishForm.specify_publish_time && typeof publishForm.specify_publish_time !== 'string') {
    return 'specify_publish_time 必须是字符串'
  }
  if (publishForm.notify_url && typeof publishForm.notify_url !== 'string') {
    return 'notify_url 必须是字符串'
  }
  return ''
}

function buildPublishPayload() {
  const basePayload = {
    product_id: publishForm.product_id,
    user_name: [publishForm.user_name],
  }

  if (publishForm.specify_publish_time) {
    basePayload.specify_publish_time = publishForm.specify_publish_time
  }
  if (publishForm.notify_url) {
    basePayload.notify_url = publishForm.notify_url
  }

  if (!publishAdvancedEnabled.value) return basePayload
  const extra = parseExtraJson(publishAdvancedJson.value, '上架商品')
  return deepMerge(basePayload, extra)
}

function formatApiResult(result) {
  return JSON.stringify(result, null, 2)
}

function fillCreateExample() {
  createForm.item_biz_type = 2
  createForm.sp_biz_type = 1
  createForm.channel_cat_id = 'e11455'
  createForm.price = 19900
  createForm.express_fee = 0
  createForm.stock = 5

  createForm.publish_shop.user_name = 'tb_demo_shop'
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
  createAdvancedEnabled.value = false
  createAdvancedJson.value = '{}'
  createOptionalPanels.value = []
  createProductError.value = ''
  createProductResult.value = ''
}

function resetPublishForm() {
  Object.assign(publishForm, getDefaultPublishForm())
  publishAdvancedEnabled.value = false
  publishAdvancedJson.value = '{}'
  publishOptionalPanels.value = []
  publishProductError.value = ''
  publishProductResult.value = ''
}

async function createProduct() {
  if (!configReady.value) {
    ElMessage.warning('请先完成 API 配置')
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
  if (!configReady.value) {
    ElMessage.warning('请先完成 API 配置')
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

.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}

.roadmap-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 12px;
}

.roadmap-item .title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.roadmap-item ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  font-size: 12px;
  line-height: 1.55;
}

.roadmap-item.done {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.roadmap-item.next {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.roadmap-item.plan {
  border-color: #e2e8f0;
  background: #f8fafc;
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
