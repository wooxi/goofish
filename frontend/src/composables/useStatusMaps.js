export const DEFAULT_PRODUCT_STATUS_OPTIONS = [
  { value: 22, label: '销售中' },
  { value: 21, label: '仓库中' },
  { value: 31, label: '已下架' },
  { value: 23, label: '已售罄' },
  { value: 33, label: '售出下架' },
  { value: 36, label: '自动下架' },
  { value: -1, label: '已删除' },
]

export function getTaskStatusType(status) {
  const map = {
    queued: 'info',
    running: 'warning',
    finished: 'success',
    partial_failed: 'warning',
    failed: 'danger',
  }
  return map[status] || 'info'
}

export function getOrderStatusType(text) {
  const value = String(text || '').toLowerCase()
  if (!value) return 'info'
  if (value.includes('成功') || value.includes('完成') || value.includes('已付款') || value.includes('已发货')) return 'success'
  if (value.includes('待') || value.includes('处理中')) return 'warning'
  if (value.includes('关闭') || value.includes('失败') || value.includes('取消')) return 'danger'
  return 'info'
}

export function getExpireClass(timestamp) {
  if (!timestamp) return 'expire-unknown'
  const now = Date.now() / 1000
  const daysLeft = (timestamp - now) / 86400
  if (daysLeft < 7) return 'expire-danger'
  if (daysLeft < 30) return 'expire-warning'
  return 'expire-success'
}

export function getStatusType(status) {
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
