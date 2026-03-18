<template>
  <div class="space-y-4">
    <el-card class="panel-card">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <el-tabs v-model="store.productLibraryTab.value" class="library-tabs" @tab-change="handleLibraryTabChange">
          <el-tab-pane label="全部商品" name="products" />
          <el-tab-pane label="模板库" name="templates" />
        </el-tabs>

        <el-button type="primary" @click="openCreateDrawer" class="publish-btn">+ 发布新商品</el-button>
      </div>

      <template v-if="store.productLibraryTab.value === 'products'">
        <el-alert
          v-if="!store.configReady.value"
          title="请先完成授权设置（AppKey + AppSecret）"
          type="warning"
          show-icon
          class="mb-4"
        />

        <el-alert v-if="store.productsError.value" :title="store.productsError.value" type="error" show-icon closable class="mb-4" />

        <div class="products-query-tools mb-4">
          <span class="products-query-tools__label">筛选与排序：</span>
          <el-select
            :model-value="store.productFilters.product_status"
            placeholder="销售状态"
            style="width: 170px"
            size="small"
            @change="store.handleProductsStatusFilterChange"
          >
            <el-option
              v-for="item in store.productStatusOptions.value"
              :key="`status-${item.value}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            :model-value="store.productFilters.sort_by"
            placeholder="排序字段"
            style="width: 190px"
            size="small"
            @change="store.handleProductsSortFieldChange"
          >
            <el-option
              v-for="item in store.PRODUCT_SORT_FIELD_OPTIONS"
              :key="`sort-field-${item.value || 'default'}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            :model-value="store.productFilters.sort_order"
            placeholder="排序方向"
            style="width: 170px"
            size="small"
            :disabled="!store.productFilters.sort_by"
            @change="store.handleProductsSortOrderChange"
          >
            <el-option
              v-for="item in store.PRODUCT_SORT_ORDER_OPTIONS"
              :key="`sort-order-${item.value}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button size="small" @click="store.resetProductsQueryControls">重置</el-button>
          <el-button type="success" size="small" @click="store.queryProducts" :loading="store.queryingProducts.value">查询商品</el-button>
        </div>

        <el-skeleton v-if="store.queryingProducts.value && store.products.value.length === 0" :rows="7" animated class="section-skeleton mb-4" />

        <template v-else>
          <div v-if="store.products.value.length > 0" class="result-info result-info--products">
            <div class="result-info-main">
              <span>共 <strong>{{ store.pagination.count }}</strong> 件商品（本页 {{ store.products.value.length }} 条）</span>
              <div class="pagination-info">
                <span>第 {{ store.pagination.page_no }} 页</span>
                <span>每页 {{ store.pagination.page_size }} 条</span>
                <span class="selected-count">已选 {{ store.selectedProductIds.value.length }} 件</span>
              </div>
            </div>
            <div class="header-actions">
              <el-select :model-value="store.productQuery.page_size" style="width: 126px" size="small" @change="store.handleProductsPageSizeChange">
                <el-option v-for="size in store.PRODUCT_PAGE_SIZE_OPTIONS" :key="size" :label="`每页 ${size} 条`" :value="size" />
              </el-select>
              <el-button size="small" @click="store.clearProductSelection" :disabled="store.selectedProductIds.value.length === 0">清空</el-button>
              <el-button type="warning" size="small" @click="store.openBatchPublishWithSelection" :loading="store.creatingInlineBatchPublishTask.value" :disabled="store.selectedProductIds.value.length === 0">上架已选</el-button>
              <el-button type="danger" plain size="small" @click="store.openBatchDownShelfWithSelection" :loading="store.creatingInlineBatchDownshelfTask.value" :disabled="store.selectedProductIds.value.length === 0">下架已选</el-button>
              <el-button type="danger" size="small" @click="store.openBatchDeleteWithSelection" :loading="store.creatingInlineBatchDeleteTask.value" :disabled="store.selectedProductIds.value.length === 0">删除已选</el-button>
            </div>
          </div>

          <el-alert v-if="store.inlineTaskNotice.value" :title="store.inlineTaskNotice.value" type="success" show-icon closable class="mb-4" />

          <div v-if="store.products.value.length > 0" class="table-scroll">
            <el-table
              :data="store.products.value"
              stripe
              class="data-table products-table"
              row-key="product_id"
              @selection-change="store.handleProductSelectionChange"
            >
              <el-table-column type="selection" width="52" reserve-selection />
              <el-table-column prop="product_id" label="商品编号" width="170" />
              <el-table-column label="商品标题" min-width="260" show-overflow-tooltip>
                <template #default="scope">
                  <el-button link type="primary" class="product-title-link" @click="store.openProductDetail(scope.row)">
                    {{ scope.row.title || `商品-${scope.row.product_id || '-'}` }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="价格" width="110">
                <template #default="scope"><span class="price">{{ scope.row.price_str }}</span></template>
              </el-table-column>
              <el-table-column prop="stock" label="库存" width="80" />
              <el-table-column prop="sold" label="销量" width="80" />
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="store.getStatusType(scope.row.product_status)" size="small">{{ scope.row.product_status_str }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button link type="primary" @click="createTemplateFromProduct(scope.row)">生成模板</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="store.products.value.length > 0" class="pagination-wrap">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :current-page="store.productQuery.page_no"
              :page-size="store.productQuery.page_size"
              :total="store.pagination.count"
              :disabled="store.queryingProducts.value"
              @current-change="store.handleProductsCurrentPageChange"
            />
          </div>

          <el-empty v-else description="暂无商品数据">
            <el-button type="primary" @click="store.queryProducts" :loading="store.queryingProducts.value">立即查询</el-button>
          </el-empty>
        </template>
      </template>

      <template v-else>
        <el-alert title="模板可复用发布信息，支持从当前表单或商品快速沉淀。" type="info" show-icon :closable="false" class="mb-4" />

        <el-form label-width="100px" class="compact-form mb-4">
          <div class="form-grid">
            <el-form-item label="模板名称" required>
              <el-input v-model.trim="store.templateDraft.name" maxlength="80" placeholder="例如：手机配件通用模板" />
            </el-form-item>
            <el-form-item label="模板说明">
              <el-input v-model.trim="store.templateDraft.description" maxlength="120" placeholder="选填" />
            </el-form-item>
          </div>
        </el-form>

        <div class="op-actions">
          <el-button @click="store.createBlankTemplate" :loading="store.savingTemplate.value">新建空白模板</el-button>
          <el-button type="primary" @click="store.saveCurrentFormAsTemplate" :loading="store.savingTemplate.value">保存当前表单为模板</el-button>
          <el-button @click="store.loadTemplates" :loading="store.templatesLoading.value">刷新模板</el-button>
        </div>

        <el-alert v-if="store.templatesError.value" :title="store.templatesError.value" type="error" show-icon closable class="mb-4" />

        <div v-if="store.templates.value.length > 0" class="table-scroll">
          <el-table :data="store.templates.value" stripe class="data-table products-table">
            <el-table-column label="模板名称" min-width="220">
              <template #default="scope">
                <div class="template-name-cell">
                  <span>{{ scope.row.name }}</span>
                  <el-tag v-if="scope.row.is_example" type="success" size="small">示例</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column label="更新时间" width="180">
              <template #default="scope">{{ store.formatDateTime(scope.row.updated_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" min-width="340">
              <template #default="scope">
                <div class="template-op-cell">
                  <el-button link type="primary" @click="applyTemplateAndOpen(scope.row)">应用到发布抽屉</el-button>
                  <el-button
                    link
                    type="success"
                    :disabled="scope.row.is_example"
                    @click="setTemplateAsExample(scope.row)"
                  >
                    {{ scope.row.is_example ? '当前示例' : '设为示例内容' }}
                  </el-button>
                  <el-button link type="primary" @click="openTemplateEditor(scope.row)">编辑</el-button>
                  <el-button link type="danger" @click="store.removeTemplate(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else description="还没有可复用的模板">
          <el-button type="primary" @click="openCreateDrawer">去创建并保存模板</el-button>
        </el-empty>
      </template>
    </el-card>

    <ProductDetailDialog />

    <el-dialog
      v-model="templateEditorVisible"
      title="编辑模板"
      width="760px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="120px" class="compact-form">
        <div class="form-grid-two mb-3">
          <el-form-item label="模板名称" required>
            <el-input v-model.trim="templateEditorForm.name" maxlength="80" placeholder="请输入模板名称" />
          </el-form-item>
          <el-form-item label="模板说明">
            <el-input v-model.trim="templateEditorForm.description" maxlength="120" placeholder="选填" />
          </el-form-item>
          <el-form-item label="商品类型" required>
            <el-select v-model="templateEditorForm.item_biz_type" style="width: 100%">
              <el-option v-for="item in store.ITEM_BIZ_TYPE_OPTIONS" :key="`editor-item-${item.value}`" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="行业类目" required>
            <el-select v-model="templateEditorForm.sp_biz_type" style="width: 100%">
              <el-option v-for="item in store.SP_BIZ_TYPE_OPTIONS" :key="`editor-sp-${item.value}`" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品类目编码">
            <el-input v-model.trim="templateEditorForm.channel_cat_id" placeholder="例如 e11455" />
          </el-form-item>
          <el-form-item label="店铺账号">
            <el-select
              v-model="templateEditorForm.user_name"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="请选择或输入店铺账号"
              style="width: 100%"
            >
              <el-option
                v-for="shop in store.shopOptions.value"
                :key="`editor-shop-${shop.user_name}`"
                :label="shop.label"
                :value="shop.user_name"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="售价（分）" required>
            <el-input-number v-model="templateEditorForm.price" :min="1" :max="9999999900" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="运费（分）" required>
            <el-input-number v-model="templateEditorForm.express_fee" :min="0" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="库存" required>
            <el-input-number v-model="templateEditorForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="发货省代码">
            <el-input-number v-model="templateEditorForm.province" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="发货市代码">
            <el-input-number v-model="templateEditorForm.city" :step="1" style="width: 100%" />
          </el-form-item>
          <el-form-item label="发货区代码">
            <el-input-number v-model="templateEditorForm.district" :step="1" style="width: 100%" />
          </el-form-item>
        </div>

        <el-form-item label="商品标题" required>
          <el-input v-model.trim="templateEditorForm.title" maxlength="60" show-word-limit placeholder="请输入商品标题" />
        </el-form-item>
        <el-form-item label="商品描述" required>
          <el-input
            v-model="templateEditorForm.content"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="图片链接">
          <el-input
            v-model="templateEditorForm.images_text"
            type="textarea"
            :rows="4"
            placeholder="每行一个图片 URL，也支持逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="templateEditorVisible = false">取消</el-button>
        <el-button type="primary" :loading="store.updatingTemplate.value" @click="saveTemplateEditor">保存模板</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="createDrawerVisible"
      direction="rtl"
      :size="drawerSize"
      :append-to-body="true"
      :destroy-on-close="false"
      class="publish-drawer"
      title="发布商品"
    >
      <div class="create-workspace">
        <div class="create-main">
          <div class="drawer-head mb-3">
            <div class="drawer-head-title">快速发布中心</div>
            <div class="drawer-head-sub">按提示补全关键信息，即可提交发布。</div>
          </div>

          <el-tabs v-model="publishMode" class="publish-mode-tabs">
            <el-tab-pane label="单件发布" name="single" />
            <el-tab-pane label="批量发布" name="batch" />
          </el-tabs>

          <template v-if="publishMode === 'single'">
            <div class="op-actions">
              <el-button text @click="fillSingleExample">一键填充示例</el-button>
              <el-button text @click="resetSingleForm">清空当前填写</el-button>
            </div>

            <el-alert v-if="store.createProductError.value" :title="store.createProductError.value" type="error" show-icon closable class="mb-4" />

            <el-form label-position="top" class="single-form">
              <el-card shadow="never" class="form-card mb-4">
                <template #header>
                  <div class="form-card-head">
                    <div class="form-card-title">基础信息</div>
                    <div class="form-card-subtitle">完善商品归属、价格与库存</div>
                  </div>
                </template>
                <div class="form-grid-two">
                  <el-form-item label="商品类型" required>
                    <el-select v-model="singleForm.item_biz_type" style="width: 100%">
                      <el-option v-for="item in store.ITEM_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>行业类目</span>
                        <el-tooltip content="准确选择行业类目有助于提升商品搜索曝光度" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-select v-model="singleForm.sp_biz_type" style="width: 100%">
                      <el-option v-for="item in store.SP_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>

                  <el-form-item required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>商品类目</span>
                        <el-tooltip content="选择更准确，买家更容易搜到" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-tree-select
                      v-model="singleForm.categoryValue"
                      :data="categoryOptions"
                      filterable
                      check-strictly
                      default-expand-all
                      clearable
                      :loading="categoryLoading"
                      style="width: 100%"
                      placeholder="请选择或搜索商品所属类目"
                    />
                    <el-input
                      v-model.trim="singleForm.channelCatIdManual"
                      clearable
                      class="mt-2"
                      placeholder="若未搜索到，可手动输入类目编码（选填）"
                    />
                  </el-form-item>

                  <el-form-item label="库存" required>
                    <el-input-number v-model="singleForm.stock" :min="1" :max="399960" :step="1" style="width: 100%" />
                  </el-form-item>

                  <el-form-item required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>售价（元）</span>
                        <el-tooltip content="建议参考同类在售价格，提升成交率" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-input v-model="singleForm.priceYuan" placeholder="0.00" @blur="normalizeMoneyField('priceYuan')">
                      <template #prepend>¥</template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="运费（元）" required>
                    <el-input v-model="singleForm.expressFeeYuan" placeholder="0.00" @blur="normalizeMoneyField('expressFeeYuan')">
                      <template #prepend>¥</template>
                    </el-input>
                  </el-form-item>
                </div>
              </el-card>

              <el-card shadow="never" class="form-card mb-4">
                <template #header>
                  <div class="form-card-head">
                    <div class="form-card-title">发货与内容</div>
                    <div class="form-card-subtitle">填写店铺信息与商品卖点描述</div>
                  </div>
                </template>
                <div class="form-grid-two">
                  <el-form-item label="发布店铺账号" required>
                    <el-select
                      v-model="singleForm.user_name"
                      filterable
                      allow-create
                      clearable
                      default-first-option
                      placeholder="请选择或输入店铺账号"
                      style="width: 100%"
                    >
                      <el-option v-for="shop in store.shopOptions.value" :key="shop.user_name" :label="shop.label" :value="shop.user_name" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="发货地区" required>
                    <el-cascader
                      v-model="singleForm.regionCodes"
                      :options="regionOptions"
                      :props="regionCascaderProps"
                      clearable
                      filterable
                      style="width: 100%"
                      placeholder="请选择省 / 市 / 区"
                    />
                  </el-form-item>

                  <el-form-item class="span-2" required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>商品标题</span>
                        <el-tooltip content="建议突出品牌、成色和核心规格" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-input v-model.trim="singleForm.title" maxlength="60" show-word-limit placeholder="示例：95新 iPhone 13 128G 黑色" />
                  </el-form-item>

                  <el-form-item class="span-2" required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>商品描述</span>
                        <el-tooltip content="写清成色、功能、配件和交易方式更容易成交" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <el-input
                      v-model="singleForm.content"
                      type="textarea"
                      :rows="4"
                      maxlength="5000"
                      show-word-limit
                      placeholder="建议写明成色、功能、配件、是否可议价等"
                    />
                  </el-form-item>

                  <el-form-item class="span-2" required>
                    <template #label>
                      <div class="label-with-tip">
                        <span>商品图片</span>
                        <el-tooltip content="建议上传清晰实拍图，首图优先展示主商品" placement="top">
                          <span class="label-tip-icon">?</span>
                        </el-tooltip>
                      </div>
                    </template>
                    <div class="image-input-row">
                      <el-input v-model.trim="newImageUrl" placeholder="粘贴图片 URL 后点击添加（支持 http/https）" @keyup.enter="addImageByUrl">
                        <template #append>
                          <el-button @click="addImageByUrl">添加</el-button>
                        </template>
                      </el-input>
                    </div>

                    <div class="image-wall" @dragover.prevent>
                      <div
                        v-for="(img, index) in singleForm.images"
                        :key="img.uid"
                        class="image-wall-item"
                        draggable="true"
                        @dragstart="onImageDragStart(index)"
                        @drop.prevent="onImageDrop(index)"
                      >
                        <el-image :src="img.url" :preview-src-list="singleImageUrls" :initial-index="index" fit="cover" class="image-thumb" />
                        <div class="image-meta">
                          <span>#{{ index + 1 }}</span>
                          <el-button link type="danger" @click="removeImage(index)">删除</el-button>
                        </div>
                      </div>

                      <div v-if="singleForm.images.length === 0" class="image-wall-empty">
                        <div class="image-empty-title">还没有添加商品图片</div>
                        <div class="image-empty-sub">可粘贴图片链接添加，支持拖拽调整顺序。</div>
                      </div>
                    </div>

                  </el-form-item>
                </div>
              </el-card>
            </el-form>

            <div class="op-actions create-actions">
              <el-button type="primary" class="drawer-primary-btn" @click="handleSingleSubmit" :loading="store.creatingProduct.value">
                {{ store.creatingProduct.value ? '正在提交…' : '立即发布商品' }}
              </el-button>
              <el-button class="drawer-secondary-btn" @click="createDrawerVisible = false">暂不发布</el-button>
            </div>

            <div v-if="singleSubmitFeedback" class="single-result-card" :class="singleSubmitFeedback.type === 'success' ? 'is-success' : 'is-warning'">
              <div class="single-result-title">{{ singleSubmitFeedback.title }}</div>
              <div class="single-result-desc">{{ singleSubmitFeedback.desc }}</div>
            </div>
          </template>

          <template v-else>
            <el-alert
              title="先下载模板填写商品信息，再上传并预览后统一提交。"
              type="info"
              :closable="false"
              class="mb-4"
            />

            <div class="op-actions mb-4">
              <el-button type="primary" plain class="drawer-ghost-btn" @click="downloadBatchTemplate">下载填写模板（CSV）</el-button>
              <el-button class="drawer-secondary-btn" @click="resetBatchState">清空本次上传</el-button>
            </div>

            <el-upload
              class="batch-upload"
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept=".csv,.txt,.xlsx,.xls"
              :on-change="handleBatchFileChange"
            >
              <span class="el-icon--upload">⇪</span>
              <div class="el-upload__text">拖拽文件到这里，或 <em>点击选择文件</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  建议先按模板列名填写，再上传预览，确认无误后批量发布。
                </div>
              </template>
            </el-upload>

            <el-alert v-if="batchState.parseError" :title="batchState.parseError" type="warning" show-icon class="mt-3" />

            <el-empty v-if="!batchState.headers.length && !batchState.parseError" class="batch-empty" description="还没有可预览的内容">
              <el-button type="primary" plain class="drawer-ghost-btn" @click="downloadBatchTemplate">先下载模板填写</el-button>
            </el-empty>

            <div v-if="batchState.headers.length" class="batch-preview mt-3">
              <div class="batch-preview-head">
                <div>
                  <strong>上传预览：</strong>
                  <span>{{ batchState.fileName }}（{{ batchState.rows.length }} 行）</span>
                </div>
                <el-tag type="success" effect="plain">可提交</el-tag>
              </div>

              <el-table :data="batchState.rows" border height="280" class="data-table">
                <el-table-column type="index" label="#" width="56" fixed="left" />
                <el-table-column
                  v-for="column in batchColumns"
                  :key="column.prop"
                  :prop="column.prop"
                  :label="column.label"
                  min-width="140"
                  show-overflow-tooltip
                />
              </el-table>
            </div>

            <div class="op-actions create-actions mt-3">
              <el-button type="primary" class="drawer-primary-btn" :disabled="batchState.rows.length === 0 || batchState.submitting" :loading="batchState.submitting" @click="handleBatchSubmit">
                {{ batchState.submitting ? '正在提交…' : '开始批量发布' }}
              </el-button>
              <el-button class="drawer-secondary-btn" :disabled="batchState.submitting" @click="createDrawerVisible = false">暂不发布</el-button>
            </div>

            <div v-if="batchState.progressTotal > 0" class="batch-progress mt-3">
              <div class="batch-progress-head">
                <span>提交进度</span>
                <span>{{ batchState.progressProcessed }} / {{ batchState.progressTotal }}</span>
              </div>
              <el-progress :percentage="batchProgressPercent" :status="batchProgressStatus" />
            </div>

            <div v-if="batchSummary" class="batch-result-summary mt-3">
              <el-tag type="info">共 {{ batchSummary.total }} 条</el-tag>
              <el-tag type="success">成功 {{ batchSummary.success }} 条</el-tag>
              <el-tag :type="batchSummary.failed > 0 ? 'danger' : 'info'">失败 {{ batchSummary.failed }} 条</el-tag>
            </div>

            <div v-if="batchState.results.length" class="batch-result-table mt-3">
              <el-table :data="batchState.results" border max-height="300" class="data-table">
                <el-table-column prop="row_no" label="行号" width="72" />
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
                <el-table-column label="结果" width="90">
                  <template #default="scope">
                    <el-tag :type="scope.row.success ? 'success' : 'danger'" size="small">
                      {{ scope.row.success ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="说明" min-width="240" show-overflow-tooltip />
              </el-table>
            </div>
          </template>
        </div>

        <aside class="drawer-check-card">
          <div class="create-check-header">右侧自检</div>
          <div class="create-check-sub">{{ publishMode === 'single' ? '单件模式检查发布信息完整度' : '批量模式检查模板、上传与预览进度' }}</div>
          <ul class="drawer-check-list">
            <li
              v-for="item in activeChecklist"
              :key="item.key"
              class="drawer-check-item"
              :class="item.ok ? 'is-ok' : 'is-pending'"
            >
              <div class="item-title">{{ item.label }}</div>
              <div class="item-status">{{ item.ok ? '已完成' : '待完善' }}</div>
            </li>
          </ul>
        </aside>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { computed, inject, reactive, ref, watch } from 'vue'
import ProductDetailDialog from '../components/ProductDetailDialog.vue'

const store = inject('goofishWorkspace')
const createDrawerVisible = ref(false)
const publishMode = ref('single')
const drawerSize = computed(() => (store.isCompactViewport.value ? '96vw' : '78vw'))
const templateEditorVisible = ref(false)
const editingTemplateId = ref('')

function getDefaultTemplateEditorForm() {
  return {
    name: '',
    description: '',
    source: 'manual',
    item_biz_type: 2,
    sp_biz_type: 1,
    channel_cat_id: '',
    price: 1,
    express_fee: 0,
    stock: 1,
    user_name: '',
    province: null,
    city: null,
    district: null,
    title: '',
    content: '',
    images_text: '',
  }
}

const templateEditorForm = reactive(getDefaultTemplateEditorForm())

function resetTemplateEditorForm() {
  Object.assign(templateEditorForm, getDefaultTemplateEditorForm())
  editingTemplateId.value = ''
}

const singleSubmitFeedback = computed(() => {
  const errorText = String(store.createProductError?.value || '').trim()
  if (errorText) {
    return {
      type: 'warning',
      title: '发布失败',
      desc: errorText,
    }
  }

  const resultText = String(store.createProductResult?.value || '').trim()
  if (resultText) {
    return {
      type: 'success',
      title: '发布请求已提交',
      desc: '创建结果已返回，可在商品列表或任务中心继续查看。',
    }
  }

  return null
})

const API_BASE = store.API_BASE

const regionCascaderProps = {
  emitPath: true,
  expandTrigger: 'hover',
}

const fallbackRegionOptions = [
  {
    label: '浙江省',
    value: 330000,
    children: [
      {
        label: '杭州市',
        value: 330100,
        children: [
          { label: '西湖区', value: 330106 },
          { label: '余杭区', value: 330110 },
        ],
      },
      {
        label: '宁波市',
        value: 330200,
        children: [
          { label: '海曙区', value: 330203 },
          { label: '鄞州区', value: 330212 },
        ],
      },
    ],
  },
  {
    label: '广东省',
    value: 440000,
    children: [
      {
        label: '广州市',
        value: 440100,
        children: [
          { label: '天河区', value: 440106 },
          { label: '海珠区', value: 440105 },
        ],
      },
      {
        label: '深圳市',
        value: 440300,
        children: [
          { label: '南山区', value: 440305 },
          { label: '福田区', value: 440304 },
        ],
      },
    ],
  },
]

const regionOptions = ref([...fallbackRegionOptions])
const regionDataSource = ref('fallback')
const regionApiLoaded = ref(false)

const fallbackCategoryOptions = [
  {
    label: '手机数码',
    value: 'fallback_sp_mobile',
    children: [
      { label: '手机', value: 'e11455', categoryId: 'e11455', categoryCode: 'e11455' },
      { label: '平板电脑', value: 'e11456', categoryId: 'e11456', categoryCode: 'e11456' },
      { label: '智能手表', value: 'e11457', categoryId: 'e11457', categoryCode: 'e11457' },
    ],
  },
  {
    label: '家电家居',
    value: 'fallback_sp_home',
    children: [
      { label: '厨房电器', value: 'e22101', categoryId: 'e22101', categoryCode: 'e22101' },
      { label: '个护电器', value: 'e22102', categoryId: 'e22102', categoryCode: 'e22102' },
    ],
  },
  {
    label: '服饰鞋包',
    value: 'fallback_sp_clothes',
    children: [
      { label: '男装', value: 'e33101', categoryId: 'e33101', categoryCode: 'e33101' },
      { label: '女装', value: 'e33102', categoryId: 'e33102', categoryCode: 'e33102' },
    ],
  },
]

const categoryOptions = ref([...fallbackCategoryOptions])
const categoryDataSource = ref('fallback')
const categoryLoading = ref(false)
const categoryLoadedKeySet = new Set()

const categoryLeafMap = new Map()
const categoryLookupMap = new Map()
const regionProvinceNameMap = new Map()
const regionCityNameMap = new Map()
const regionDistrictNameMap = new Map()

let xlsxModulePromise = null

async function loadXlsxModule() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx').catch((error) => {
      xlsxModulePromise = null
      throw error
    })
  }
  return xlsxModulePromise
}

