<template>
  <div class="goofish-layout">
    <el-container class="layout-root">
      <el-aside width="240px" class="sidebar">
        <div class="brand">
          <div class="brand-title">🐟 Goofish</div>
          <div class="brand-subtitle">闲鱼管理工作台</div>
        </div>

        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="config">⚙️ API 配置</el-menu-item>
          <el-menu-item index="shops">🏪 店铺信息查询</el-menu-item>
          <el-menu-item index="products">📦 商品列表查询</el-menu-item>
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
              <el-button type="success" @click="queryShops" :loading="querying">🔍 查询店铺</el-button>
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

          <div v-if="shops.length > 0" class="shops-list">
            <div class="result-info">
              <span>✅ 查询成功，共 <strong>{{ shops.length }}</strong> 个店铺</span>
              <span v-if="queryTime">⏱️ 耗时：{{ queryTime }}</span>
            </div>

            <el-table :data="shops" stripe>
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

          <el-empty v-else-if="queried" description="暂无店铺数据" />
        </el-card>

        <!-- 商品列表 -->
        <el-card v-show="activeMenu === 'products'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>📦 商品列表查询</span>
              <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 查询商品</el-button>
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

          <div v-if="products.length > 0" class="products-list">
            <div class="result-info">
              <span>✅ 查询成功，共 <strong>{{ products.length }}</strong> 条记录</span>
              <div class="pagination-info">
                <span>第 {{ pagination.page_no }} 页</span>
                <span>共 {{ pagination.count }} 条</span>
                <span>每页 {{ pagination.page_size }} 条</span>
              </div>
              <span v-if="productsQueryTime">⏱️ 耗时：{{ productsQueryTime }}</span>
            </div>

            <el-table :data="products" stripe>
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

          <el-empty v-else-if="productsQueried" description="暂无商品数据" />
        </el-card>

        <!-- 商品创建 -->
        <el-card v-show="activeMenu === 'create'" class="panel-card">
          <template #header>
            <div class="card-header">
              <span>➕ 商品创建</span>
              <el-button text @click="resetCreateForm">重置</el-button>
            </div>
          </template>

          <el-alert
            v-if="!configReady"
            title="请先配置 AppKey，并确保后端已有可用 AppSecret"
            type="warning"
            show-icon
            class="mb-4"
          />

          <p class="op-tip">按接口最小必填字段提交；高级模式可追加扩展 JSON。</p>

          <el-form label-width="140px" class="compact-form panel-form">
            <div class="form-grid">
              <el-form-item label="商品类型 item_biz_type" required>
                <el-select v-model="createForm.item_biz_type" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in ITEM_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="行业类型 sp_biz_type" required>
                <el-select v-model="createForm.sp_biz_type" placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="类目ID channel_cat_id" required>
                <el-input v-model.trim="createForm.channel_cat_id" placeholder="如：e11455..." />
              </el-form-item>
              <el-form-item label="售价 price(分)" required>
                <el-input-number v-model="createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="运费 express_fee(分)" required>
                <el-input-number v-model="createForm.express_fee" :step="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="库存 stock" required>
                <el-input-number v-model="createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
              </el-form-item>
            </div>

            <el-divider content-position="left">publish_shop[0]（必填）</el-divider>
            <div class="form-grid">
              <el-form-item label="闲鱼会员名 user_name" required>
                <el-input v-model.trim="createForm.publish_shop.user_name" placeholder="tbxxxx" />
              </el-form-item>
              <el-form-item label="发货省 province" required>
                <el-input-number v-model="createForm.publish_shop.province" :step="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="发货市 city" required>
                <el-input-number v-model="createForm.publish_shop.city" :step="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="发货区 district" required>
                <el-input-number v-model="createForm.publish_shop.district" :step="1" style="width: 100%" />
              </el-form-item>
              <el-form-item label="标题 title" required>
                <el-input v-model.trim="createForm.publish_shop.title" maxlength="60" show-word-limit />
              </el-form-item>
            </div>
            <el-form-item label="描述 content" required>
              <el-input v-model="createForm.publish_shop.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
            </el-form-item>
            <el-form-item label="图片 URLs" required>
              <el-input
                v-model="createForm.publish_shop.images_text"
                type="textarea"
                :rows="4"
                placeholder="每行一个 URL（或逗号分隔）"
              />
            </el-form-item>

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
          </el-form>

          <div class="op-actions">
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

          <el-form label-width="140px" class="compact-form panel-form">
            <el-form-item label="商品ID product_id" required>
              <el-input-number v-model="publishForm.product_id" :min="1" :step="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="闲鱼会员名 user_name" required>
              <el-input v-model.trim="publishForm.user_name" placeholder="tbxxxx" />
            </el-form-item>
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
          <el-table v-if="callbackRecords.length > 0" :data="callbackRecords" stripe>
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

