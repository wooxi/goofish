<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>🧩 模板中心</span>
        <div class="header-actions">
          <el-button @click="store.loadTemplates()" :loading="store.templatesLoading.value">🔄 刷新模板</el-button>
          <el-button type="primary" @click="goCreatePage">➕ 去创建商品</el-button>
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
          <el-input v-model.trim="store.templateDraft.name" maxlength="80" placeholder="例如：手机配件通用模板" />
        </el-form-item>
        <el-form-item label="模板说明">
          <el-input v-model.trim="store.templateDraft.description" maxlength="120" placeholder="选填，便于团队理解用途" />
        </el-form-item>
      </div>
    </el-form>

    <div class="op-actions">
      <el-button @click="store.createBlankTemplate" :loading="store.savingTemplate.value">新建空白模板</el-button>
      <el-button type="primary" @click="store.saveCurrentFormAsTemplate" :loading="store.savingTemplate.value">将当前表单保存为模板</el-button>
      <el-button @click="store.createTemplateFromSelectedProduct" :disabled="store.selectedProductRows.value.length !== 1" :loading="store.savingTemplate.value">从已选商品生成模板</el-button>
    </div>

    <el-alert v-if="store.templatesError.value" :title="store.templatesError.value" type="error" show-icon closable class="mb-4" />

    <div class="table-scroll" v-if="store.templates.value.length > 0">
      <el-table :data="store.templates.value" stripe class="data-table products-table">
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column label="更新时间" width="180">
          <template #default="scope">{{ store.formatDateTime(scope.row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template #default="scope">
            <el-button link type="primary" @click="applyTemplateAndGoCreate(scope.row)">应用并去创建</el-button>
            <el-button link type="danger" @click="store.removeTemplate(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-else description="还没有模板，先保存一个常用模板吧" />
  </el-card>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const store = inject('goofishWorkspace')
const router = useRouter()

function goCreatePage() {
  store.handleMenuSelect('create')
  router.push({ name: 'create' })
}

function applyTemplateAndGoCreate(template) {
  store.applyTemplate(template)
  router.push({ name: 'create' })
}
</script>