const BATCH_FIELD_ALIASES = {
  title: ['标题', '商品标题', 'title'],
  content: ['描述', '商品描述', 'content'],
  price: ['售价(元)', '售价', '价格(元)', '价格', 'price', 'priceyuan'],
  express_fee: ['运费(元)', '运费', 'express_fee', 'expressfee', 'postage'],
  stock: ['库存', 'stock'],
  user_name: ['店铺账号', '发布店铺账号', '店铺', 'user_name', 'username'],
  province: ['省代码', '省', '省份代码', 'province', 'provincecode'],
  city: ['市代码', '市', '城市代码', 'city', 'citycode'],
  district: ['区代码', '区', '区县代码', 'district', 'districtcode'],
  region: ['发货地区', '地区', 'region'],
  channel_cat_id: ['类目code', '类目编码', '类目', '商品类目', 'channel_cat_id', 'category', 'categorycode'],
  item_biz_type: ['商品类型', 'item_biz_type'],
  sp_biz_type: ['行业类目', 'sp_biz_type'],
  images: ['图片urls(竖线分隔)', '图片urls', '图片url', '图片链接', '图片', 'images'],
}

function normalizeLookupKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '')
    .replace(/[（）()\-]/g, '')
}

function indexCategoryLeaves(nodes) {
  ;(nodes || []).forEach((node) => {
    if (Array.isArray(node.children) && node.children.length > 0) {
      indexCategoryLeaves(node.children)
      return
    }
    categoryLeafMap.set(String(node.value || ''), node)
  })
}

