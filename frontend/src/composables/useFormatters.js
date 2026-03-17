export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN')
}

export function formatCallbackTime(value) {
  if (value === null || value === undefined || value === '') return '-'

  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const num = Number(value)
    const ms = num > 1e12 ? num : num * 1000
    const date = new Date(ms)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('zh-CN')
  }

  return formatDateTime(value)
}

export function formatOrderDateTimeDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return formatCallbackTime(value)
}

export function formatPriceDisplay(priceText, priceValue) {
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

export function formatIntegerDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    return '-'
  }

  return String(Math.trunc(normalized))
}

export function isInteger(value) {
  return Number.isInteger(value)
}

export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}
