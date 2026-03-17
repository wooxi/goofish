<template>
  <el-card class="panel-card">
    <template #header>
      <div class="card-header">
        <span>⚙️ 店铺授权设置</span>
        <el-button type="primary" @click="store.saveConfig" :loading="store.saving.value">💾 保存并生效</el-button>
      </div>
    </template>

    <el-alert
      v-if="store.configLoadedFromBackend.value"
      :title="`已读取已保存授权：AppKey=${store.config.appid || '-'}，${store.hasSavedSecret.value ? 'AppSecret 已保存' : 'AppSecret 未保存'}`"
      type="success"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <div class="binding-status-card mb-4">
      <div class="binding-status-title">授权保存状态</div>
      <div class="binding-status-grid">
        <div class="binding-status-item" :class="{ saved: store.bindingStatus.value.appidSaved }">
          <span class="label">AppKey（应用ID）</span>
          <span class="value">{{ store.bindingStatus.value.appidSaved ? '已保存' : '未保存' }}</span>
        </div>
        <div class="binding-status-item" :class="{ saved: store.bindingStatus.value.sellerIdSaved }">
          <span class="label">商家ID（选填）</span>
          <span class="value">{{ store.bindingStatus.value.sellerIdSaved ? '已保存' : '未保存' }}</span>
        </div>
        <div class="binding-status-item" :class="{ saved: store.bindingStatus.value.secretSaved }">
          <span class="label">AppSecret（密钥）</span>
          <span class="value">{{ store.bindingStatus.value.secretSaved ? '已保存' : '未保存' }}</span>
        </div>
      </div>
      <div class="binding-status-desc">{{ store.bindingStatusDesc.value }}</div>
    </div>

    <el-form :model="store.config" label-width="140px" size="large" class="panel-form">
      <el-form-item label="AppKey（应用ID）" required>
        <el-input v-model="store.config.appid" placeholder="请输入平台提供的 AppKey（数字）" type="number" />
      </el-form-item>
      <el-form-item label="AppSecret">
        <el-input
          v-model="store.config.appsecret"
          placeholder="如不修改可留空，系统会沿用已保存密钥"
          type="password"
          show-password
        />
      </el-form-item>
      <el-form-item label="商家ID（选填）">
        <el-input v-model="store.config.seller_id" placeholder="选填：用于锁定指定商家" type="number" />
      </el-form-item>
      <el-form-item label="最后更新">
        <span class="update-time">{{ store.config.updated_at || '暂无记录' }}</span>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
