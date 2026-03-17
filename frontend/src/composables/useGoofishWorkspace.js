import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDetailDialogs } from './useDetailDialogs'
import { DEFAULT_PRODUCT_STATUS_OPTIONS, getTaskStatusType, getOrderStatusType, getExpireClass, getStatusType } from './useStatusMaps'
import { formatDateTime, formatCallbackTime, formatOrderDateTimeDisplay, formatPriceDisplay, formatIntegerDisplay, isInteger, isPlainObject } from './useFormatters'

let workspaceInstance = null

export function useGoofishWorkspace() {
  if (workspaceInstance) return workspaceInstance


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
    shopManagement: { title: '店铺管理', desc: '统一管理绑定店铺与授权配置，保存后全局自动复用。' },
    productLibrary: { title: '商品库', desc: '统一查看商品与模板，并在右侧抽屉发布新商品。' },
    orders: { title: '订单管理', desc: '查看订单金额、状态、买卖双方和下单时间。' },
  }

  const activeMenu = ref('shopManagement')
  const viewportWidth = ref(window.innerWidth)
  const isCompactViewport = computed(() => viewportWidth.value <= 960)
  const headerRefreshing = ref(false)
  const shopManagementTab = ref('shops')
  const productLibraryTab = ref('products')

  const menuItems = [
    { key: 'shopManagement', icon: '🏪', label: '店铺管理' },
    { key: 'productLibrary', icon: '📦', label: '商品库' },
    { key: 'orders', icon: '🧾', label: '订单管理' },
  ]

  const currentMenuTitle = computed(() => MENU_META[activeMenu.value]?.title || 'Goofish')
  const currentMenuDesc = computed(() => MENU_META[activeMenu.value]?.desc || '')

  function syncViewport() {
    viewportWidth.value = window.innerWidth
  }

  function handleMenuSelect(index) {
    activeMenu.value = index

    if (index === 'shopManagement') {
      if (shopManagementTab.value === 'shops') {
        queryShops(true, true)
      }
      return
    }

    if (index === 'productLibrary') {
      ensureBoundShopsReady()
      if (productLibraryTab.value === 'templates') {
        loadTemplates(true)
      }
      return
    }
  }

  async function handleHeaderRefresh() {
    headerRefreshing.value = true
    try {
      if (activeMenu.value === 'shopManagement') {
        await loadConfig()
        if (shopManagementTab.value === 'shops' && configReady.value) {
          await queryShops(true)
        } else {
          ElMessage.success('授权配置已刷新')
        }
        return
      }

      if (activeMenu.value === 'productLibrary') {
        if (productLibraryTab.value === 'templates') {
          await loadTemplates()
        } else {
          await queryProducts(true, { page_no: 1, page_size: productQuery.page_size })
        }
        await loadProcessingResults(true)
        return
      }

      if (activeMenu.value === 'orders') {
        await queryOrders(true, { page_no: 1, page_size: orderQuery.page_size })
        return
      }
    } finally {
      headerRefreshing.value = false
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
    return '暂未获取到已绑定店铺。请先到「店铺管理 > 绑定的店铺」查询，或先手动填写店铺账号。'
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

  const {
    productDetailDialogVisible,
    productDetailLoading,
    productDetailError,
    productDetailProductId,
    productDetailDisplay,
    productDetailImageUrls,
    productDetailRawJson,
    orderDetailDialogVisible,
    orderDetailLoading,
    orderDetailError,
    orderDetailOrderId,
    orderDetailDisplay,
    orderDetailGoods,
    orderDetailLogistics,
    orderDetailRawJson,
    openProductDetail: openProductDetailDialog,
    openOrderDetail: openOrderDetailDialog,
  } = useDetailDialogs({
    apiBase: API_BASE,
    formatPriceDisplay,
    formatIntegerDisplay,
    formatOrderDateTimeDisplay,
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

  const DEMO_TEXT_RE = /(^|[\s_.-])(demo|mock|test)([\s_.-]|$)|演示|示例|测试/i

  function hasDemoMarker(...parts) {
    return parts.some((part) => DEMO_TEXT_RE.test(String(part ?? '').trim()))
  }

  function isDemoLocalTaskRecord(record) {
    if (!record || typeof record !== 'object') return false
    return hasDemoMarker(
      record.task_id,
      record.task_type,
      record.task_type_text,
      record.operator_user_name,
      record.message,
    )
  }

  function isDemoCallbackRecord(record) {
    if (!record || typeof record !== 'object') return false
    return hasDemoMarker(
      record.task_id,
      record.task_type,
      record.task_result,
      record.user_name,
      record.err_msg,
      record.product_id,
    )
  }

  const runningTaskCount = computed(() => {
    return localTaskRecords.value.filter((task) => ['queued', 'running'].includes(String(task?.status || ''))).length
  })
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
        ? '暂未选中店铺账号，请先到「店铺管理 > 绑定的店铺」查询或手动填写后再试'
        : '暂未获取到店铺，请先到「店铺管理 > 绑定的店铺」查询后再提交'
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
        inlineTaskNotice.value = `已创建批量上架任务（共 ${total} 件）。${taskId}系统正在后台逐个提交，可前往右上角「任务中心」查看任务进度。`
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
        ? '暂未选中店铺账号，请先到「店铺管理 > 绑定的店铺」查询或手动填写后再试'
        : '暂未获取到店铺，请先到「店铺管理 > 绑定的店铺」查询后再提交'
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
        inlineTaskNotice.value = `已创建批量下架任务（共 ${total} 件）。${taskId}系统正在后台逐个提交，可前往右上角「任务中心」查看任务进度。`
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
        ? '暂未选中店铺账号，请先到「店铺管理 > 绑定的店铺」查询或手动填写后再试'
        : '暂未获取到店铺，请先到「店铺管理 > 绑定的店铺」查询后再提交'
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
        inlineTaskNotice.value = `已创建批量删除任务（共 ${total} 件）。${taskId}系统正在后台逐个处理，可前往右上角「任务中心」查看任务进度。`
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
    activeMenu.value = 'productLibrary'
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
      productLibraryTab.value = 'templates'
      activeMenu.value = 'productLibrary'
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
    return openProductDetailDialog(row, (msg) => ElMessage.warning(msg))
  }

  async function openOrderDetail(row) {
    return openOrderDetailDialog(row, (msg) => ElMessage.warning(msg))
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
        : '暂未获取到店铺，请先到「店铺管理 > 绑定的店铺」查询后再提交'
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

    createForm.publish_shop.user_name = defaultShopUserName.value || ''
    createForm.publish_shop.province = 330000
    createForm.publish_shop.city = 330100
    createForm.publish_shop.district = 330106
    createForm.publish_shop.title = ''
    createForm.publish_shop.content = ''
    createForm.publish_shop.images_text = ''

    createAdvancedEnabled.value = false
    createAdvancedJson.value = '{}'
    createOptionalPanels.value = []
    createProductError.value = ''
    createProductResult.value = ''
    ElMessage.success('已填入基础模板，请填写真实商品信息后再提交')
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
        localTaskRecords.value = data.data.filter((record) => !isDemoLocalTaskRecord(record))
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
        callbackRecords.value = data.data.filter((record) => !isDemoCallbackRecord(record))
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


  const workspace = {
    API_BASE,
    PRODUCT_PAGE_SIZE_OPTIONS,
    PRODUCT_SORT_FIELD_OPTIONS,
    PRODUCT_SORT_ORDER_OPTIONS,
    ORDER_PAGE_SIZE_OPTIONS,
    ORDER_SORT_FIELD_OPTIONS,
    ORDER_SORT_ORDER_OPTIONS,
    ITEM_BIZ_TYPE_OPTIONS,
    SP_BIZ_TYPE_OPTIONS,
    CREATE_CONSTRAINT_TIPS,
    MENU_META,
    activeMenu,
    shopManagementTab,
    productLibraryTab,
    isCompactViewport,
    headerRefreshing,
    menuItems,
    currentMenuTitle,
    currentMenuDesc,
    config,
    hasSavedSecret,
    configLoadedFromBackend,
    configReady,
    bindingStatus,
    bindingStatusDesc,
    saving,
    querying,
    shops,
    queried,
    lastQueryTime,
    lastError,
    queryTime,
    shopsFetchedAt,
    shopsRestoredAt,
    backendStatus,
    shopOptions,
    hasBoundShops,
    defaultShopUserName,
    shopBindingHint,
    queryingProducts,
    products,
    productsQueried,
    productsError,
    productsQueryTime,
    productsFetchedAt,
    productsRestoredAt,
    pagination,
    productQuery,
    productStatusOptions,
    productFilters,
    selectedProductRows,
    selectedProductIds,
    creatingInlineBatchPublishTask,
    creatingInlineBatchDownshelfTask,
    creatingInlineBatchDeleteTask,
    inlineTaskNotice,
    batchPublishForm,
    templates,
    templatesLoading,
    templatesError,
    savingTemplate,
    templateDraft,
    queryingOrders,
    orders,
    ordersQueried,
    ordersError,
    ordersQueryTime,
    ordersFetchedAt,
    ordersRestoredAt,
    ordersPagination,
    orderQuery,
    orderStatusOptions,
    orderFilters,
    createForm,
    createAdvancedEnabled,
    createAdvancedJson,
    createOptionalPanels,
    creatingProduct,
    createProductError,
    createProductResult,
    createImages,
    createAdvancedJsonValid,
    createChecklist,
    callbackRecords,
    callbackLoading,
    callbackError,
    localTaskRecords,
    localTaskLoading,
    localTaskError,
    runningTaskCount,
    productDetailDialogVisible,
    productDetailLoading,
    productDetailError,
    productDetailProductId,
    productDetailDisplay,
    productDetailImageUrls,
    productDetailRawJson,
    orderDetailDialogVisible,
    orderDetailLoading,
    orderDetailError,
    orderDetailOrderId,
    orderDetailDisplay,
    orderDetailLogistics,
    orderDetailGoods,
    orderDetailRawJson,
    handleMenuSelect,
    handleHeaderRefresh,
    queryShops,
    refreshShops,
    queryProducts,
    refreshProducts,
    queryOrders,
    refreshOrders,
    handleProductSelectionChange,
    clearProductSelection,
    openBatchPublishWithSelection,
    openBatchDownShelfWithSelection,
    openBatchDeleteWithSelection,
    createTemplateFromProductRow,
    loadTemplates,
    createBlankTemplate,
    saveCurrentFormAsTemplate,
    createTemplateFromSelectedProduct,
    applyTemplate,
    removeTemplate,
    saveConfig,
    handleProductsCurrentPageChange,
    handleProductsPageSizeChange,
    handleProductsStatusFilterChange,
    handleProductsSortFieldChange,
    handleProductsSortOrderChange,
    resetProductsQueryControls,
    handleOrdersCurrentPageChange,
    handleOrdersPageSizeChange,
    handleOrdersStatusFilterChange,
    handleOrdersSortFieldChange,
    handleOrdersSortOrderChange,
    resetOrdersQueryControls,
    openProductDetail,
    openOrderDetail,
    fillCreateExample,
    resetCreateForm,
    createProduct,
    loadProcessingResults,
    formatDateTime,
    formatCallbackTime,
    getTaskStatusType,
    getOrderStatusType,
    getExpireClass,
    getStatusType,
  }

  workspaceInstance = workspace
  return workspace
}