function buildCategoryLookupMap() {
  categoryLookupMap.clear()
  for (const [value, node] of categoryLeafMap.entries()) {
    const keys = [value, node.categoryCode, node.categoryId, node.channel_cat_id, node.label]
    keys.forEach((key) => {
      const normalized = normalizeLookupKey(key)
      if (normalized) categoryLookupMap.set(normalized, node)
    })
  }
}

function rebuildCategoryMaps() {
  categoryLeafMap.clear()
  indexCategoryLeaves(categoryOptions.value)
  buildCategoryLookupMap()
}

function buildRegionLookupMap() {
  regionProvinceNameMap.clear()
  regionCityNameMap.clear()
  regionDistrictNameMap.clear()

  ;(regionOptions.value || []).forEach((province) => {
    regionProvinceNameMap.set(normalizeLookupKey(province.label), Number(province.value))
    ;(province.children || []).forEach((city) => {
      regionCityNameMap.set(normalizeLookupKey(city.label), Number(city.value))
      ;(city.children || []).forEach((district) => {
        regionDistrictNameMap.set(normalizeLookupKey(district.label), Number(district.value))
      })
    })
  })
}

rebuildCategoryMaps()
buildRegionLookupMap()

async function loadRegionOptionsFromApi() {
  if (regionApiLoaded.value) return

  try {
    const response = await fetch(`${API_BASE}/api/regions/tree`)
    const data = await response.json()

    if (!response.ok || !data?.success || !Array.isArray(data?.data) || data.data.length === 0) {
      throw new Error(data?.detail || `HTTP ${response.status}`)
    }

    regionOptions.value = data.data
    regionDataSource.value = 'api'
    regionApiLoaded.value = true
    buildRegionLookupMap()
  } catch (error) {
    regionOptions.value = [...fallbackRegionOptions]
    regionDataSource.value = 'fallback'
    buildRegionLookupMap()
    ElMessage.warning(`发货地区数据加载失败，已切换为默认地区：${error?.message || '未知错误'}`)
  }
}

