import { ref, computed } from 'vue'

export function useDetailDialogs({
  apiBase,
  formatPriceDisplay,
  formatIntegerDisplay,
  formatOrderDateTimeDisplay,
}) {
  const productDetailDialogVisible = ref(false)
  const productDetailLoading = ref(false)
  const productDetailError = ref('')
  const productDetail = ref(null)
  const productDetailFallbackRow = ref(null)
  const productDetailProductId = ref(null)

  const orderDetailDialogVisible = ref(false)
  const orderDetailLoading = ref(false)
  const orderDetailError = ref('')
  const orderDetail = ref(null)
  const orderDetailFallbackRow = ref(null)
  const orderDetailOrderId = ref('')

  const productDetailSource = computed(() => {
    const detail = productDetail.value && typeof productDetail.value === 'object' ? productDetail.value : {}
    const fallback = productDetailFallbackRow.value && typeof productDetailFallbackRow.value === 'object'
      ? productDetailFallbackRow.value
      : {}
    return { ...fallback, ...detail }
  })

  const orderDetailSource = computed(() => {
    const detail = orderDetail.value && typeof orderDetail.value === 'object' ? orderDetail.value : {}
    const fallback = orderDetailFallbackRow.value && typeof orderDetailFallbackRow.value === 'object'
      ? orderDetailFallbackRow.value
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

  async function openProductDetail(row, notifyWarning = () => {}) {
    const productId = Number(row?.product_id)
    if (!Number.isInteger(productId) || productId <= 0) {
      notifyWarning('当前商品编号无效，暂时无法查看详情')
      return
    }

    productDetailDialogVisible.value = true
    productDetailLoading.value = true
    productDetailError.value = ''
    productDetailProductId.value = productId
    productDetailFallbackRow.value = row && typeof row === 'object' ? { ...row } : null
    productDetail.value = null

    try {
      const res = await fetch(`${apiBase}/api/products/${productId}`)
      const data = await res.json()

      if (data.success && data.data && typeof data.data === 'object') {
        productDetail.value = data.data
      } else {
        productDetailError.value = data.detail || '商品详情暂时没取到，请稍后再试'
        notifyWarning(productDetailError.value)
      }
    } catch (e) {
      productDetailError.value = `商品详情加载失败：${e.message}`
      notifyWarning(productDetailError.value)
    } finally {
      productDetailLoading.value = false
    }
  }

  async function openOrderDetail(row, notifyWarning = () => {}) {
    const orderId = String(row?.order_id || row?.order_no || row?.biz_order_id || row?.id || '').trim()
    if (!orderId) {
      notifyWarning('当前订单号无效，暂时无法查看详情')
      return
    }

    orderDetailDialogVisible.value = true
    orderDetailLoading.value = true
    orderDetailError.value = ''
    orderDetailOrderId.value = orderId
    orderDetailFallbackRow.value = row && typeof row === 'object' ? { ...row } : null
    orderDetail.value = null

    try {
      const res = await fetch(`${apiBase}/api/orders/${encodeURIComponent(orderId)}`)
      const data = await res.json()

      if (data.success && data.data && typeof data.data === 'object') {
        orderDetail.value = data.data
        if (data.warning) {
          orderDetailError.value = data.warning
        }
      } else {
        orderDetailError.value = data.detail || '订单详情暂时没取到，已展示列表可得字段'
        notifyWarning(orderDetailError.value)
      }
    } catch (e) {
      orderDetailError.value = `订单详情加载失败：${e.message}`
      notifyWarning(orderDetailError.value)
    } finally {
      orderDetailLoading.value = false
    }
  }

  return {
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

    openProductDetail,
    openOrderDetail,
  }
}
