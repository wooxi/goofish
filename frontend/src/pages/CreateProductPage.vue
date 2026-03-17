<template>
  <el-card class="panel-card create-panel-card">
    <template #header>
      <div class="card-header">
        <span>➕ 发布新商品</span>
        <div class="header-actions">
          <el-button text @click="store.fillCreateExample">一键填入示例</el-button>
          <el-button text @click="store.resetCreateForm">重置</el-button>
        </div>
      </div>
    </template>

    <el-alert
      v-if="!store.configReady.value"
      title="请先完成店铺授权（AppKey + AppSecret）"
      type="warning"
      show-icon
      class="mb-4"
    />

    <section class="create-guide">
      <div class="create-guide-title">发布信息填写区</div>
      <p>按提示填写商品信息。左侧填写内容，右侧会实时提醒还差哪些必填项。</p>
    </section>

    <el-alert
      v-if="!store.hasBoundShops.value"
      :title="store.shopBindingHint.value"
      type="warning"
      show-icon
      :closable="false"
      class="mb-4"
    />
    <el-alert
      v-else
      :title="store.shopBindingHint.value"
      type="success"
      show-icon
      :closable="false"
      class="mb-4"
    />

    <div class="create-workspace">
      <div class="create-main">
        <el-form label-width="146px" class="compact-form panel-form create-form">
          <section class="form-section create-block">
            <div class="section-title-row">
              <div class="section-title">商品基础信息</div>
              <span class="section-badge required">必填</span>
            </div>
            <div class="form-grid">
              <el-form-item class="key-field required-field" label="商品类型" required>
                <el-select v-model="store.createForm.item_biz_type" placeholder="请选择商品类型" style="width: 100%">
                  <el-option
                    v-for="item in store.ITEM_BIZ_TYPE_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div class="field-meta">请选择最贴近商品实际情况的类型</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="行业类目" required>
                <el-select v-model="store.createForm.sp_biz_type" placeholder="请选择行业类目" style="width: 100%">
                  <el-option v-for="item in store.SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <div class="field-meta">选择行业类目，影响审核和曝光</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="商品类目编号" required>
                <el-input v-model.trim="store.createForm.channel_cat_id" placeholder="例如：e11455（可在平台类目选择器复制）" />
                <div class="field-meta">请填写平台类目编号</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="售价（单位：分）" required>
                <el-input-number v-model="store.createForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
                <div class="field-meta">100 分 = 1 元，例如 19900 表示 199 元</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="运费（单位：分）" required>
                <el-input-number v-model="store.createForm.express_fee" :step="1" style="width: 100%" />
                <div class="field-meta">包邮填 0；不包邮请填实际运费</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="库存数量" required>
                <el-input-number v-model="store.createForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                <div class="field-meta">可售数量范围 1~399960，建议与真实库存一致</div>
              </el-form-item>
            </div>
          </section>

          <section class="form-section create-block">
            <div class="section-title-row">
              <div class="section-title">发货与店铺信息</div>
              <span class="section-badge required">必填</span>
            </div>
            <div class="form-grid">
              <el-form-item class="key-field required-field" label="发布店铺账号" required>
                <el-select
                  v-model="store.createForm.publish_shop.user_name"
                  filterable
                  allow-create
                  clearable
                  default-first-option
                  placeholder="请选择或输入店铺账号"
                  style="width: 100%"
                >
                  <el-option
                    v-for="shop in store.shopOptions.value"
                    :key="shop.user_name"
                    :label="shop.label"
                    :value="shop.user_name"
                  />
                </el-select>
                <div class="field-meta">{{ store.shopBindingHint.value }}</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="发货省份代码" required>
                <el-input-number v-model="store.createForm.publish_shop.province" :step="1" style="width: 100%" />
                <div class="field-meta">按平台地区码填写，例如 330000</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="发货城市代码" required>
                <el-input-number v-model="store.createForm.publish_shop.city" :step="1" style="width: 100%" />
                <div class="field-meta">按平台地区码填写，例如 330100</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="发货区县代码" required>
                <el-input-number v-model="store.createForm.publish_shop.district" :step="1" style="width: 100%" />
                <div class="field-meta">按平台地区码填写，例如 330106</div>
              </el-form-item>
              <el-form-item class="key-field required-field" label="商品标题" required>
                <el-input v-model.trim="store.createForm.publish_shop.title" maxlength="60" show-word-limit />
                <div class="field-meta">建议包含品牌/型号/成色，最多 60 字</div>
              </el-form-item>
            </div>
          </section>

          <section class="form-section create-block">
            <div class="section-title-row">
              <div class="section-title">图片与描述</div>
              <span class="section-badge required">必填</span>
            </div>
            <el-form-item class="key-field required-field" label="商品描述" required>
              <el-input v-model="store.createForm.publish_shop.content" type="textarea" :rows="4" maxlength="5000" show-word-limit />
              <div class="field-meta">建议写清成色、功能、配件和售后说明</div>
            </el-form-item>
            <el-form-item class="key-field required-field" label="商品图片链接" required>
              <el-input
                v-model="store.createForm.publish_shop.images_text"
                type="textarea"
                :rows="4"
                placeholder="每行一个图片链接，也支持用逗号分隔"
              />
              <div class="field-meta">已识别 {{ store.createImages.value.length }} 张，建议 1~30 张且不要重复</div>
            </el-form-item>
          </section>

          <section class="form-section subtle create-block">
            <el-collapse v-model="store.createOptionalPanels.value" class="optional-collapse">
              <el-collapse-item name="advanced">
                <template #title>
                  <div class="collapse-title-row">
                    <span class="section-title">更多补充信息（可选）</span>
                    <span class="section-badge optional">默认收起</span>
                  </div>
                </template>
                <el-form-item label="启用高级补充">
                  <el-switch v-model="store.createAdvancedEnabled.value" />
                  <span class="switch-tip">仅在你明确需要额外参数时开启</span>
                </el-form-item>
                <el-form-item v-if="store.createAdvancedEnabled.value" label="补充参数（JSON）">
                  <el-input
                    v-model="store.createAdvancedJson.value"
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
          <el-button type="primary" @click="store.createProduct" :loading="store.creatingProduct.value">➕ 提交创建</el-button>
        </div>

        <el-alert
          v-if="store.createProductError.value"
          :title="store.createProductError.value"
          type="error"
          show-icon
          closable
          class="mb-4"
        />
        <div v-if="store.createProductResult.value" class="json-result">
          <pre>{{ store.createProductResult.value }}</pre>
        </div>
      </div>

      <aside class="create-check-card">
        <div class="create-check-header">提交前自检</div>
        <div class="create-check-sub">系统会实时检查必填项和关键规则，提交前先看一眼更稳妥</div>

        <ul class="create-check-list">
          <li
            v-for="item in store.createChecklist.value"
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
          <div class="constraint-title">填写小贴士</div>
          <ul>
            <li v-for="tip in store.CREATE_CONSTRAINT_TIPS" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </aside>
    </div>
  </el-card>
</template>

<script setup>
import { inject } from 'vue'

const store = inject('goofishWorkspace')
</script>