async function loadCategoryOptionsFromApi(itemBizType, spBizType, { force = false } = {}) {
  const itemBiz = Number(itemBizType)
  const spBiz = Number(spBizType)
  const key = `${itemBiz}|${spBiz}`

  if (!Number.isInteger(itemBiz) || !Number.isInteger(spBiz)) {
    categoryOptions.value = [...fallbackCategoryOptions]
    categoryDataSource.value = 'fallback'
    rebuildCategoryMaps()
    return
  }

  if (!store.configReady.value) {
    categoryOptions.value = [...fallbackCategoryOptions]
    categoryDataSource.value = 'fallback'
    rebuildCategoryMaps()
    return
  }

  if (!force && categoryLoadedKeySet.has(key) && categoryDataSource.value === 'api') {
    return
  }

  categoryLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/api/products/category/options?item_biz_type=${itemBiz}&sp_biz_type=${spBiz}`)
    const data = await response.json()

    if (!response.ok || !data?.success || !Array.isArray(data?.data) || data.data.length === 0) {
      throw new Error(data?.detail || `HTTP ${response.status}`)
    }

    categoryOptions.value = data.data
    categoryDataSource.value = 'api'
    categoryLoadedKeySet.add(key)
    rebuildCategoryMaps()
  } catch (error) {
    categoryOptions.value = [...fallbackCategoryOptions]
    categoryDataSource.value = 'fallback'
    rebuildCategoryMaps()
    ElMessage.warning(`商品类目加载失败，已切换为常用类目：${error?.message || '未知错误'}`)
  } finally {
    categoryLoading.value = false
  }
}

const singleForm = reactive({
  item_biz_type: 2,
  sp_biz_type: 1,
  categoryValue: '',
  channelCatIdManual: '',
  priceYuan: '0.01',
  expressFeeYuan: '0.00',
  stock: 1,
  user_name: '',
  regionCodes: [],
  title: '',
  content: '',
  images: [],
})

const newImageUrl = ref('')
const dragImageIndex = ref(-1)

const batchState = reactive({
  templateDownloaded: false,
  fileName: '',
  headers: [],
  rows: [],
  parseError: '',
  submitting: false,
  progressProcessed: 0,
  progressTotal: 0,
  results: [],
})

const singleImageUrls = computed(() => singleForm.images.map((item) => item.url).filter(Boolean))

const singleChecklist = computed(() => {
  const priceInCent = yuanToCent(singleForm.priceYuan)
  const feeInCent = yuanToCent(singleForm.expressFeeYuan)
  return [
    {
      key: 'single-basic',
      label: '基础信息',
      ok: Boolean(singleForm.item_biz_type && singleForm.sp_biz_type && (singleForm.channelCatIdManual || singleForm.categoryValue) && singleForm.stock >= 1),
    },
    {
      key: 'single-money',
      label: '价格与库存',
      ok: Number.isInteger(priceInCent) && priceInCent >= 1 && Number.isInteger(feeInCent) && feeInCent >= 0,
    },
    {
      key: 'single-delivery',
      label: '发货与文案',
      ok: Boolean(singleForm.user_name && singleForm.regionCodes.length === 3 && singleForm.title && singleForm.content),
    },
    {
      key: 'single-image',
      label: '商品图片',
      ok: singleForm.images.length >= 1,
    },
  ]
})

const batchChecklist = computed(() => [
  {
    key: 'batch-template',
    label: '模板下载',
    ok: batchState.templateDownloaded,
  },
  {
    key: 'batch-upload',
    label: '文件上传',
    ok: Boolean(batchState.fileName),
  },
  {
    key: 'batch-preview',
    label: '内容预览',
    ok: batchState.rows.length > 0,
  },
])

const activeChecklist = computed(() => (publishMode.value === 'single' ? singleChecklist.value : batchChecklist.value))

const batchColumns = computed(() => batchState.headers.map((header, idx) => ({ prop: `col_${idx}`, label: header || `列${idx + 1}` })))

const batchSummary = computed(() => {
  if (!batchState.results.length) return null
  const success = batchState.results.filter((item) => item.success).length
  const failed = batchState.results.length - success
  return {
    total: batchState.results.length,
    success,
    failed,
  }
})

const batchProgressPercent = computed(() => {
  if (!batchState.progressTotal) return 0
  return Math.min(100, Math.round((batchState.progressProcessed / batchState.progressTotal) * 100))
})

const batchProgressStatus = computed(() => {
  if (batchState.submitting) return undefined
  if (!batchSummary.value) return undefined
  return batchSummary.value.failed > 0 ? 'warning' : 'success'
})

const ITEM_BIZ_TYPE_SET = new Set((store.ITEM_BIZ_TYPE_OPTIONS || []).map((item) => Number(item.value)))
const SP_BIZ_TYPE_SET = new Set((store.SP_BIZ_TYPE_OPTIONS || []).map((item) => Number(item.value)))

function centToYuanText(value) {
  const cent = Number(value)
  if (!Number.isFinite(cent)) return '0.00'
  return (cent / 100).toFixed(2)
}

function yuanToCent(value) {
  const normalized = String(value || '').replace(/[^\d.\-]/g, '').trim()
  if (!normalized) return NaN
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return NaN
  return Math.round(parsed * 100)
}

function normalizeMoneyField(field) {
  const cent = yuanToCent(singleForm[field])
  if (!Number.isInteger(cent)) return
  singleForm[field] = (cent / 100).toFixed(2)
}

function normalizeCategoryValueFromStore(channelCatId) {
  if (!channelCatId) return ''
  for (const [value, node] of categoryLeafMap.entries()) {
    if (node.categoryCode === channelCatId || node.categoryId === channelCatId || value === channelCatId) {
      return value
    }
  }
  return ''
}

function syncSingleFormFromStore() {
  const source = store.createForm
  const shop = source.publish_shop || {}

  singleForm.item_biz_type = Number(source.item_biz_type) || 2
  singleForm.sp_biz_type = Number(source.sp_biz_type) || 1

  const storeChannelCatId = String(source.channel_cat_id || '').trim()
  const normalizedCategoryValue = normalizeCategoryValueFromStore(storeChannelCatId)
  singleForm.categoryValue = normalizedCategoryValue
  singleForm.channelCatIdManual = normalizedCategoryValue ? '' : storeChannelCatId

  singleForm.priceYuan = centToYuanText(source.price)
  singleForm.expressFeeYuan = centToYuanText(source.express_fee)
  singleForm.stock = Number(source.stock) || 1
  singleForm.user_name = String(shop.user_name || store.defaultShopUserName.value || '')

  const regionCodes = [shop.province, shop.city, shop.district].map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
  singleForm.regionCodes = regionCodes.length === 3 ? regionCodes : []

  singleForm.title = String(shop.title || '')
  singleForm.content = String(shop.content || '')

  const images = String(shop.images_text || '')
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url, index) => ({ uid: `${Date.now()}-${index}`, url }))

  singleForm.images = images
  newImageUrl.value = ''
  dragImageIndex.value = -1
}

function syncCategoryInputWithCurrentOptions() {
  const selected = String(singleForm.categoryValue || '').trim()
  if (selected && !categoryLeafMap.has(selected)) {
    singleForm.categoryValue = ''
  }

  if (singleForm.categoryValue) {
    singleForm.channelCatIdManual = ''
    return
  }

  const manualValue = String(singleForm.channelCatIdManual || '').trim()
  if (!manualValue) return

  const mappedNode = categoryLookupMap.get(normalizeLookupKey(manualValue))
  if (!mappedNode) return

  singleForm.categoryValue = String(mappedNode.value || '')
  singleForm.channelCatIdManual = ''
}

async function fillSingleExample() {
  store.fillCreateExample()
  syncSingleFormFromStore()
  await loadCategoryOptionsFromApi(singleForm.item_biz_type, singleForm.sp_biz_type)
  syncCategoryInputWithCurrentOptions()
}

function resetSingleForm() {
  store.resetCreateForm()
  syncSingleFormFromStore()
}

function addImageByUrl() {
  const url = String(newImageUrl.value || '').trim()
  if (!url) {
    ElMessage.warning('请先输入图片 URL')
    return
  }
  if (singleForm.images.length >= 30) {
    ElMessage.warning('最多支持 30 张图片')
    return
  }
  if (singleForm.images.some((item) => item.url === url)) {
    ElMessage.warning('图片 URL 重复，请检查')
    return
  }

  singleForm.images.push({ uid: `${Date.now()}-${Math.random()}`, url })
  newImageUrl.value = ''
}

function removeImage(index) {
  singleForm.images.splice(index, 1)
}

function onImageDragStart(index) {
  dragImageIndex.value = index
}

function onImageDrop(targetIndex) {
  const sourceIndex = dragImageIndex.value
  dragImageIndex.value = -1
  if (sourceIndex < 0 || sourceIndex === targetIndex) return

  const [moved] = singleForm.images.splice(sourceIndex, 1)
  singleForm.images.splice(targetIndex, 0, moved)
}

function validateSingleForm() {
  if (!singleForm.item_biz_type) return '请选择商品类型'
  if (!singleForm.sp_biz_type) return '请选择行业类目'
  if (!singleForm.channelCatIdManual && !singleForm.categoryValue) return '请选择商品类目或输入类目编码'

  const priceInCent = yuanToCent(singleForm.priceYuan)
  if (!Number.isInteger(priceInCent) || priceInCent < 1) return '售价请输入不小于 0.01 的合法金额'

  const expressFeeInCent = yuanToCent(singleForm.expressFeeYuan)
  if (!Number.isInteger(expressFeeInCent) || expressFeeInCent < 0) return '运费请输入合法金额（可为 0）'

  if (!Number.isInteger(Number(singleForm.stock)) || Number(singleForm.stock) < 1) return '库存需为不小于 1 的整数'
  if (!singleForm.user_name) return '请选择发布店铺账号'
  if (!Array.isArray(singleForm.regionCodes) || singleForm.regionCodes.length !== 3) return '请选择完整发货地区（省/市/区）'
  if (!singleForm.title || singleForm.title.length > 60) return '商品标题长度需为 1~60 字'
  if (!singleForm.content || singleForm.content.length < 5 || singleForm.content.length > 5000) return '商品描述长度需为 5~5000 字'
  if (singleForm.images.length < 1 || singleForm.images.length > 30) return '请提供 1~30 张商品图片'
  if (new Set(singleForm.images.map((item) => item.url)).size !== singleForm.images.length) return '商品图片 URL 存在重复，请处理后再提交'

  return ''
}

function resolveCategoryCode(inputValue) {
  const raw = String(inputValue || '').trim()
  if (!raw) return ''

  const directNode = categoryLeafMap.get(raw)
  if (directNode) {
    return String(directNode.categoryCode || directNode.categoryId || raw)
  }

  const mappedNode = categoryLookupMap.get(normalizeLookupKey(raw))
  if (mappedNode) {
    return String(mappedNode.categoryCode || mappedNode.categoryId || raw)
  }

  return raw
}

function normalizeImageUrls(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item || '').trim()).filter(Boolean)
  }

  const text = String(rawValue || '').trim()
  if (!text) return []

  const splitByPipe = text.includes('|') ? text.split('|') : text.split(/[\n,;]/g)
  return splitByPipe.map((item) => item.trim()).filter(Boolean)
}

function normalizeOptionalInteger(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isInteger(num) ? num : null
}

function normalizeOptionalNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isInteger(num) ? num : fallback
}

function openTemplateEditor(template) {
  const templateData = template?.template_data || {}
  const publishShop = templateData?.publish_shop || {}

  editingTemplateId.value = String(template?.template_id || '').trim()
  Object.assign(templateEditorForm, {
    name: String(template?.name || '').trim(),
    description: String(template?.description || '').trim(),
    source: String(template?.source || 'manual'),
    item_biz_type: Number(templateData?.item_biz_type) || 2,
    sp_biz_type: Number(templateData?.sp_biz_type) || 1,
    channel_cat_id: String(templateData?.channel_cat_id || '').trim(),
    price: normalizeOptionalNumber(templateData?.price, 1),
    express_fee: normalizeOptionalNumber(templateData?.express_fee, 0),
    stock: normalizeOptionalNumber(templateData?.stock, 1),
    user_name: String(publishShop?.user_name || '').trim(),
    province: normalizeOptionalInteger(publishShop?.province),
    city: normalizeOptionalInteger(publishShop?.city),
    district: normalizeOptionalInteger(publishShop?.district),
    title: String(publishShop?.title || '').trim(),
    content: String(publishShop?.content || '').trim(),
    images_text: normalizeImageUrls(publishShop?.images || []).join('\n'),
  })

  templateEditorVisible.value = true
}

function validateTemplateEditor() {
  if (!editingTemplateId.value) return '模板 ID 缺失，请关闭后重试'
  if (!templateEditorForm.name || templateEditorForm.name.length > 80) return '模板名称长度需为 1~80 字'

  if (!ITEM_BIZ_TYPE_SET.has(Number(templateEditorForm.item_biz_type))) return '请选择有效的商品类型'
  if (!SP_BIZ_TYPE_SET.has(Number(templateEditorForm.sp_biz_type))) return '请选择有效的行业类目'

  const price = Number(templateEditorForm.price)
  if (!Number.isInteger(price) || price < 1) return '售价需为不小于 1 的整数（单位：分）'

  const expressFee = Number(templateEditorForm.express_fee)
  if (!Number.isInteger(expressFee) || expressFee < 0) return '运费需为不小于 0 的整数（单位：分）'

  const stock = Number(templateEditorForm.stock)
  if (!Number.isInteger(stock) || stock < 1) return '库存需为不小于 1 的整数'

  if (!templateEditorForm.title || templateEditorForm.title.length > 60) return '商品标题长度需为 1~60 字'
  if (!templateEditorForm.content || templateEditorForm.content.length < 5 || templateEditorForm.content.length > 5000) {
    return '商品描述长度需为 5~5000 字'
  }

  const images = normalizeImageUrls(templateEditorForm.images_text)
  if (images.length > 30) return '商品图片最多支持 30 张'

  return ''
}

function buildTemplateEditorPayload() {
  const images = normalizeImageUrls(templateEditorForm.images_text)

  return {
    name: String(templateEditorForm.name || '').trim(),
    description: String(templateEditorForm.description || '').trim(),
    source: String(templateEditorForm.source || 'manual'),
    template_data: {
      item_biz_type: Number(templateEditorForm.item_biz_type),
      sp_biz_type: Number(templateEditorForm.sp_biz_type),
      channel_cat_id: String(templateEditorForm.channel_cat_id || '').trim(),
      price: Number(templateEditorForm.price),
      express_fee: Number(templateEditorForm.express_fee),
      stock: Number(templateEditorForm.stock),
      publish_shop: {
        user_name: String(templateEditorForm.user_name || '').trim(),
        province: normalizeOptionalInteger(templateEditorForm.province),
        city: normalizeOptionalInteger(templateEditorForm.city),
        district: normalizeOptionalInteger(templateEditorForm.district),
        title: String(templateEditorForm.title || '').trim(),
        content: String(templateEditorForm.content || '').trim(),
        images,
      },
    },
  }
}

async function saveTemplateEditor() {
  const validationError = validateTemplateEditor()
  if (validationError) {
    ElMessage.warning(validationError)
    return
  }

  const payload = buildTemplateEditorPayload()
  const updated = await store.updateTemplate(editingTemplateId.value, payload)
  if (updated) {
    templateEditorVisible.value = false
    resetTemplateEditorForm()
  }
}

async function setTemplateAsExample(template) {
  await store.setTemplateAsExample(template)
}

function buildCreatePayloadFromUiFields(fields) {
  const itemBizType = Number(fields.item_biz_type)
  const spBizType = Number(fields.sp_biz_type)
  const stock = Number(fields.stock)

  const priceInCent = yuanToCent(fields.priceYuan)
  const expressFeeInCent = yuanToCent(fields.expressFeeYuan)

  const categoryCode = resolveCategoryCode(fields.categoryRaw)

  const [provinceCode, cityCode, districtCode] = (fields.regionCodes || []).map((item) => Number(item))
  const imageUrls = normalizeImageUrls(fields.images)

  if (!Number.isInteger(itemBizType)) return { error: '商品类型必须是整数' }
  if (!Number.isInteger(spBizType)) return { error: '行业类目必须是整数' }
  if (!categoryCode) return { error: '类目不能为空' }
  if (!Number.isInteger(priceInCent) || priceInCent < 1) return { error: '售价必须是不小于 0.01 的金额' }
  if (!Number.isInteger(expressFeeInCent) || expressFeeInCent < 0) return { error: '运费必须是合法金额（可为 0）' }
  if (!Number.isInteger(stock) || stock < 1) return { error: '库存需为不小于 1 的整数' }
  if (!String(fields.user_name || '').trim()) return { error: '店铺账号不能为空' }

  if (![provinceCode, cityCode, districtCode].every((code) => Number.isInteger(code) && code > 0)) {
    return { error: '请完整选择发货地区（省 / 市 / 区）' }
  }

  const title = String(fields.title || '').trim()
  const content = String(fields.content || '').trim()
  if (!title || title.length > 60) return { error: '商品标题长度需为 1~60 字' }
  if (!content || content.length < 5 || content.length > 5000) return { error: '商品描述长度需为 5~5000 字' }

  if (imageUrls.length < 1 || imageUrls.length > 30) return { error: '图片数量需为 1~30 张' }
  if (new Set(imageUrls).size !== imageUrls.length) return { error: '图片链接存在重复，请检查' }

  return {
    payload: {
      item_biz_type: itemBizType,
      sp_biz_type: spBizType,
      channel_cat_id: String(categoryCode),
      price: priceInCent,
      express_fee: expressFeeInCent,
      stock,
      publish_shop: [
        {
          user_name: String(fields.user_name || '').trim(),
          province: provinceCode,
          city: cityCode,
          district: districtCode,
          title,
          content,
          images: imageUrls,
        },
      ],
    },
    imageUrls,
  }
}

async function handleSingleSubmit() {
  const validationError = validateSingleForm()
  if (validationError) {
    store.createProductError.value = validationError
    ElMessage.error(validationError)
    return
  }

  const result = buildCreatePayloadFromUiFields({
    item_biz_type: singleForm.item_biz_type,
    sp_biz_type: singleForm.sp_biz_type,
    categoryRaw: singleForm.channelCatIdManual || singleForm.categoryValue,
    priceYuan: singleForm.priceYuan,
    expressFeeYuan: singleForm.expressFeeYuan,
    stock: singleForm.stock,
    user_name: singleForm.user_name,
    regionCodes: singleForm.regionCodes,
    title: singleForm.title,
    content: singleForm.content,
    images: singleForm.images.map((item) => item.url),
  })

  if (result.error || !result.payload) {
    store.createProductError.value = result.error || '创建信息校验失败'
    ElMessage.error(store.createProductError.value)
    return
  }

  const payload = result.payload
  const publishShop = payload.publish_shop[0]

  store.createForm.item_biz_type = payload.item_biz_type
  store.createForm.sp_biz_type = payload.sp_biz_type
  store.createForm.channel_cat_id = payload.channel_cat_id
  store.createForm.price = payload.price
  store.createForm.express_fee = payload.express_fee
  store.createForm.stock = payload.stock

  store.createForm.publish_shop.user_name = publishShop.user_name
  store.createForm.publish_shop.province = publishShop.province
  store.createForm.publish_shop.city = publishShop.city
  store.createForm.publish_shop.district = publishShop.district
  store.createForm.publish_shop.title = publishShop.title
  store.createForm.publish_shop.content = publishShop.content
  store.createForm.publish_shop.images_text = (result.imageUrls || []).join('\n')

  store.createAdvancedEnabled.value = false
  await store.createProduct()
}

function downloadBatchTemplate() {
  const headers = ['标题', '描述', '售价(元)', '运费(元)', '库存', '店铺账号', '省代码', '市代码', '区代码', '发货地区', '类目编码', '商品类型', '行业类目', '图片链接(竖线分隔)']
  const rows = [
    ['95新 iPhone 13', '功能正常，配件齐全', '1999.00', '0.00', '3', store.defaultShopUserName.value || 'shop_account', '330000', '330100', '330106', '浙江省/杭州市/西湖区', 'e11455', '2', '1', 'https://a.jpg|https://b.jpg'],
    ['戴森吹风机', '成色很好，支持验货', '1299.00', '20.00', '2', store.defaultShopUserName.value || 'shop_account', '440000', '440300', '440305', '广东省/深圳市/南山区', 'e22102', '2', '1', 'https://c.jpg|https://d.jpg'],
  ]

  const csv = '\uFEFF' + [headers, ...rows].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'goofish-batch-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)

  batchState.templateDownloaded = true
}

function resetBatchState(keepTemplateDownloaded = false) {
  batchState.fileName = ''
  batchState.headers = []
  batchState.rows = []
  batchState.parseError = ''
  batchState.submitting = false
  batchState.progressProcessed = 0
  batchState.progressTotal = 0
  batchState.results = []
  if (!keepTemplateDownloaded) {
    batchState.templateDownloaded = false
  }
}

function parseCsvTextToMatrix(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  const input = `${text || ''}\n`
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(cell.trim())
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell.trim())
      if (row.some((item) => String(item || '').trim() !== '')) rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  return rows
}

function parseTableMatrix(matrixRows) {
  if (!Array.isArray(matrixRows) || matrixRows.length === 0) {
    return { headers: [], rows: [] }
  }

  const normalizedRows = matrixRows
    .map((line) => (Array.isArray(line) ? line.map((cell) => String(cell ?? '').trim()) : []))
    .filter((line) => line.some((cell) => cell !== ''))

  if (normalizedRows.length === 0) {
    return { headers: [], rows: [] }
  }

  const [headerRow, ...bodyRows] = normalizedRows
  const headers = headerRow.map((item, index) => item || `列${index + 1}`)

  const rows = bodyRows.map((line) => {
    const rowObject = {}
    headers.forEach((_, idx) => {
      rowObject[`col_${idx}`] = String(line[idx] || '').trim()
    })
    return rowObject
  })

  return { headers, rows }
}

function buildHeaderIndexMap(headers) {
  const normalizedHeaderIndex = new Map()
  ;(headers || []).forEach((header, index) => {
    const key = normalizeLookupKey(header)
    if (key && !normalizedHeaderIndex.has(key)) normalizedHeaderIndex.set(key, index)
  })

  const result = {}
  Object.entries(BATCH_FIELD_ALIASES).forEach(([field, aliases]) => {
    for (const alias of aliases) {
      const idx = normalizedHeaderIndex.get(normalizeLookupKey(alias))
      if (Number.isInteger(idx)) {
        result[field] = idx
        break
      }
    }
  })
  return result
}

function getBatchCell(row, headerIndexMap, field) {
  const idx = headerIndexMap[field]
  if (!Number.isInteger(idx)) return ''
  return String(row?.[`col_${idx}`] || '').trim()
}

function resolveRegionCodePart(value, level) {
  const text = String(value || '').trim()
  if (!text) return null

  if (/^\d+$/.test(text)) {
    return Number(text)
  }

  const key = normalizeLookupKey(text)
  if (level === 'province') return regionProvinceNameMap.get(key) ?? null
  if (level === 'city') return regionCityNameMap.get(key) ?? null
  return regionDistrictNameMap.get(key) ?? null
}

function resolveRegionCodesFromRow(row, headerIndexMap) {
  let province = resolveRegionCodePart(getBatchCell(row, headerIndexMap, 'province'), 'province')
  let city = resolveRegionCodePart(getBatchCell(row, headerIndexMap, 'city'), 'city')
  let district = resolveRegionCodePart(getBatchCell(row, headerIndexMap, 'district'), 'district')

  const regionText = getBatchCell(row, headerIndexMap, 'region')
  if (regionText && (!province || !city || !district)) {
    const parts = regionText
      .split(/[\/|,>]/g)
      .map((item) => item.trim())
      .filter(Boolean)

    if (parts.length >= 3) {
      province = province || resolveRegionCodePart(parts[0], 'province')
      city = city || resolveRegionCodePart(parts[1], 'city')
      district = district || resolveRegionCodePart(parts[2], 'district')
    }
  }

  return [province, city, district]
}

function resolveItemBizType(rawValue) {
  const normalized = Number(String(rawValue || '').trim() || 2)
  return ITEM_BIZ_TYPE_SET.has(normalized) ? normalized : NaN
}

function resolveSpBizType(rawValue) {
  const normalized = Number(String(rawValue || '').trim() || 1)
  return SP_BIZ_TYPE_SET.has(normalized) ? normalized : NaN
}

function buildBatchRowPayload(row, rowIndex, headerIndexMap) {
  const rowNo = rowIndex + 2
  const title = getBatchCell(row, headerIndexMap, 'title')
  const content = getBatchCell(row, headerIndexMap, 'content')
  const userName = getBatchCell(row, headerIndexMap, 'user_name') || String(store.defaultShopUserName.value || '')
  const categoryCode = resolveCategoryCode(getBatchCell(row, headerIndexMap, 'channel_cat_id'))
  const itemBizType = resolveItemBizType(getBatchCell(row, headerIndexMap, 'item_biz_type'))
  const spBizType = resolveSpBizType(getBatchCell(row, headerIndexMap, 'sp_biz_type'))
  const images = normalizeImageUrls(getBatchCell(row, headerIndexMap, 'images'))
  const [province, city, district] = resolveRegionCodesFromRow(row, headerIndexMap)

  const basePayload = buildCreatePayloadFromUiFields({
    item_biz_type: itemBizType,
    sp_biz_type: spBizType,
    categoryRaw: categoryCode,
    priceYuan: getBatchCell(row, headerIndexMap, 'price'),
    expressFeeYuan: getBatchCell(row, headerIndexMap, 'express_fee') || '0',
    stock: getBatchCell(row, headerIndexMap, 'stock'),
    user_name: userName,
    regionCodes: [province, city, district],
    title,
    content,
    images,
  })

  if (basePayload.error || !basePayload.payload) {
    return {
      success: false,
      row_no: rowNo,
      title: title || '(无标题)',
      message: basePayload.error || '字段填写不完整或格式不正确',
      request_payload: {},
      response: {},
    }
  }

  return {
    success: true,
    row_no: rowNo,
    title: title || '(无标题)',
    payload: basePayload.payload,
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

async function parseExcelToTable(file) {
  const XLSX = await loadXlsxModule()
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames?.[0]
  if (!firstSheetName) return { headers: [], rows: [] }

  const worksheet = workbook.Sheets[firstSheetName]
  const matrixRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  })

  return parseTableMatrix(matrixRows)
}

async function handleBatchFileChange(uploadFile) {
  const raw = uploadFile?.raw
  if (!raw) return

  batchState.parseError = ''
  batchState.fileName = uploadFile.name || raw.name || '未命名文件'
  batchState.rows = []
  batchState.headers = []
  batchState.results = []
  batchState.progressProcessed = 0
  batchState.progressTotal = 0

  try {
    const lowerName = String(batchState.fileName).toLowerCase()
    const parsed = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
      ? await parseExcelToTable(raw)
      : parseTableMatrix(parseCsvTextToMatrix(await readFileAsText(raw)))

    batchState.headers = parsed.headers
    batchState.rows = parsed.rows

    if (!batchState.headers.length) {
      batchState.parseError = '文件内容为空或格式不正确，请检查后重试'
    }
  } catch (error) {
    batchState.parseError = error?.message || '解析失败，请检查文件格式'
    batchState.headers = []
    batchState.rows = []
  }
}

function normalizeBatchResultItem(resultItem, fallback) {
  const success = Boolean(resultItem?.success)
  const message = success
    ? String(resultItem?.message || '创建成功')
    : String(resultItem?.error || resultItem?.detail || '创建失败')

  return {
    success,
    row_no: fallback.row_no,
    title: fallback.title,
    message,
    request_payload: fallback.payload || {},
    response: resultItem || {},
  }
}

async function handleBatchSubmit() {
  if (batchState.submitting) return

  if (!store.configReady.value) {
    ElMessage.warning('请先完成店铺授权（AppKey + AppSecret）')
    return
  }

  if (!batchState.rows.length) {
    ElMessage.warning('请先上传并解析文件')
    return
  }

  batchState.submitting = true
  batchState.results = []
  batchState.progressTotal = batchState.rows.length
  batchState.progressProcessed = 0

  try {
    const headerIndexMap = buildHeaderIndexMap(batchState.headers)
    const preparedRows = batchState.rows.map((row, idx) => buildBatchRowPayload(row, idx, headerIndexMap))

    const validRows = []
    preparedRows.forEach((rowItem) => {
      if (!rowItem.success) {
        batchState.results.push(rowItem)
        batchState.progressProcessed += 1
        return
      }
      validRows.push(rowItem)
    })

    const chunkSize = 5

    for (let start = 0; start < validRows.length; start += chunkSize) {
      const chunk = validRows.slice(start, start + chunkSize)

      try {
        const response = await fetch(`${API_BASE}/api/products/create/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: chunk.map((item) => item.payload),
            continue_on_error: true,
            source: 'product_library_drawer',
          }),
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
          const message = data?.detail || `提交失败（HTTP ${response.status}）`
          chunk.forEach((item) => {
            batchState.results.push({
              success: false,
              row_no: item.row_no,
              title: item.title,
              message,
              request_payload: item.payload,
              response: data || {},
            })
          })
        } else {
          const resultItems = Array.isArray(data.results) ? data.results : []
          chunk.forEach((item, idx) => {
            const resultItem = resultItems.find((entry) => Number(entry?.index) === idx) || resultItems[idx] || {}
            batchState.results.push(normalizeBatchResultItem(resultItem, item))
          })
        }
      } catch (error) {
        const message = error?.message || '批量创建请求失败'
        chunk.forEach((item) => {
          batchState.results.push({
            success: false,
            row_no: item.row_no,
            title: item.title,
            message,
            request_payload: item.payload,
            response: {},
          })
        })
      }

      batchState.progressProcessed += chunk.length
    }
  } finally {
    batchState.submitting = false
  }

  if (!batchSummary.value) {
    ElMessage.warning('未生成可提交数据，请检查模板列与行内容')
    return
  }

  if (batchSummary.value.failed > 0) {
    ElMessage.warning(`批量创建完成：成功 ${batchSummary.value.success} 条，失败 ${batchSummary.value.failed} 条`)
  } else {
    ElMessage.success(`批量创建完成：成功 ${batchSummary.value.success} 条`)
  }
}

