<template>
  <MainLayout />
</template>

<script setup>
import { provide } from 'vue'
import MainLayout from './components/MainLayout.vue'
import { useGoofishWorkspace } from './composables/useGoofishWorkspace'

const store = useGoofishWorkspace()
provide('goofishWorkspace', store)
</script>

<style>
:root {
  --brand-primary: #4f46e5;
  --brand-primary-soft: #eef2ff;
  --surface-base: #f1f5f9;
  --surface-card: #ffffff;
  --surface-sidebar: #0f172a;
  --border-subtle: #e2e8f0;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--surface-base);
  color: #1f2937;
}

.goofish-layout {
  min-height: 100vh;
}

.layout-root {
  min-height: calc(100vh - 32px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  background: var(--surface-card);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

.sidebar {
  background: var(--surface-sidebar);
  color: #e2e8f0;
  border-right: 1px solid #1e293b;
  position: sticky;
  top: 0;
  height: 100vh;
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

.workspace {
  background: #f8fafc;
  padding: 18px;
}

.workspace-header {
  margin-bottom: 14px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
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

.page-scene {
  animation: page-fade-in 0.22s ease;
}

@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
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

.section-skeleton {
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #ffffff;
  padding: 14px;
}

.el-tag {
  border-radius: 999px;
  border: none;
  font-weight: 600;
}

.el-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #eef2ff;
  --el-table-border-color: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.el-table tr {
  transition: background-color 0.2s ease;
}

.el-button--primary {
  --el-button-bg-color: var(--brand-primary);
  --el-button-border-color: var(--brand-primary);
  --el-button-hover-bg-color: #6366f1;
  --el-button-hover-border-color: #6366f1;
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
}</style>