const MENU_META = {
  config: { title: 'API 配置', desc: '配置 appid / appsecret / seller_id，作为全部功能的基础。' },
  shops: { title: '店铺信息查询', desc: '查询店铺授权与状态信息。' },
  products: { title: '商品列表查询', desc: '查询商品列表、价格、库存与状态。' },
  create: { title: '商品创建', desc: '按接口字段化创建商品，支持可选高级 JSON 扩展。' },
  publish: { title: '商品上架', desc: '提交上架请求（异步），结果在回调状态查看。' },
  callback: { title: '回调状态', desc: '查看最近商品回调记录，追踪任务状态与错误信息。' },
}

const activeMenu = ref('config')
const currentMenuTitle = computed(() => MENU_META[activeMenu.value]?.title || 'Goofish')
const currentMenuDesc = computed(() => MENU_META[activeMenu.value]?.desc || '')

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
const configReady = computed(() => {
  const appidReady = Boolean(config.appid)
  const secretReady = hasSavedSecret.value || Boolean((config.appsecret || '').trim())
  return appidReady && secretReady
})

// 状态
const saving = ref(false)
const querying = ref(false)
const shops = ref([])
const queried = ref(false)
const lastQueryTime = ref('')
const lastError = ref('')
const queryTime = ref('')
const backendStatus = ref('检测中...')

// 商品状态
const queryingProducts = ref(false)
const products = ref([])
const productsQueried = ref(false)
const productsError = ref('')
const productsQueryTime = ref('')
const pagination = reactive({
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

const creatingProduct = ref(false)
const publishingProduct = ref(false)
const createProductError = ref('')
const publishProductError = ref('')
const createProductResult = ref('')
const publishProductResult = ref('')

// 回调记录
const callbackRecords = ref([])
const callbackLoading = ref(false)
const callbackError = ref('')
let callbackTimer = null

onMounted(async () => {
  await checkBackend()
  await loadConfig()
  await loadCallbackRecords(true)
  callbackTimer = setInterval(() => {
    loadCallbackRecords(true)
  }, 30000)
})

onUnmounted(() => {
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
    if (data.appid && data.appid !== 0) {
      config.appid = data.appid
      config.seller_id = data.seller_id || ''
      config.updated_at = data.updated_at || ''
    }
  } catch (e) {
    console.error('配置加载失败:', e)
  }
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
async function queryShops() {
  querying.value = true
  queried.value = false
  shops.value = []
  lastError.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/shops`)
    const data = await res.json()

    if (data.success && data.data) {
      shops.value = data.data
      queried.value = true
      lastQueryTime.value = new Date().toLocaleString('zh-CN')
      queryTime.value = data.query_time || ''
      ElMessage.success(`查询成功，共 ${shops.value.length} 个店铺`)
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
async function queryProducts() {
  queryingProducts.value = true
  productsQueried.value = false
  products.value = []
  productsError.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/products`)
    const data = await res.json()

    if (data.success && data.data) {
      products.value = data.data
      productsQueried.value = true
      productsQueryTime.value = data.query_time || ''

      if (data.pagination) {
        pagination.count = data.pagination.count
        pagination.page_no = data.pagination.page_no
        pagination.page_size = data.pagination.page_size
      }
      ElMessage.success(`查询成功，共 ${products.value.length} 条记录`)
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

function resetCreateForm() {
  Object.assign(createForm, getDefaultCreateForm())
  createAdvancedEnabled.value = false
  createAdvancedJson.value = '{}'
  createProductError.value = ''
  createProductResult.value = ''
}

function resetPublishForm() {
  Object.assign(publishForm, getDefaultPublishForm())
  publishAdvancedEnabled.value = false
  publishAdvancedJson.value = '{}'
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
}

.sidebar-menu .el-menu-item:hover {
  color: #fff;
  background: #1e293b !important;
}

.sidebar-menu .el-menu-item.is-active {
  color: #fff;
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-form {
  max-width: 1100px;
}

.mb-4 { margin-bottom: 16px; }

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.pagination-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

.update-time { color: #64748b; font-size: 13px; }

.shop-info { padding: 8px 0; }
.shop-name { font-weight: 600; color: #0f172a; margin-bottom: 6px; }
.shop-meta { display: flex; gap: 15px; font-size: 13px; color: #64748b; }
.status-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.price { color: #dc2626; font-weight: 700; }
.shop-detail { padding: 15px; background: #f8fafc; }
.shop-detail h4 { margin-bottom: 10px; color: #334155; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 6px 10px;
}

.compact-form .el-form-item { margin-bottom: 12px; }

.op-tip {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 10px;
}

.switch-tip {
  margin-left: 10px;
  color: #64748b;
  font-size: 12px;
}

.op-actions { margin-top: 10px; margin-bottom: 10px; }

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
  .goofish-layout { padding: 8px; }
  .layout-root { min-height: auto; }
  .status-bar { flex-direction: column; gap: 6px; }
}
</style>