async function openCreateDrawer() {
  createDrawerVisible.value = true
  publishMode.value = 'single'
  syncSingleFormFromStore()
  await loadRegionOptionsFromApi()
  await loadCategoryOptionsFromApi(singleForm.item_biz_type, singleForm.sp_biz_type)
  syncCategoryInputWithCurrentOptions()

  if (!store.hasBoundShops.value && store.configReady.value) {
    await store.queryShops(false, true)
  }
}

function createTemplateFromProduct(row) {
  store.createTemplateFromProductRow(row)
}

async function applyTemplateAndOpen(template) {
  store.applyTemplate(template)
  createDrawerVisible.value = true
  publishMode.value = 'single'
  syncSingleFormFromStore()
  await loadRegionOptionsFromApi()
  await loadCategoryOptionsFromApi(singleForm.item_biz_type, singleForm.sp_biz_type)
  syncCategoryInputWithCurrentOptions()
}

function handleLibraryTabChange(tab) {
  if (tab === 'templates' && store.templates.value.length === 0) {
    store.loadTemplates(true)
  }
  if (tab === 'products' && store.products.value.length === 0 && store.configReady.value) {
    store.queryProducts(false)
  }
}

watch(publishMode, (mode) => {
  if (mode === 'batch') {
    loadXlsxModule().catch(() => {})
  }
})

