<template>
  <div class="app-container">
    <header class="header">
      <h1>🐟 Goofish 闲鱼管理</h1>
      <p class="subtitle">店铺和商品查询系统</p>
    </header>

    <main class="main-content">
      <!-- 配置卡片 -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span>⚙️ API 配置</span>
            <el-button type="primary" @click="saveConfig" :loading="saving">💾 保存配置</el-button>
          </div>
        </template>
        
        <el-form :model="config" label-width="120px" size="large">
          <el-form-item label="AppKey (appid)" required>
            <el-input v-model="config.appid" placeholder="请输入 appid" type="number" />
          </el-form-item>
          <el-form-item label="AppSecret" required>
            <el-input v-model="config.appsecret" placeholder="请输入 appsecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="Seller ID" optional>
            <el-input v-model="config.seller_id" placeholder="可选，商家 ID" type="number" />
          </el-form-item>
          <el-form-item label="最后更新">
            <span class="update-time">{{ config.updated_at || '从未更新' }}</span>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 查询卡片 - 店铺 -->
      <el-card class="query-card">
        <template #header>
          <div class="card-header">
            <span>🏪 店铺信息查询</span>
            <el-button type="success" @click="queryShops" :loading="querying">🔍 查询店铺</el-button>
          </div>
        </template>

        <el-alert
          v-if="!config.appid || !config.appsecret"
          title="请先配置 AppKey 和 AppSecret"
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

          <el-table :data="shops" style="width: 100%" stripe>
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

      <!-- 查询卡片 - 商品 -->
      <el-card class="query-card">
        <template #header>
          <div class="card-header">
            <span>📦 商品列表查询</span>
            <el-button type="success" @click="queryProducts" :loading="queryingProducts">🔍 查询商品</el-button>
          </div>
        </template>

        <el-alert
          v-if="!config.appid || !config.appsecret"
          title="请先配置 AppKey 和 AppSecret"
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

          <el-table :data="products" style="width: 100%" stripe>
            <el-table-column prop="product_id" label="商品 ID" width="180" />
            <el-table-column prop="title" label="商品标题" min-width="300" />
            <el-table-column label="价格" width="100">
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
    </main>

    <el-footer class="footer">
      <span v-if="lastQueryTime">最后查询：{{ lastQueryTime }}</span>
      <span>后端状态：{{ backendStatus }}</span>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8001' 
  : `http://${window.location.hostname}:8001`

// 配置
const config = reactive({
  appid: 0,
  appsecret: '',
  seller_id: null,
  updated_at: ''
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
  page_size: 20
})

// 加载配置
onMounted(async () => {
  await checkBackend()
  await loadConfig()
})

// 检查后端状态
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`)
    backendStatus.value = res.ok ? '✅ 运行中' : '❌ 异常'
  } catch (e) {
    backendStatus.value = '❌ 未连接'
  }
}

// 加载配置
async function loadConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/config`)
    const data = await res.json()
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
  if (!config.appid || !config.appsecret) {
    ElMessage.warning('请填写完整的 AppKey 和 AppSecret')
    return
  }

  saving.value = true
  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appid: config.appid,
        appsecret: config.appsecret,
        seller_id: config.seller_id ? parseInt(config.seller_id) : null
      })
    })
    
    const data = await res.json()
    if (data.success) {
      config.updated_at = new Date().toISOString()
      ElMessage.success(data.message || '配置已保存')
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
  if (!config.appid || !config.appsecret) {
    ElMessage.warning('请先配置 AppKey 和 AppSecret')
    return
  }

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
  if (!config.appid || !config.appsecret) {
    ElMessage.warning('请先配置 AppKey 和 AppSecret')
    return
  }

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
    21: 'info', 22: 'success', 23: 'warning',
    31: 'info', 33: 'success', 36: 'danger',
  }
  return map[status] || 'info'
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
.app-container { max-width: 1400px; margin: 0 auto; padding: 20px; }
.header { text-align: center; color: white; margin-bottom: 30px; }
.header h1 { font-size: 2.5em; margin-bottom: 8px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
.subtitle { font-size: 1.1em; opacity: 0.9; }
.main-content { display: flex; flex-direction: column; gap: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.config-card, .query-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.mb-4 { margin-bottom: 16px; }
.result-info {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; padding: 8px 12px; background: #f0f9ff; border-radius: 6px;
}
.pagination-info { display: flex; gap: 15px; font-size: 0.85em; color: #666; }
.update-time { color: #666; font-size: 0.9em; }
.shop-info { padding: 8px 0; }
.shop-name { font-weight: bold; font-size: 1.1em; color: #2c3e50; margin-bottom: 6px; }
.shop-meta { display: flex; gap: 15px; font-size: 0.9em; color: #666; }
.status-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.price { color: #e74c3c; font-weight: bold; font-size: 1.05em; }
.shop-detail { padding: 15px; background: #f8f9fa; }
.shop-detail h4 { margin-bottom: 12px; color: #2c3e50; }
.footer {
  margin-top: 30px; text-align: center; color: rgba(255,255,255,0.8);
  font-size: 0.9em; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;
}
.expire-success { color: #27ae60; font-weight: 500; }
.expire-warning { color: #f39c12; font-weight: 500; }
.expire-danger { color: #e74c3c; font-weight: 500; }
.expire-unknown { color: #999; }
.el-card__header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.el-card__header .card-header span { color: white; }
</style>