watch(
  () => [singleForm.item_biz_type, singleForm.sp_biz_type],
  async ([itemBizType, spBizType], [prevItemBizType, prevSpBizType]) => {
    if (!createDrawerVisible.value) return

    const changed = Number(itemBizType) !== Number(prevItemBizType) || Number(spBizType) !== Number(prevSpBizType)
    if (!changed) return

    await loadCategoryOptionsFromApi(itemBizType, spBizType, { force: true })
    syncCategoryInputWithCurrentOptions()
  },
)

watch(createDrawerVisible, async (visible) => {
  if (!visible) return
  syncSingleFormFromStore()
  resetBatchState(true)
  await loadRegionOptionsFromApi()
  await loadCategoryOptionsFromApi(singleForm.item_biz_type, singleForm.sp_biz_type)
  syncCategoryInputWithCurrentOptions()
})

watch(templateEditorVisible, (visible) => {
  if (!visible) {
    resetTemplateEditorForm()
  }
})
</script>

<style scoped>
.publish-btn {
  --el-button-bg-color: #4f46e5;
  --el-button-border-color: #4f46e5;
}

:deep(.library-tabs .el-tabs__item.is-active) {
  color: #4f46e5;
}

:deep(.library-tabs .el-tabs__active-bar) {
  background-color: #4f46e5;
}

:deep(.publish-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 8px;
}

.create-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 16px;
  align-items: start;
}

.create-main {
  min-width: 0;
}

.publish-mode-tabs {
  margin-bottom: 12px;
}

:deep(.publish-mode-tabs .el-tabs__item) {
  font-weight: 600;
}

.single-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.template-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.template-op-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
}

.single-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 20px;
}

.form-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.form-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.form-grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.span-2 {
  grid-column: span 2;
}

.label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.label-tip-icon {
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
}

.image-input-row {
  margin-bottom: 10px;
}

.image-wall {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.image-wall-item {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #f8fafc;
  overflow: hidden;
  cursor: move;
}

.image-thumb {
  width: 100%;
  height: 98px;
  background: #f1f5f9;
}

.image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 12px;
  color: #475569;
}

.image-wall-empty {
  grid-column: 1 / -1;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  text-align: center;
  padding: 16px 10px;
}

.batch-upload {
  border-radius: 12px;
}

:deep(.batch-upload .el-upload-dragger) {
  width: 100%;
}

.batch-preview {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.batch-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #334155;
}

.batch-progress {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;
}

.batch-progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #475569;
}

.batch-result-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.batch-result-expand {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
}

.batch-result-expand pre {
  margin: 6px 0 10px;
  max-height: 180px;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
}

.drawer-check-card {
  border: 1px solid #e2e8f0;
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

.drawer-check-list {
  list-style: none;
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.drawer-check-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px;
}

.drawer-check-item .item-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.drawer-check-item .item-status {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}


.drawer-check-item.is-ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.drawer-check-item.is-ok .item-title,
.drawer-check-item.is-ok .item-status {
  color: #166534;
}

.drawer-check-item.is-pending {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

@media (max-width: 1280px) {
  .create-workspace {
    grid-template-columns: 1fr;
  }

  .drawer-check-card {
    position: static;
  }
}

@media (max-width: 960px) {
  .form-grid-two {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}
</style>
