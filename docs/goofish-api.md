# 闲管家开放平台接口文档（汇总版）

> 本文档为进销存系统的**唯一官方接口事实来源（Single Source of Truth）**，所有对接均严格以本文档中列出的路径、请求方法、参数类型与签名规范为准，不臆造未收录接口或字段。

## 1. 接入说明与签名规范

- **生产环境 Base URL**：`https://open.goofish.pro`
- **请求方式**：统一 `POST`，`Content-Type: application/json; charset=utf-8`
- **强校验说明**：闲管家所有参数均为强校验，必须严格按照文档定义的字段类型传参与解析返回。
- **公共 Query 参数**：
  - `appid`（必填）：开放平台提供的应用 Key（`appKey`）
  - `timestamp`（选填/建议必传）：当前时间戳（单位：**秒**，5 分钟内有效）
  - `seller_id`（仅商务对接传入）：商家 ID（自研 / 第三方 ERP 对接忽略即可）
  - `sign`（必填）：签名 MD5 值
- **MD5 签名拼接规则**：
  1. 对 POST 请求的 JSON Body 字符串做 MD5：`bodyMd5 = md5(bodyString)`（无参数时 `bodyString` 为 `"{}"` 或 `""`，且请求体需传入相同值；注意 JSON 序列化不可有多余空格，如 Python `json.dumps(data, separators=(",", ":"))`）。
  2. **自研模式签名**：`sign = md5(f"{appKey},{bodyMd5},{timestamp},{appSecret}")`
  3. **商务对接模式签名**：`sign = md5(f"{appKey},{bodyMd5},{timestamp},{sellerId},{appSecret}")`
- **本地附件**：
  - 省市区数据：[闲管家省市区.sql](./attachments/闲管家省市区.sql) / [闲管家省市区.xlsx](./attachments/闲管家省市区.xlsx)
  - 商品异常状态码：[商品异常状态码.sql](./attachments/商品异常状态码.sql) / [商品异常状态码.xlsx](./attachments/商品异常状态码.xlsx)

---

## 2. 接口总览

### 2.1 已收录接口（38 个，含 3 个推送回调）

| 分类 | 接口名称 | Method | Path | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| 用户 | [查询闲鱼店铺](#查询闲鱼店铺) | POST | `/api/open/user/authorize/list` | ✅ 已收录 |
| 商品 | [查询商品类目](#查询商品类目) | POST | `/api/open/product/category/list` | ✅ 已收录 |
| 商品 | [查询商品属性](#查询商品属性) | POST | `/api/open/product/pv/list` | ✅ 已收录 |
| 商品 | [查询商品规格](#查询商品规格) | POST | `/api/open/product/sku/list` | ✅ 已收录 |
| 商品 | [查询商品列表](#查询商品列表) | POST | `/api/open/product/list` | ✅ 已收录 |
| 商品 | [查询商品详情](#查询商品详情) | POST | `/api/open/product/detail` | ✅ 已收录 |
| 商品 | [创建商品（单个）](#创建商品单个) | POST | `/api/open/product/create` | ✅ 已收录 |
| 商品 | [创建商品（批量）](#创建商品批量) | POST | `/api/open/product/batchCreate` | ✅ 已收录 |
| 商品 | [上架商品](#上架商品) | POST | `/api/open/product/publish` | ✅ 已收录 |
| 商品 | [下架商品](#下架商品) | POST | `/api/open/product/downShelf` | ✅ 已收录 |
| 商品 | [编辑商品](#编辑商品) | POST | `/api/open/product/edit` | ✅ 已收录 |
| 商品 | [编辑库存](#编辑库存) | POST | `/api/open/product/edit/stock` | ✅ 已收录 |
| 商品 | [删除商品](#删除商品) | POST | `/api/open/product/delete` | ✅ 已收录 |
| 订单 | [查询订单列表](#查询订单列表) | POST | `/api/open/order/list` | ✅ 已收录 |
| 订单 | [查询订单详情](#查询订单详情) | POST | `/api/open/order/detail` | ✅ 已收录 |
| 订单 | [订单修改价格](#订单修改价格) | POST | `/api/open/order/modify/price` | ✅ 已收录 |
| 订单 | [无需物流发货](#无需物流发货) | POST | `/api/open/trade/logistics/dummy/send` | ✅ 已收录 |
| 售后 | [售后订单列表](#售后订单列表) | POST | `/api/open/trade/refund/list` | ✅ 已收录 |
| 售后 | [售后订单详情](#售后订单详情) | POST | `/api/open/trade/refund/detail` | ✅ 已收录 |
| 售后 | [售后订单同意退款](#售后订单同意退款) | POST | `/api/open/trade/refund/operate/agree` | ✅ 已收录 |
| 推送 | [商品回调通知](#商品回调通知) / [商品推送通知](#商品推送通知) / [订单推送通知](#订单推送通知) | POST | 商户自定义回调地址 | ✅ 已收录 |
| 卡密 | [卡密分类列表](#卡密分类列表) | POST | `/api/open/kami/category/list` | ✅ 已收录 |
| 卡密 | [卡密分类创建](#卡密分类创建) | POST | `/api/open/kami/category/create` | ✅ 已收录 |
| 卡密 | [卡密分类编辑](#卡密分类编辑) | POST | `/api/open/kami/category/edit` | ✅ 已收录 |
| 卡密 | [卡密分类删除](#卡密分类删除) | POST | `/api/open/kami/category/delete` | ✅ 已收录 |
| 卡密 | [发卡组合列表](#发卡组合列表) | POST | `/api/open/kami/group/list` | ✅ 已收录 |
| 卡密 | [发卡组合创建](#发卡组合创建) | POST | `/api/open/kami/group/create` | ✅ 已收录 |
| 卡密 | [发卡组合修改](#发卡组合修改) | POST | `/api/open/kami/group/edit` | ✅ 已收录 |
| 卡密 | [发卡组合更新状态](#发卡组合更新状态) | POST | `/api/open/kami/group/update/status` | ✅ 已收录 |
| 卡密 | [发卡组合删除](#发卡组合删除) | POST | `/api/open/kami/group/delete` | ✅ 已收录 |
| 卡密 | [卡种列表](#卡种列表) | POST | `/api/open/kami/kind/list` | ✅ 已收录 |
| 卡密 | [卡种详情](#卡种详情) | POST | `/api/open/kami/kind/info` | ✅ 已收录 |
| 卡密 | [卡种创建](#卡种创建) | POST | `/api/open/kami/kind/create` | ✅ 已收录 |
| 卡密 | [卡种编辑](#卡种编辑) | POST | `/api/open/kami/kind/edit` | ✅ 已收录 |
| 卡密 | [卡种删除](#卡种删除) | POST | `/api/open/kami/kind/delete` | ✅ 已收录 |
| 卡密 | [卡种添加卡密库存](#卡种添加卡密库存) | POST | `/api/open/kami/storage/create` | ✅ 已收录 |

### 2.2 截图可见但暂缺文档的接口（按需补充）

| 分类 | 接口名称 | 说明 |
| :--- | :--- | :--- |
| 用户 | `查询商家地址` | 发货/退货地址选择时需补充 |
| 订单 | `订单物流发货` | 实物快递发货时需补充 |
| 订单 | `修改快递单号` | 修改已发货物流单号时需补充 |
| 订单 | `订单卡密列表` | 虚拟/卡密订单核销明细时需补充 |
| 订单 | `订单修改地址详情` / `订单修改地址审核` | 买家改址审核时需补充 |
| 售后 | `售后订单拒绝退款` | 拒绝买家退款申请时需补充 |

---

## 3. 接口详细规范（OpenAPI 3.0）


### 查询闲鱼店铺

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/user/authorize/list:
    post:
      summary: 查询闲鱼店铺
      deprecated: false
      description: ''
      tags:
        - 用户
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5S8SGYQTH59D8WHTSCB2CCH:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_0
                        type: object
                        properties:
                          list:
                            type: array
                            items:
                              type: object
                              properties:
                                authorize_id:
                                  type: integer
                                  title: 授权ID
                                  format: int64
                                  examples:
                                    - '2670420985643008'
                                authorize_expires:
                                  type: integer
                                  format: int32
                                  title: 授权过期时间
                                user_id:
                                  type: integer
                                  title: 闲鱼会员ID
                                  format: int64
                                  deprecated: true
                                  description: 将于2024年1月作废，请使用`user_identity`代替
                                user_identity:
                                  type: string
                                  title: 闲鱼会员ID
                                  examples:
                                    - H8Kx1jFX3Pxe5xYIBdZQOw==
                                  description: 闲鱼号唯一标识
                                user_name:
                                  type: string
                                  title: 闲鱼会员名
                                  examples:
                                    - tb924343042
                                user_nick:
                                  type: string
                                  title: 闲鱼号昵称
                                  examples:
                                    - 精灵的专属蓝兔子
                                shop_name:
                                  type: string
                                  title: 店铺名称
                                  examples:
                                    - 定时梵蒂冈天通苑
                                service_support:
                                  title: 已开通的服务项
                                  $ref: '#/components/schemas/service_support'
                                is_deposit_enough:
                                  type: boolean
                                  title: 是否已缴纳足够的服务保证金
                                  examples:
                                    - 'true'
                                is_pro:
                                  type: boolean
                                  title: 是否开通鱼小铺
                                  examples:
                                    - 'true'
                                is_valid:
                                  type: boolean
                                  title: 是否有效订购中
                                  examples:
                                    - 'true'
                                is_trial:
                                  type: boolean
                                  title: 是否免费试用版本
                                  description: 是否免费试用ERP专业版/铂金版，订购后则覆盖试用状态
                                valid_start_time:
                                  type: integer
                                  title: 订购有效开始时间
                                  format: int32
                                  examples:
                                    - '1689782400'
                                  deprecated: true
                                  description: 将于2024年1月作废
                                valid_end_time:
                                  type: integer
                                  format: int32
                                  title: 订购有效结束时间
                                  examples:
                                    - '1689782400'
                                  description: 同时订购ERP专业版和铂金版，则返回有效期最长的
                                item_biz_types:
                                  type: string
                                  title: 准入业务类型
                                  description: 格式：2,10,19
                              x-apifox-orders:
                                - authorize_id
                                - authorize_expires
                                - user_id
                                - user_identity
                                - user_name
                                - user_nick
                                - shop_name
                                - service_support
                                - is_deposit_enough
                                - is_pro
                                - is_valid
                                - is_trial
                                - valid_start_time
                                - valid_end_time
                                - item_biz_types
                              required:
                                - authorize_id
                                - authorize_expires
                                - user_identity
                                - user_name
                                - user_nick
                                - shop_name
                                - service_support
                                - is_deposit_enough
                                - is_pro
                                - is_valid
                                - is_trial
                                - valid_end_time
                                - item_biz_types
                              x-apifox-ignore-properties: []
                        x-apifox-orders:
                          - list
                        required:
                          - list
                        x-apifox-ignore-properties: []
                    required:
                      - data
                x-apifox-orders:
                  - 01H5S8SGYQTH59D8WHTSCB2CCH
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_0
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
              example:
                code: 0
                msg: OK
                data:
                  list:
                    - authorize_id: 435781348315205
                      authorize_expires: 1721663999
                      user_identity: HMrnin5gRbEhLTMwl9nx2A==
                      user_name: 哈哈哈哈晶易晶易烊千
                      user_nick: 西柚8919
                      shop_name: 哈哈哈哈晶易晶易烊千
                      is_pro: false
                      is_deposit_enough: true
                      service_support: ''
                      is_valid: true
                      is_trial: false
                      valid_end_time: 1721663999
                    - authorize_id: 2670420985643008
                      authorize_expires: 1721663999
                      user_identity: jSClWThxVFC2MrKbmvEJ6w==
                      user_name: tb924343042
                      user_nick: 精灵的专属蓝兔子
                      shop_name: 定时梵蒂冈天通苑
                      is_pro: true
                      is_deposit_enough: true
                      service_support: ''
                      is_valid: false
                      is_trial: false
                      valid_end_time: 0
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 用户
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586388-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接
        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询商品类目

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/category/list:
    post:
      summary: 查询商品类目
      deprecated: false
      description: ''
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item_biz_type:
                  $ref: '#/components/schemas/item_biz_type'
                  title: 商品类型
                sp_biz_type:
                  $ref: '#/components/schemas/sp_biz_type'
                  title: 行业类型
                flash_sale_type:
                  $ref: '#/components/schemas/flash_sale_type'
                  title: 闲鱼特卖类型
              x-apifox-orders:
                - item_biz_type
                - sp_biz_type
                - flash_sale_type
              required:
                - item_biz_type
              x-apifox-ignore-properties: []
            example:
              item_biz_type: 2
              sp_biz_type: 2
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5XS9ACRNBN7BWCB0HM2DSB9:
                    x-apifox-overrides:
                      data: &ref_0
                        type: object
                        properties:
                          list:
                            type: array
                            items:
                              type: object
                              properties:
                                sp_biz_type:
                                  title: 行业类型
                                  type: object
                                  properties: {}
                                sp_biz_name:
                                  type: string
                                  title: 行业名称
                                  examples:
                                    - 手机
                                channel_cat_id:
                                  type: string
                                  title: 渠道类目ID
                                  examples:
                                    - e11455b218c06e7ae10cfa39bf43dc0f
                                channel_cat_name:
                                  type: string
                                  title: 渠道类目名称
                                  examples:
                                    - 手机
                              x-apifox-orders:
                                - sp_biz_type
                                - sp_biz_name
                                - channel_cat_id
                                - channel_cat_name
                              required:
                                - sp_biz_type
                                - sp_biz_name
                                - channel_cat_id
                                - channel_cat_name
                              x-apifox-ignore-properties: []
                        x-apifox-orders:
                          - list
                        additionalProperties: false
                        required:
                          - list
                        x-apifox-ignore-properties: []
                    required:
                      - data
                    type: object
                    properties: {}
                x-apifox-orders:
                  - 01H5XS9ACRNBN7BWCB0HM2DSB9
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_0
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-97448687-run
components:
  schemas:
    flash_sale_type:
      type: integer
      title: 闲鱼特卖类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 99
        - 2601
        - 2602
        - 2603
        - 2604
      examples:
        - 1
      x-apifox-enum:
        - name: ''
          value: 1
          description: 临期
        - name: ''
          value: 2
          description: 孤品
        - name: ''
          value: 3
          description: 断码
        - name: ''
          value: 4
          description: 微瑕
        - name: ''
          value: 5
          description: 尾货
        - name: ''
          value: 6
          description: 官翻
        - name: ''
          value: 7
          description: 全新
        - name: ''
          value: 8
          description: 福袋
        - name: ''
          value: 99
          description: 其他
        - name: ''
          value: 2601
          description: 微瑕
        - name: ''
          value: 2602
          description: 临期
        - name: ''
          value: 2603
          description: 清仓
        - name: ''
          value: 2604
          description: 官翻
      description: |-
        枚举值：
        -仅闲鱼特卖类型可用-
        1 : 临期
        2 : 孤品
        3 : 断码
        4 : 微瑕
        5 : 尾货
        6 : 官翻
        7 : 全新
        8 : 福袋
        99 : 其他
        -仅闲鱼特卖类型可用-

        -仅品牌捡漏类型可用-
        2601 : 微瑕
        2602 : 临期
        2603 : 清仓
        2604 : 官翻
        -仅品牌捡漏类型可用-
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询商品属性

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/pv/list:
    post:
      summary: 查询商品属性
      deprecated: false
      description: ''
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item_biz_type:
                  title: 商品类型
                  $ref: '#/components/schemas/item_biz_type'
                sp_biz_type:
                  title: 行业类型
                  $ref: '#/components/schemas/sp_biz_type'
                channel_cat_id:
                  type: string
                  title: 渠道类目ID
                sub_property_id:
                  type: string
                  title: 属性值ID
              required:
                - item_biz_type
                - sp_biz_type
                - channel_cat_id
              x-apifox-orders:
                - item_biz_type
                - sp_biz_type
                - channel_cat_id
                - sub_property_id
              x-apifox-ignore-properties: []
            example:
              channel_cat_id: 4d8b31d719602249ac899d2620c5df2b
              sub_property_id: ''
              item_biz_type: 2
              sp_biz_type: 1
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    additionalProperties: false
                    format: int32
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data:
                    type: object
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          properties:
                            property_id:
                              type: string
                              title: 属性ID
                            property_name:
                              type: string
                              title: 属性名称
                            required:
                              type: integer
                              title: 属性是否必选
                            items:
                              type: array
                              items:
                                type: object
                                properties:
                                  value_id:
                                    type: string
                                    title: 属性值ID
                                  value_name:
                                    type: string
                                    title: 属性值名称
                                  sub_property_id:
                                    type: string
                                    title: 下级属性ID
                                    description: 表示存在下级属性，需二次查询
                                required:
                                  - value_id
                                  - value_name
                                x-apifox-orders:
                                  - value_id
                                  - value_name
                                  - sub_property_id
                                x-apifox-ignore-properties: []
                              title: 属性值组合
                          required:
                            - property_id
                            - property_name
                            - required
                            - items
                          x-apifox-orders:
                            - property_id
                            - property_name
                            - required
                            - items
                          x-apifox-ignore-properties: []
                    required:
                      - list
                    x-apifox-orders:
                      - list
                    x-apifox-ignore-properties: []
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties: []
              example:
                code: 0
                msg: OK
                data:
                  list:
                    - property_id: 83b8f62c43df34e6
                      property_name: 品牌
                      required: 0
                      items:
                        - value_id: dfecf6220abed89f7f53da204ec105a7
                          value_name: Acer/宏碁
                          sub_property_id: df02d9b4e2128c5d
                        - value_id: 11bfdd35bfca5e1e81bdf4eb1804dfbc
                          value_name: Aigo/爱国者
                          sub_property_id: a42768981845c997
                        - value_id: c726b29e3e52f2739519a80a38f4cc06
                          value_name: Amazon/亚马逊
                          sub_property_id: 35dc175588d2279f
                        - value_id: b632d2c0cb26d37b78bd56de687cb629
                          value_name: Apple/苹果
                          sub_property_id: e3c2363addc58529
                        - value_id: 84b75dba8936d81a4d949cd65751e520
                          value_name: Asus/华硕
                          sub_property_id: cc02e2659883417a
                        - value_id: 82faa27aeb221f82193b78e7ee2d92a0
                          value_name: BBK/步步高
                          sub_property_id: ca158a293da2fc30
                        - value_id: 787cb97a7ef00d095af478a084246ea5
                          value_name: BlackBerry/黑莓
                          sub_property_id: 9610742462f33c9d
                        - value_id: 99f022c6ae3a92138cc0fb9ebc8d28dc
                          value_name: BOOK
                          sub_property_id: 9c79bedc4a932fb3
                        - value_id: 051f34d83d701de02c37fdf872c3e6d0
                          value_name: Colorful/七彩虹
                          sub_property_id: 52d244891bfcdc0e
                        - value_id: bfa042e75b9c2ff9b4edf9a92c984d8f
                          value_name: Dell/戴尔
                          sub_property_id: 132de3d74acaf989
                        - value_id: 92b757ac78c77525df5b1ed9f176e619
                          value_name: e人e本
                          sub_property_id: ad5aa30a4511fbd287b43d68bdc44732
                        - value_id: a680093edb588235d0847dba6d306086
                          value_name: Fujitsu/富士通
                          sub_property_id: fbb698767087c9ea
                        - value_id: 3f9a810230b66c2db3707b99e407d014
                          value_name: Google/谷歌
                          sub_property_id: 42f32a30b68c7494
                        - value_id: 566152e6a9a2f707afa31dbaa61e424d
                          value_name: Haier/海尔
                          sub_property_id: 35f53acd9da12e53
                        - value_id: dc7f5f378ec0abd59c7337823c7b940a
                          value_name: Hasee/神舟
                          sub_property_id: 20105265bbd4ea5a
                        - value_id: 2755806f178e135e456edb81c21c30e0
                          value_name: honor/荣耀
                          sub_property_id: 715b060bd40d681bac899d2620c5df2b
                        - value_id: c82b80b1678467e1acd26d169480882b
                          value_name: HP/惠普
                          sub_property_id: 7ff9f29319e07287
                        - value_id: f8ab9c870624fa79a3e68dd11ff2ba6d
                          value_name: HTC
                          sub_property_id: 38a8e7df27e9e5d0
                        - value_id: 56e67229101cf5a2beacf09f07489637
                          value_name: Huawei/华为
                          sub_property_id: acf4aa236018fc61
                        - value_id: c405e3d38e828b1c6d9593888c95e5b9
                          value_name: ireader
                          sub_property_id: 70fe599db95c2b8ab108d382c4e6ea42
                        - value_id: a58169560d94e1a6886a69e7810c141a
                          value_name: Jumper/中柏
                          sub_property_id: 7dd7340c98497b94
                        - value_id: a16e6473bf37fcd875216a8355ab98e9
                          value_name: Lenovo/联想
                          sub_property_id: c3c0cadca6746430
                        - value_id: d853cc7deb765c382cedfe5355d118e1
                          value_name: LG
                          sub_property_id: 9a55d19ead0828f1
                        - value_id: c83858815f772a5d4f53078733e940be
                          value_name: Microsoft/微软
                          sub_property_id: 6f9dca5e595ff607
                        - value_id: 80a9a5ca98dfc4e3c274a36eef64ef89
                          value_name: MIUI/小米
                          sub_property_id: 1f40821fe5589e9f
                        - value_id: 9065fe738100e5f75335993190876c29
                          value_name: Motorola/摩托罗拉
                          sub_property_id: 862c196db30014df
                        - value_id: 465b965e69f7af300b9026a48e167ee5
                          value_name: NOAH/诺亚舟
                          sub_property_id: 247801656a5159e9
                        - value_id: 2d69a05b5e492ead3d7c373fab9f5bb0
                          value_name: Nokia/诺基亚
                          sub_property_id: d75ceeaf5d62df0f
                        - value_id: b970112c2517ea3c895850cbe86209c6
                          value_name: Onda/昂达
                          sub_property_id: cf2dcb3cc34fc6b1
                        - value_id: 9f965c9798fdb69025573775eacb5412
                          value_name: OPPO
                          sub_property_id: 91928508db6d6887
                        - value_id: e5d9ce3354637231f942985c768ae37f
                          value_name: Samsung/三星
                          sub_property_id: dd82cf463b25b384
                        - value_id: 730b8364e353a7b7544a464d449b4308
                          value_name: Sony/索尼
                          sub_property_id: 6e795f81eb0f81e5
                        - value_id: 295105078de52100078144d81537f7a8
                          value_name: Teclast/台电
                          sub_property_id: 45dca91ed6267d5c
                        - value_id: fbfbb02e6c1ef6cacfe26924b2c8da67
                          value_name: ThinkPad
                          sub_property_id: eab6bd3993924918a7f7e02f36b0b49a
                        - value_id: 74bb66d54c9de0db136d70e4f4d50c89
                          value_name: Toshiba/东芝
                          sub_property_id: 98a435d88c6a43f4
                        - value_id: 7c099cfaa847fe29c3f3dc8be523778e
                          value_name: vivo
                          sub_property_id: 5ca8028d7780062d
                        - value_id: 7197e29c7daa57c81aa89d0b73fef549
                          value_name: Voyo
                          sub_property_id: eb00833875f4849487b43d68bdc44732
                        - value_id: ec429f7cf6a6c409ce2d4c4be543e66e
                          value_name: xiaomi/小米
                          sub_property_id: 0397cad090cf640728d88a08a19453dc
                        - value_id: 1d000a470500c47cc9c1135a1df074b2
                          value_name: 其他品牌
                          sub_property_id: 600644bcf4bb2243
                        - value_id: 791963460f30af019481cc01a68e2c3a
                          value_name: 墨案
                          sub_property_id: 8059f93afa91200d825451b36a24ff45
                        - value_id: 522c35eb8fda46a4cc9a9eb8fb7a268f
                          value_name: 好记星
                          sub_property_id: f2095a418c688f47
                        - value_id: 4b3b622102528b5ed7598d1467dba93a
                          value_name: 小天才
                          sub_property_id: 296490beaf265581
                        - value_id: 624ae37a20b0936a6f167070d6a22283
                          value_name: 快易典
                          sub_property_id: 06cf35020bc35d2b
                        - value_id: 210be15d9d9b92d118ead9c53fc79e3d
                          value_name: 摆渡者
                          sub_property_id: 00f95952b3d1d85be10cfa39bf43dc0f
                        - value_id: 8d53dc243a1de874347b5616ef2538f5
                          value_name: 海信
                          sub_property_id: ad3f0e0606792fa387b43d68bdc44732
                        - value_id: 1299f86fdacfa81f00ae080424b49048
                          value_name: 读书郎
                          sub_property_id: 19289f3d21f8f543
                        - value_id: 3cf379e9d8fb855a1a7e3dcb59f0aa47
                          value_name: 酷比魔方
                          sub_property_id: 3cbaab42995dbf5a
                        - value_id: ffdd0e0342e73d47da08932c2b6805f2
                          value_name: 韩众
                          sub_property_id: 3cf7ac92ef069c59a7f7e02f36b0b49a
                    - property_id: 1581298a702bbc2b
                      property_name: 内存容量
                      required: 0
                      items:
                        - value_id: 18fd8f6cd1793271dc1e14499afb4aa5
                          value_name: 1.5GB+16GB
                        - value_id: c9e5cba68dd4a0a742ec7c3c94ce771e
                          value_name: 10GB+256GB
                        - value_id: b156d8b95b4345f988a740b7e32caa07
                          value_name: 128GB
                        - value_id: 1c6abb4a1ab05736d6fb3c9ab5bbfeb8
                          value_name: 12GB+128GB
                        - value_id: d5179b78c6bf0f3137fba6ec894bc859
                          value_name: 12GB+256GB
                        - value_id: 835e2dab3bb84f66bfe408d752c5a4d4
                          value_name: 12GB+512GB
                        - value_id: 284df4a1855cabfc4cb9b5b61e426d42
                          value_name: 16GB
                        - value_id: 75cd1fd0a8fa608f41d68824127d8e28
                          value_name: 16GB+512GB
                        - value_id: b3cf5b2ec0bf6be0ab4c1964b95f3221
                          value_name: 1GB
                        - value_id: 1c2dbf6b1391293d420c200d78614996
                          value_name: 1GB+16GB
                        - value_id: 925ca78f44aa2435c6d66d4d6f3dae97
                          value_name: 1GB+32GB
                        - value_id: c266ae33a8df26d53edb71199d6a8058
                          value_name: 1GB+8GB
                        - value_id: 0d59f8539ff19503f2ddd3ba0951b3c3
                          value_name: 1TB
                        - value_id: 84936957d76d48c54d3242a314e42f42
                          value_name: 256GB
                        - value_id: 73ac6a70fb75eff2801c10ff661cd63d
                          value_name: 2GB
                        - value_id: 7fb594c103e3ae258e5dd648f09f0fa8
                          value_name: 2GB+16GB
                        - value_id: 498cb258a7f13de61e49d9525d177414
                          value_name: 2GB+32GB
                        - value_id: e463279bcc29835f2be9d4665764b08e
                          value_name: 2GB+4GB
                        - value_id: cf3cc91f8c5cc579497a3a57212363a0
                          value_name: 2GB+64GB
                        - value_id: 143833bb48bcaff33c5271b57021a200
                          value_name: 2GB+8GB
                        - value_id: 2e9c3c8379ec619ddc584a47a481d7ac
                          value_name: 2TB
                        - value_id: ce7d7f2f054de26948ec30e1a070d742
                          value_name: 32GB
                        - value_id: a556941c32404cf4e46927d24965ebbe
                          value_name: 3GB+128GB
                        - value_id: 2e4d299c0f728e65218abf697f27b1df
                          value_name: 3GB+16GB
                        - value_id: f12532180ebc3856825ea24b58952beb
                          value_name: 3GB+32GB
                        - value_id: d7f024bd278218057daa7050976bc2c7
                          value_name: 3GB+64GB
                        - value_id: fe0a3c37218e354563ac3bac7a2cb245
                          value_name: 4GB
                        - value_id: 235611d216127e0eb9cddee0480dcb5f
                          value_name: 4GB+128GB
                        - value_id: 1a76e5c8423f110e3124255c11c3ccd7
                          value_name: 4GB+16GB
                        - value_id: f8dd3073e442acf2d7a21981037c6ff3
                          value_name: 4GB+256GB
                        - value_id: 1b8efae913a8206307a74840c319369e
                          value_name: 4GB+32GB
                        - value_id: d67cfcfa1d1caf04b34a3984bb2898db
                          value_name: 4GB+512MB
                        - value_id: 4e8fc4cf01c19025b0dd6581e4a5c5a2
                          value_name: 4GB+64GB
                        - value_id: 72fc833eff54ed4bbe50dd176cf64bb5
                          value_name: 512GB
                        - value_id: 0cd4e97654b3770699d1cce00dc5e0d1
                          value_name: 64GB
                        - value_id: e56871946a8cd25a0fc0f8605ceaf516
                          value_name: 6GB
                        - value_id: 8c4c648a0dadebaf210b66979bfe94a5
                          value_name: 6GB+128GB
                        - value_id: 364226629747ba27a0dd12ca3cc1a3eb
                          value_name: 6GB+256GB
                        - value_id: f77dbac70c647f0ace87300fdda26e60
                          value_name: 6GB+512GB
                        - value_id: f25a3dff5e201f1584b2f18393510f09
                          value_name: 6GB+64GB
                        - value_id: 83a0a39bbad73db4f9537899d0abd21d
                          value_name: 8GB
                        - value_id: 86b947cd1ba7f42be8dc0b09e0e24f56
                          value_name: 8GB+128GB
                        - value_id: d322141e0ebb9014d7c993626e4182e2
                          value_name: 8GB+256GB
                        - value_id: 13789f49a726ddca5ef704349133d070
                          value_name: 8GB+512GB
                        - value_id: b009186329384709e31d2b35307b0148
                          value_name: 8GB+512MB
                        - value_id: a78c416cb969af156e4354ff92c03bb7
                          value_name: 8Gb+64Gb
                        - value_id: 019563c42ee250645355a42eae91a6f6
                          value_name: 其他/other
                        - value_id: ca29f8a4b2bc8278e441fdd139d82a1a
                          value_name: 内存容量不限
                    - property_id: 42e93ad46d8bb882a7f7e02f36b0b49a
                      property_name: 版本类型
                      required: 0
                      items:
                        - value_id: d1ef9b2f19a34ba111ad815eb752d189
                          value_name: 中国大陆版
                        - value_id: f1ce5367f9164629bfa5a44d3715f4a4
                          value_name: 其他区无锁版
                        - value_id: 51540a768f090d0ce2184a299a8ade4a
                          value_name: 其他区有锁版
                        - value_id: 1cb8599fa1e4bba0999d431674440ebe
                          value_name: 国行展示机
                        - value_id: bb9f289aa76bd6e9283d3781773a4a30
                          value_name: 国行版资源机
                        - value_id: b6614c6f408d183087c0eb2ac5fa2a4d
                          value_name: 官换/官修机
                        - value_id: 926512b39ab1695b550f7f4d4d93e75c
                          value_name: 官换机
                        - value_id: 1b37bf27ce6c60dfbfc5b07d2d630a51
                          value_name: 海外版资源机
                        - value_id: 6b24b8d0043670ff07f9cbf3da65f7e9
                          value_name: 港版
                        - value_id: 4304bd2716d764358a2b9fa4556637c7
                          value_name: 版本不限
                        - value_id: c4a263a7de7b129daaa025bab266931f
                          value_name: 非国行展示机
                    - property_id: e300843c892f77f2a7f7e02f36b0b49a
                      property_name: 维修及进水情况
                      required: 0
                      items:
                        - value_id: 0b4f9d913dea66bc54d2cf2b33e8a620
                          value_name: 主板维修/扩容，或进水受潮
                        - value_id: af88d74e0de139482fc0a7c275f429bb
                          value_name: 外壳/电池/其他零件有维修
                        - value_id: 512ef5ac6380d7ff864b331e94647c4f
                          value_name: 屏幕有维修
                        - value_id: c9c098b6af5528d545c4d4100be6cd6b
                          value_name: 屏幕维修，且主板维修/进水受潮
                        - value_id: 00c1a43c0c458754efcf93b3d6f56a97
                          value_name: 无维修，无进水
                    - property_id: 3b9f06b2bccead76
                      property_name: 成色
                      required: 0
                      items:
                        - value_id: 4056d22fd35ee7cb010a4c0957a209e8
                          value_name: 全新未拆封
                        - value_id: aa46678cd7635498eb6a252cb697a56e
                          value_name: 几乎全新
                        - value_id: bead29290e88ee8ced22537b6e5ed9c3
                          value_name: 有明显的磕碰划痕
                        - value_id: e02d374999061b6cb2896f0c1c9a69c1
                          value_name: 有轻微的磕碰划痕
                        - value_id: 0de37dfbba6786834b9fbb57c35f69d6
                          value_name: 细微磕碰划痕
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-95804125-run
components:
  schemas:
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询商品规格

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/sku/list:
    post:
      summary: 查询商品规格
      deprecated: false
      description: 注意：仅多规格商品才能查询
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: array
                  items:
                    type: integer
                  title: 管家商品ID
                  description: 最多支持100个
              required:
                - product_id
              x-apifox-orders:
                - product_id
              x-apifox-ignore-properties: []
            example:
              product_id:
                - 537044127563781
                - 536768661209157
                - 536757860159557
                - 536757337415749
                - 536756946305093
                - 536756424831045
                - 536755748188229
                - 536749977821253
                - 536749611401285
                - 536748065054789
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5SAMZN8TK74ARSB0XBMNX4D:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_0
                        type: object
                        properties:
                          list:
                            type: array
                            items:
                              type: object
                              properties:
                                product_id:
                                  type: integer
                                  title: 闲鱼管家商品ID
                                  format: int64
                                sku_items:
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      sku_id:
                                        type: integer
                                        title: 管家SKU规格ID
                                        format: int64
                                      price:
                                        title: SKU售价（分）
                                        $ref: '#/components/schemas/price'
                                      stock:
                                        type: integer
                                        title: SKU库存
                                        maximum: 9999
                                        format: int32
                                        minimum: 0
                                        examples:
                                          - 10
                                      sku_text:
                                        type: string
                                        title: SKU规格
                                        examples:
                                          - 颜色:黑色;内存:512G
                                      outer_id:
                                        type: string
                                        title: SKU商家编码
                                        examples:
                                          - '2023072101'
                                        minLength: 0
                                        maxLength: 64
                                      xy_sku_id:
                                        type: integer
                                        title: 闲鱼SKUID
                                    x-apifox-orders:
                                      - sku_id
                                      - price
                                      - stock
                                      - sku_text
                                      - outer_id
                                      - xy_sku_id
                                    required:
                                      - sku_id
                                      - price
                                      - stock
                                      - sku_text
                                    title: SKU信息
                                    x-apifox-ignore-properties: []
                                  title: 商品多规格信息
                                  nullable: true
                              required:
                                - product_id
                                - sku_items
                              x-apifox-orders:
                                - product_id
                                - sku_items
                              x-apifox-ignore-properties: []
                            title: 列表数据
                        x-apifox-orders:
                          - list
                        title: 数据
                        required:
                          - list
                        x-apifox-ignore-properties: []
                    required:
                      - data
                x-apifox-orders:
                  - 01H5SAMZN8TK74ARSB0XBMNX4D
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_0
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
              examples:
                '1':
                  summary: 成功示例
                  value:
                    list:
                      - product_id: 537044127563781
                        sku_items:
                          - sku_id: 537044127563786
                            price: 2
                            stock: 1
                            sku_text: 颜色:蓝色
                            outer_id: gyfbcs240416001
                          - sku_id: 537044127563787
                            price: 2
                            stock: 1
                            sku_text: 颜色:紫色
                            outer_id: gyfbcs240416022
                      - product_id: 536768661209157
                        sku_items:
                          - sku_id: 536768661209186
                            price: 200
                            stock: 100
                            sku_text: 颜色:象牙白*1【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396609'
                          - sku_id: 536768661209187
                            price: 400
                            stock: 100
                            sku_text: 颜色:象牙白*2【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396610'
                          - sku_id: 536768661209188
                            price: 600
                            stock: 100
                            sku_text: 颜色:象牙白*3【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396611'
                          - sku_id: 536768661209189
                            price: 800
                            stock: 100
                            sku_text: 颜色:象牙白*4【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396612'
                          - sku_id: 536768661209190
                            price: 1000
                            stock: 100
                            sku_text: 颜色:象牙白*5【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396613'
                          - sku_id: 536768661209191
                            price: 1200
                            stock: 100
                            sku_text: 颜色:象牙白*6【适用毛巾、抹布、洗脸巾】
                            outer_id: '4958298396614'
                      - product_id: 536757860159557
                        sku_items:
                          - sku_id: 536757860167749
                            price: 1500
                            stock: 3
                            sku_text: 颜色:蓝色;大小:大
                            outer_id: cssp01234444
                          - sku_id: 536757860167750
                            price: 2300
                            stock: 3
                            sku_text: 颜色:蓝色;大小:小
                            outer_id: cssp01234444
                          - sku_id: 536757860167751
                            price: 1500
                            stock: 3
                            sku_text: 颜色:粉色;大小:大
                            outer_id: cssp01234444
                          - sku_id: 536757860167752
                            price: 1500
                            stock: 3
                            sku_text: 颜色:粉色;大小:小
                            outer_id: cssp01234444
                      - product_id: 536757337415749
                        sku_items:
                          - sku_id: 536757337423941
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536757337423942
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536757337423943
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536757337423944
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536756946305093
                        sku_items:
                          - sku_id: 536756946313285
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536756946313286
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536756946313287
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536756946313288
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536756424831045
                        sku_items:
                          - sku_id: 536756424843333
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536756424843334
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536756424843335
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536756424843336
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536755748188229
                        sku_items:
                          - sku_id: 536755748200517
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536755748200518
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536755748200519
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536755748200520
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536749977821253
                        sku_items:
                          - sku_id: 536749977829445
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536749977829446
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536749977829447
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536749977829448
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536749611401285
                        sku_items:
                          - sku_id: 536749611409477
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536749611409478
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536749611409479
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536749611409480
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                      - product_id: 536748065054789
                        sku_items:
                          - sku_id: 536748065062981
                            price: 1000
                            stock: 5
                            sku_text: 颜色:红色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536748065062982
                            price: 1000
                            stock: 11
                            sku_text: 颜色:红色;尺码:M
                            outer_id: '0001'
                          - sku_id: 536748065062983
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:L
                            outer_id: '0001'
                          - sku_id: 536748065062984
                            price: 1000
                            stock: 11
                            sku_text: 颜色:粉色;尺码:M
                            outer_id: '0001'
                '2':
                  summary: 异常示例
                  value:
                    status: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-165788779-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询商品列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/list:
    post:
      summary: 查询商品列表
      deprecated: false
      description: |-
        注意事项：
        1：该接口只能查询最近六个月内修改过的商品
        2：该接口只返回基础信息，更多信息请调用查询商品详情接口
        3：商品状态为空时，默认不返回`-1:已删除`的商品
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                online_time: &ref_0
                  title: 商品上架时间
                  $ref: '#/components/schemas/time_range'
                  deprecated: true
                offline_time: *ref_0
                sold_time: *ref_0
                update_time: *ref_0
                create_time: *ref_0
                product_status:
                  title: 管家商品状态
                  $ref: '#/components/schemas/product_status'
                  description: '`product_status`和`sale_status`均传入时，优先使用`product_status`'
                sale_status:
                  type: integer
                  title: 销售状态
                  description: '枚举值：1 : 待发布2 : 销售中3 : 已下架'
                  format: int32
                  enum:
                    - 1
                    - 2
                    - 3
                  default: 0
                  examples:
                    - 1
                  x-apifox-enum:
                    - value: 1
                      name: ''
                      description: 待发布
                    - value: 2
                      name: ''
                      description: 销售中
                    - value: 3
                      name: ''
                      description: 已下架
                page_no:
                  type: integer
                  title: 页码
                  description: '注意：description: 传入值为1代表第一页，传入值为2代表第二页，依此类推'
                  minimum: 1
                  maximum: 100
                  default: 1
                  format: int32
                page_size:
                  type: integer
                  title: 每页行数
                  description: >-
                    注意：当翻页获取的条数（page_no*page_size）超过1万，接口将报错，所以请大家尽可能的细化自己的搜索条件，例如缩短修改时间分段获取商品
                  minimum: 1
                  maximum: 100
                  default: 50
                  format: int32
              x-apifox-orders:
                - online_time
                - offline_time
                - sold_time
                - update_time
                - create_time
                - product_status
                - sale_status
                - page_no
                - page_size
              x-apifox-ignore-properties: []
            example:
              update_time:
                - 1690300800
                - 1690366883
              product_status: 21
              page_no: 1
              page_size: 50
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5SAMZN8TK74ARSB0XBMNX4D:
                    x-apifox-overrides:
                      data: &ref_1
                        type: object
                        properties:
                          list:
                            type: array
                            items:
                              type: object
                              properties:
                                product_id:
                                  type: integer
                                  title: 闲鱼管家商品ID
                                  format: int64
                                product_status:
                                  title: 管家商品状态
                                  description: >-
                                    `product_status`和`sale_status`均传入时，优先使用`product_status`
                                  type: object
                                  properties: {}
                                item_biz_type:
                                  title: 商品类型ID
                                  type: object
                                  properties: {}
                                sp_biz_type:
                                  title: 商品行业ID
                                  type: object
                                  properties: {}
                                channel_cat_id:
                                  type: string
                                  title: 商品类目ID
                                  examples:
                                    - e11455b218c06e7ae10cfa39bf43dc0f
                                original_price:
                                  title: 商品原价（分）
                                  type: object
                                  properties: {}
                                price:
                                  title: 商品售价（分）
                                  type: object
                                  properties: {}
                                stock:
                                  type: integer
                                  title: 商品库存
                                  minimum: 1
                                  maximum: 399960
                                  format: int32
                                  examples:
                                    - 1
                                sold:
                                  type: integer
                                  title: 商品销量
                                  format: int32
                                title:
                                  type: string
                                  title: 商品标题
                                  minLength: 1
                                  maxLength: 30
                                  examples:
                                    - iPhone 12 128G 黑色
                                district_id:
                                  type: integer
                                  title: 发货地区ID
                                  examples:
                                    - 440305
                                outer_id:
                                  type: string
                                  title: 商家编码
                                  examples:
                                    - '2021110112345'
                                stuff_status:
                                  title: 商品成色
                                  type: object
                                  properties: {}
                                express_fee:
                                  title: 运费（分）
                                  type: object
                                  properties: {}
                                spec_type:
                                  title: 商品规格类型
                                  type: object
                                  properties: {}
                                source:
                                  type: integer
                                  enum:
                                    - 11
                                    - 12
                                    - 21
                                    - 91
                                  title: 商品来源
                                  examples:
                                    - 91
                                  x-apifox-enum:
                                    - value: 11
                                      name: ''
                                      description: 新建商品
                                    - value: 12
                                      name: ''
                                      description: 闲鱼APP
                                    - value: 21
                                      name: ''
                                      description: 淘宝搬家
                                    - value: 91
                                      name: ''
                                      description: ERP
                                specify_publish_time:
                                  type: integer
                                  title: 定时上架时间
                                  examples:
                                    - 1692281858
                                online_time:
                                  type: integer
                                  title: 商品上架时间
                                  examples:
                                    - 1636019388
                                offline_time:
                                  type: integer
                                  title: 商品下架时间
                                  examples:
                                    - 1636019388
                                sold_time:
                                  type: integer
                                  title: 商品售罄时间
                                  examples:
                                    - 1636019388
                                update_time:
                                  type: integer
                                  title: 商品更新时间
                                  examples:
                                    - 1636019388
                                create_time:
                                  type: integer
                                  title: 商品创建时间
                                  examples:
                                    - 1636019388
                              required:
                                - product_id
                                - product_status
                                - item_biz_type
                                - sp_biz_type
                                - channel_cat_id
                                - original_price
                                - price
                                - stock
                                - sold
                                - title
                                - district_id
                                - outer_id
                                - stuff_status
                                - express_fee
                                - spec_type
                                - source
                                - specify_publish_time
                                - online_time
                                - offline_time
                                - sold_time
                                - update_time
                                - create_time
                              x-apifox-orders:
                                - product_id
                                - product_status
                                - item_biz_type
                                - sp_biz_type
                                - channel_cat_id
                                - original_price
                                - price
                                - stock
                                - sold
                                - title
                                - district_id
                                - outer_id
                                - stuff_status
                                - express_fee
                                - spec_type
                                - source
                                - specify_publish_time
                                - online_time
                                - offline_time
                                - sold_time
                                - update_time
                                - create_time
                              x-apifox-ignore-properties: []
                            title: 列表数据
                          count:
                            type: integer
                            format: int32
                            title: 查询总数
                          page_no:
                            type: integer
                            format: int32
                            title: 页码
                          page_size:
                            type: integer
                            format: int32
                            title: 每页行数
                        x-apifox-orders:
                          - list
                          - count
                          - page_no
                          - page_size
                        title: 数据
                        required:
                          - list
                          - count
                          - page_no
                          - page_size
                        x-apifox-ignore-properties: []
                    required:
                      - data
                    type: object
                    properties: {}
                x-apifox-orders:
                  - 01H5SAMZN8TK74ARSB0XBMNX4D
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_1
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data:
                      list:
                        - product_id: 448592974859525
                          product_status: 31
                          item_biz_type: 2
                          sp_biz_type: 27
                          channel_cat_id: 48b41f39bc7cb246267e0a01017d9f44
                          original_price: 400000
                          price: 400000
                          stock: 2
                          title: 测试0717食品-海外
                          district_id: 130100
                          outer_id: CS-230717
                          stuff_status: 60
                          express_fee: 1
                          spec_type: 1
                          source: 14
                          specify_publish_time: 0
                          online_time: 1691656170
                          offline_time: 1691657197
                          sold_time: 0
                          update_time: 1691657199
                          create_time: 1691656171
                      count: 100
                      page_no: 1
                      page_size: 5
                '2':
                  summary: 异常示例
                  value:
                    status: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586381-run
components:
  schemas:
    product_status:
      type: integer
      title: 商品状态
      description: '枚举值：-1 : 已删除21 : 待发布22 : 销售中23 : 已售罄31 : 手动下架33 : 售出下架36 : 自动下架'
      format: int32
      enum:
        - -1
        - 21
        - 22
        - 23
        - 31
        - 33
        - 36
      default: 0
      examples:
        - 21
      x-apifox-enum:
        - value: -1
          name: ''
          description: 删除
        - value: 21
          name: ''
          description: 待发布
        - value: 22
          name: ''
          description: 销售中
        - value: 23
          name: ''
          description: 已售罄
        - value: 31
          name: ''
          description: 手动下架
        - value: 33
          name: ''
          description: 售出下架
        - value: 36
          name: ''
          description: 自动下架
      x-apifox-folder: ''
    time_range:
      type: array
      items:
        type: integer
        format: int64
        x-apifox-mock: '@timestamp'
      title: 时间范围
      description: 第一个元素值为开始时间戳,第二个元素值为结束时间戳
      minItems: 2
      maxItems: 2
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    spec_type:
      type: integer
      title: 规格类型
      description: |
        枚举值：
        1 : 单规格
        2 : 多规格
      enum:
        - 1
        - 2
      format: int32
      examples:
        - 1
      x-apifox-enum:
        - value: 1
          name: ''
          description: 单规格
        - value: 2
          name: ''
          description: 多规格
      x-apifox-folder: ''
    express_fee:
      type: integer
      title: 运费
      format: int64
      x-apifox-folder: ''
    stuff_status:
      type: integer
      title: 商品成色
      description: |-
        枚举值：
        0 : 无成色（普通商品可用）
        100 : 全新
         -1 : 准新 
        99 : 99新 
        95 : 95新 
        90 : 9新 
        80 : 8新 
        70 : 7新 
        60 : 6新 
        50 : 5新 

        -仅品牌捡漏类型可用-
        40 : 未使用·中度瑕疵
        30 : 未使用·轻微瑕疵
        20 : 未使用·仅拆封
        10 : 未使用·准新
        100 : 全新未使用
        -仅品牌捡漏类型可用-

        及以下注意：非普通商品类型时必填~~
      format: int32
      enum:
        - 100
        - -1
        - 99
        - 95
        - 90
        - 80
        - 70
        - 60
        - 50
        - 40
        - 30
        - 20
        - 10
        - 0
      default: 0
      examples:
        - 100
      x-apifox-enum:
        - value: 100
          name: ''
          description: 全新
        - value: -1
          name: ''
          description: 准新
        - value: 99
          name: ''
          description: 99新
        - value: 95
          name: ''
          description: 95新
        - value: 90
          name: ''
          description: 9新
        - value: 80
          name: ''
          description: 8新
        - value: 70
          name: ''
          description: 7新
        - value: 60
          name: ''
          description: 6新
        - value: 50
          name: ''
          description: 5新及以下
        - value: 40
          name: ''
          description: 未使用·中度瑕疵
        - value: 30
          name: ''
          description: 未使用·轻微瑕疵
        - value: 20
          name: ''
          description: 未使用·仅拆封
        - value: 10
          name: ''
          description: 未使用·准新
        - value: 0
          name: ''
          description: 无
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    original_price:
      type: integer
      title: 商品原价
      minimum: 0
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询商品详情

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/detail:
    post:
      summary: 查询商品详情
      deprecated: false
      description: ''
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                  examples:
                    - 219530767978565
              required:
                - product_id
              x-apifox-orders:
                - product_id
              x-apifox-ignore-properties: []
            example:
              product_id: 220656347074629
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5SAKX0TS4PVTDVJKA8QP13Z:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_7
                        type: object
                        properties:
                          product_id:
                            type: integer
                            title: 管家商品ID
                            format: int64
                            examples:
                              - 441160510721413
                          product_status:
                            $ref: '#/components/schemas/product_status'
                            title: 商品状态
                          item_biz_type:
                            title: 商品类型
                            $ref: '#/components/schemas/item_biz_type'
                          sp_biz_type:
                            title: 商品行业
                            $ref: '#/components/schemas/sp_biz_type'
                          channel_cat_id:
                            type: string
                            title: 商品类目ID
                            examples:
                              - e11455b218c06e7ae10cfa39bf43dc0f
                          channel_pv:
                            title: 商品属性
                            $ref: '#/components/schemas/channel_pv'
                          title:
                            type: string
                            title: 商品标题
                            minLength: 1
                            maxLength: 60
                            examples:
                              - iPhone 12 128G 黑色
                          price: &ref_6
                            title: 商品售价（分）
                            $ref: '#/components/schemas/price'
                          original_price:
                            title: 商品原价（分）
                            $ref: '#/components/schemas/original_price'
                          express_fee:
                            title: 运费（分）
                            $ref: '#/components/schemas/express_fee'
                          stock:
                            type: integer
                            title: 商品库存
                            minimum: 1
                            maximum: 399960
                            format: int32
                            examples:
                              - 1
                          sold:
                            type: integer
                            format: int32
                            title: 商品销量
                          outer_id:
                            type: string
                            title: 商家编码
                            minLength: 1
                            maxLength: 64
                            examples:
                              - '317837811'
                          stuff_status:
                            title: 商品成色
                            $ref: '#/components/schemas/stuff_status'
                          publish_status:
                            title: 发布状态
                            description: |-
                              枚举值：
                              -1：不可操作（不可上架/编辑）
                              1：草稿箱（可编辑/删除）
                              2：待发布（可上架/编辑/删除）
                              3：销售中（可下架/编辑）
                              4：已下架（可上架/编辑/删除）
                              5：已售罄（可上架/编辑/删除）
                              9：商品异常（可编辑/删除）
                            $ref: '#/components/schemas/publish_status'
                          publish_shop:
                            type: array
                            items:
                              type: object
                              x-apifox-refs:
                                01H6BPM745KPXWK4Q2TNKAQ14Q:
                                  $ref: '#/components/schemas/publish_shop'
                                  x-apifox-overrides:
                                    user_name: &ref_0
                                      type: string
                                      title: 闲鱼会员名
                                      examples:
                                        - tb924343042
                                    title: &ref_2
                                      type: string
                                      title: 商品标题
                                      description: 注意：一个中文按2个字符算
                                      minLength: 1
                                      examples:
                                        - iPhone 12 128G 黑色
                                      maxLength: 60
                                    province: &ref_1
                                      type: integer
                                      title: 商品发货省份
                                      format: int32
                                      examples:
                                        - 110000
                                    images: &ref_3
                                      title: 商品图片URL
                                      description: 注意：第一张为商品主图
                                      $ref: '#/components/schemas/images1'
                                    white_images: &ref_4
                                      type: string
                                      title: 商品白底图URL
                                      examples:
                                        - https://xxx.com/xxx1.jpg
                                    service_support: &ref_5
                                      title: 商品服务
                                      $ref: '#/components/schemas/service_support'
                                  required:
                                    - user_name
                                    - title
                                    - province
                                    - images
                              x-apifox-orders:
                                - item_id
                                - 01H6BPM745KPXWK4Q2TNKAQ14Q
                                - status
                              properties:
                                item_id:
                                  type: integer
                                  title: 闲鱼商品ID
                                  format: int64
                                  examples:
                                    - 9787505720176
                                user_name: *ref_0
                                province: *ref_1
                                city:
                                  type: integer
                                  title: 商品发货城市
                                  format: int32
                                  examples:
                                    - 110100
                                district:
                                  type: integer
                                  title: 商品发货地区
                                  format: int32
                                  examples:
                                    - 110101
                                title: *ref_2
                                content:
                                  type: string
                                  title: 商品描述
                                  description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\\n换行
                                  minLength: 5
                                  maxLength: 5000
                                  examples:
                                    - iPhone 12 128G 黑色 8新，非诚勿扰~~
                                images: *ref_3
                                white_images: *ref_4
                                service_support: *ref_5
                                status:
                                  type: integer
                                  format: int32
                                  enum:
                                    - 1
                                    - 2
                                  title: 使用状态
                                  description: |-
                                    枚举值：
                                    1 : 使用中（表示选中该信息发布到闲鱼）
                                    2 : 未使用
                                  x-apifox-enum:
                                    - name: ''
                                      value: 1
                                      description: 使用中
                                    - name: ''
                                      value: 2
                                      description: 未使用
                              required:
                                - user_name
                                - province
                                - city
                                - district
                                - title
                                - content
                                - images
                                - status
                              x-apifox-ignore-properties:
                                - user_name
                                - province
                                - city
                                - district
                                - title
                                - content
                                - images
                                - white_images
                                - service_support
                            title: 发布店铺
                          sku_items:
                            type: array
                            items:
                              type: object
                              properties:
                                sku_id:
                                  type: integer
                                  title: 管家SKU规格ID
                                  format: int64
                                price: *ref_6
                                stock:
                                  type: integer
                                  title: SKU库存
                                  maximum: 9999
                                  format: int32
                                  minimum: 0
                                  examples:
                                    - 10
                                sku_text:
                                  type: string
                                  title: SKU规格
                                  examples:
                                    - 颜色:黑色;内存:512G
                                outer_id:
                                  type: string
                                  title: SKU商家编码
                                  examples:
                                    - '2023072101'
                                  minLength: 0
                                  maxLength: 64
                                xy_sku_id:
                                  type: integer
                                  title: 闲鱼SKUID
                              x-apifox-orders:
                                - sku_id
                                - price
                                - stock
                                - sku_text
                                - outer_id
                                - xy_sku_id
                              required:
                                - sku_id
                                - price
                                - stock
                                - sku_text
                              title: SKU信息
                              x-apifox-ignore-properties: []
                            title: 商品多规格信息
                          book_data:
                            title: 图书信息
                            $ref: '#/components/schemas/book_data'
                          food_data:
                            title: 食品信息
                            $ref: '#/components/schemas/food_data'
                          report_data:
                            title: 验货报告信息
                            $ref: '#/components/schemas/report_data'
                          specify_publish_time:
                            type: string
                            title: 定时上架时间
                            examples:
                              - '2023-07-21 00:00:00'
                          online_time:
                            type: integer
                            title: 商品上架时间
                            examples:
                              - 1636019388
                          offline_time:
                            type: integer
                            title: 商品下架时间
                            examples:
                              - 1636019388
                          sold_time:
                            type: integer
                            title: 商品售罄时间
                            examples:
                              - 1636019388
                          create_time:
                            type: integer
                            title: 商品创建时间
                            examples:
                              - 1636019388
                          update_time:
                            type: integer
                            title: 商品更新时间
                            examples:
                              - 1636019388
                          flash_sale_type:
                            $ref: '#/components/schemas/flash_sale_type'
                            title: 闲鱼特卖类型
                          advent_data:
                            $ref: '#/components/schemas/advent_data'
                            title: 闲鱼特卖信息
                          brand_data:
                            $ref: '#/components/schemas/brand_data'
                            title: 品牌捡漏信息
                          detail_images: &ref_8
                            $ref: '#/components/schemas/images'
                            title: 详情图片
                          sku_images:
                            $ref: '#/components/schemas/sku_images'
                            title: 规格图片
                          ship_region_data:
                            $ref: >-
                              #/components/schemas/%E8%B7%A8%E5%A2%83%E5%8F%91%E8%B4%A7%E5%9C%B0%E5%8C%BA
                          is_tax_included:
                            type: boolean
                            title: 是否包含税费
                            description: 目前仅用于跨境商品
                        required:
                          - product_id
                          - product_status
                          - item_biz_type
                          - sp_biz_type
                          - channel_cat_id
                          - title
                          - price
                          - stock
                          - sold
                          - publish_status
                        x-apifox-orders:
                          - product_id
                          - product_status
                          - item_biz_type
                          - sp_biz_type
                          - channel_cat_id
                          - channel_pv
                          - title
                          - price
                          - original_price
                          - express_fee
                          - stock
                          - sold
                          - outer_id
                          - stuff_status
                          - publish_status
                          - publish_shop
                          - sku_items
                          - book_data
                          - food_data
                          - report_data
                          - specify_publish_time
                          - online_time
                          - offline_time
                          - sold_time
                          - create_time
                          - update_time
                          - flash_sale_type
                          - advent_data
                          - brand_data
                          - detail_images
                          - sku_images
                          - ship_region_data
                          - is_tax_included
                        x-apifox-ignore-properties: []
                    required:
                      - data
                x-apifox-orders:
                  - 01H5SAKX0TS4PVTDVJKA8QP13Z
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_7
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data:
                      product_id: 441864286003077
                      product_status: 21
                      item_biz_type: 2
                      sp_biz_type: 25
                      channel_cat_id: fee623cbc89d0ab7a7f7e02f36b0b49a
                      channel_pv:
                        - property_id: b5e5462c028aba7f1921b9e373cead75
                          property_name: 交易形式
                          value_id: 8a3445658e0bc44687b43d68bdc44732
                          value_name: 代下单
                        - property_id: 96ad8793a2fdb81bb108d382c4e6ea42
                          property_name: 面值
                          value_id: 38ed5f6522cd7ab6
                          value_name: 100元
                      title: 商品标题
                      price: 10000
                      original_price: 12000
                      express_fee: 0
                      stock: 1
                      outer_id: YCHQCS1111
                      stuff_status: 0
                      publish_status: 2
                      publish_shop:
                        - user_name: ''
                          province: 130000
                          city: 130100
                          district: 130101
                          title: 商品标题
                          content: 商品描述。
                          images:
                            - product/20230722/161018-6546kdnp.jpg
                          white_images: ''
                          service_support: ''
                      book_data:
                        title: 北京法源寺
                        author: 李敖
                        publisher: 中国友谊出版公司
                        isbn: '9787505720176'
                      food_data:
                        pack: 罐装
                        spec: '150'
                        brand: 伏特加伏特加
                        expire:
                          num: 360
                          unit: 天
                        production:
                          date: '2021-11-29'
                          address:
                            detail: 北京市东城区x街道
                            province: 130000
                            city: 130100
                            district: 130101
                      report_data:
                        used_car:
                          report_url: https://xxxxxx.com
                        beauty_makeup:
                          org_id: 181
                          brand: 欧莱雅
                          spec: 小瓶装
                          level: 全新
                          org_name: 哈哈哈
                          qc_result: 通过
                          images:
                            - https://xxx.com/xxx1.jpg
                            - https://xxx.com/xxx2.jpg
                        game:
                          qc_no: '123123'
                          qc_result: 符合
                          title: 测试游戏
                          platform: 小霸王
                          images:
                            - https://xxx.com/xxx1.jpg
                            - https://xxx.com/xxx2.jpg
                        curio:
                          org_id: 191
                          org_name: NGC评级
                          size: 12mmx14mm
                          material: 陶瓷
                          qc_no: '3131319'
                          qc_result: 真品
                          images:
                            - https://xxx.com/xxx1.jpg
                            - https://xxx.com/xxx2.jpg
                        jewelry:
                          org_name: 某某平台
                          shape: 圆形
                          color: 白色
                          weight: 125g
                          qc_no: '3131319'
                          qc_desc: 无瑕疵
                          images:
                            - https://xxx.com/xxx1.jpg
                            - https://xxx.com/xxx2.jpg
                        valuable:
                          org_id: 162
                          org_name: 国检
                          qc_no: '454545'
                          qc_result: 符合
                          images:
                            - https://xxx.com/xxx1.jpg
                            - https://xxx.com/xxx2.jpg
                      spec_type: 1
                      specify_publish_time: ''
                      online_time: 1690013426
                      offline_time: 1690013665
                      sold_time: 1690013665
                      update_time: 1690013710
                      create_time: 1690013424
                '2':
                  summary: 异常示例
                  value:
                    status: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586380-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    跨境发货地区:
      type: object
      properties:
        region_name:
          type: string
          title: 地区名称
          examples:
            - 香港
        region_code:
          type: string
          title: 地区代码
          examples:
            - HKG
          enum:
            - HKG
            - JPN
          x-apifox-enum:
            - value: HKG
              name: 香港
              description: ''
            - value: JPN
              name: 日本
              description: ''
          description: 注意：目前仅支持香港/日本跨境商品
      x-apifox-orders:
        - region_name
        - region_code
      required:
        - region_name
        - region_code
      description: |
        目前仅用于跨境商品（必填）
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
          sku_text:
            type: string
            title: 规格属性
            examples:
              - 颜色:黑色
        x-apifox-orders:
          - src
          - width
          - height
          - sku_text
        required:
          - src
          - width
          - height
          - sku_text
        x-apifox-ignore-properties: []
      title: 规格图片
      x-apifox-folder: ''
    images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
        x-apifox-orders:
          - src
          - width
          - height
        required:
          - src
          - width
          - height
        x-apifox-ignore-properties: []
      title: 新图片信息
      x-apifox-folder: ''
    brand_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
        supplier:
          type: string
          title: 供应商名称
        images: *ref_8
      x-apifox-orders:
        - expire
        - production
        - supplier
        - images
      title: 品牌捡漏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    advent_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
      required:
        - expire
        - production
      x-apifox-orders:
        - expire
        - production
      title: 闲鱼特卖信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    flash_sale_type:
      type: integer
      title: 闲鱼特卖类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 99
        - 2601
        - 2602
        - 2603
        - 2604
      examples:
        - 1
      x-apifox-enum:
        - name: ''
          value: 1
          description: 临期
        - name: ''
          value: 2
          description: 孤品
        - name: ''
          value: 3
          description: 断码
        - name: ''
          value: 4
          description: 微瑕
        - name: ''
          value: 5
          description: 尾货
        - name: ''
          value: 6
          description: 官翻
        - name: ''
          value: 7
          description: 全新
        - name: ''
          value: 8
          description: 福袋
        - name: ''
          value: 99
          description: 其他
        - name: ''
          value: 2601
          description: 微瑕
        - name: ''
          value: 2602
          description: 临期
        - name: ''
          value: 2603
          description: 清仓
        - name: ''
          value: 2604
          description: 官翻
      description: |-
        枚举值：
        -仅闲鱼特卖类型可用-
        1 : 临期
        2 : 孤品
        3 : 断码
        4 : 微瑕
        5 : 尾货
        6 : 官翻
        7 : 全新
        8 : 福袋
        99 : 其他
        -仅闲鱼特卖类型可用-
        -仅品牌捡漏类型可用-
        2601 : 微瑕
        2602 : 临期
        2603 : 清仓
        2604 : 官翻
        -仅品牌捡漏类型可用-
      x-apifox-folder: ''
    report_data:
      type: object
      properties:
        beauty_makeup:
          title: 美妆信息
          $ref: '#/components/schemas/beauty_makeup'
        curio:
          title: 文玩信息
          $ref: '#/components/schemas/curio'
        jewelry:
          title: 珠宝信息
          $ref: '#/components/schemas/jewelry'
        game:
          title: 游戏信息
          $ref: '#/components/schemas/game'
        used_car:
          title: 二手车信息
          $ref: '#/components/schemas/used_car'
        valuable:
          title: 奢品信息
          $ref: '#/components/schemas/valuable'
        yx_3c:
          $ref: '#/components/schemas/%E4%B8%A5%E9%80%893c%E4%BF%A1%E6%81%AF'
      x-apifox-orders:
        - beauty_makeup
        - curio
        - jewelry
        - game
        - used_car
        - valuable
        - yx_3c
      title: 验货报告信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    严选3c信息:
      type: object
      properties:
        class_id:
          type: integer
          title: 品类ID
        subclass_id:
          type: integer
          title: 子类ID
        brand_id:
          type: integer
          title: 品牌ID
        brand_name:
          type: string
          title: 品牌名称
        model_id:
          type: integer
          title: 机型ID
        model_name:
          type: string
          title: 机型名称
        model_sn:
          type: string
          title: IMEI/序列号
        report_user:
          type: string
          title: 质检人
          description: 体现在商品验货报告页
        report_time:
          type: string
          title: 质检时间
          description: 体现在商品验货报告页
        report_items:
          type: array
          items:
            type: object
            properties:
              answer_id:
                type: integer
                format: int32
                title: 选项ID
              answer_name:
                type: string
                title: 选项名称
              answer_type:
                type: integer
                title: 选项类型
                enum:
                  - 0
                  - 1
                  - 2
                examples:
                  - 1
                format: int32
                x-apifox-enum:
                  - value: 0
                    name: ''
                    description: 普通项
                  - value: 1
                    name: ''
                    description: 正常项
                  - value: 2
                    name: ''
                    description: 异常项
              answer_desc:
                type: string
                title: 选项描述
              question_name:
                type: string
                title: 问题名称
              category_name:
                type: string
                title: 分类名称
              group_name:
                type: string
                title: 分组名称
            x-apifox-orders:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            required:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            x-apifox-ignore-properties: []
          title: 质检报告项
          description: 体现在商品验货报告页
        answer_ids:
          type: array
          items:
            type: integer
          title: 质检选项ID
          description: 内部存储，不对外展示
      required:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-orders:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    valuable:
      type: object
      properties:
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 161
            - 162
            - 163
            - 164
          examples:
            - 161
          description: |-
            枚举值：
            161 : 中检
            162 : 国检
            163 : 华测
            164 : 中溯
          x-apifox-enum:
            - value: 161
              name: ''
              description: 中检
            - value: 162
              name: ''
              description: 国检
            - value: 163
              name: ''
              description: 华测
            - value: 164
              name: ''
              description: 中溯
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 中检
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
        images: *ref_3
      required:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 奢品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    used_car:
      type: object
      properties:
        report_url:
          type: string
          description: ' 验货报告链接'
        driving_license_info:
          type: string
          description: ' 行驶证主页图片'
        driving_license_car_photo:
          type: string
          description: ' 行驶证车辆页图片'
        business_license_front:
          type: string
          description: ' 营业执照图片'
        car_function:
          type: string
          description: ' 使用性质 : 营运/非营运'
        car_vin:
          type: string
          description: ' 车辆识别代码VIN码'
      title: OpenProductReportUsedCar
      x-apifox-orders:
        - report_url
        - driving_license_info
        - driving_license_car_photo
        - business_license_front
        - car_function
        - car_vin
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    game:
      type: object
      properties:
        title:
          type: string
          title: 报告标题
          examples:
            - 怪物猎人
        platform:
          type: string
          title: 游戏平台
          examples:
            - PS5
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 符合
        images: *ref_3
      required:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      title: 游戏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    jewelry:
      type: object
      properties:
        shape:
          type: string
          title: 形状
          examples:
            - 圆形
        color:
          type: string
          title: 颜色
          examples:
            - 白色
        weight:
          type: string
          title: 重量
          examples:
            - 125g
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - xx平台
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 无瑕疵
        images: *ref_3
      required:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 珠宝信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    curio:
      type: object
      properties:
        size:
          type: string
          title: 尺寸
          examples:
            - 12mmx14mm
        material:
          type: string
          title: 材料
          examples:
            - 陶瓷
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 191
            - 192
            - 193
            - 194
            - 195
            - 196
            - 197
            - 198
            - 199
            - 1910
            - 1911
            - 1912
          examples:
            - 191
          description: |-
            枚举值：
            191 : NGC评级
            192 : PMG评级
            193 : 公博评级
            194 : PCGS评级
            195 : 众诚评级
            196 : 保粹评级
            197 : 华夏评级
            198 : 爱藏评级
            199 : 华龙盛世
            1910 : 国鉴鉴定
            1911 : 信泰评级
            1912 : 闻德评级
          x-apifox-enum:
            - value: 191
              name: ''
              description: NGC评级
            - value: 192
              name: ''
              description: PMG评级
            - value: 193
              name: ''
              description: 公博评级
            - value: 194
              name: ''
              description: PCGS评级
            - value: 195
              name: ''
              description: 众诚评级
            - value: 196
              name: ''
              description: 保粹评级
            - value: 197
              name: ''
              description: 华夏评级
            - value: 198
              name: ''
              description: 爱藏评级
            - value: 199
              name: ''
              description: 华龙盛世
            - value: 1910
              name: ''
              description: 国鉴鉴定
            - value: 1911
              name: ''
              description: 信泰评级
            - value: 1912
              name: ''
              description: 闻德评级
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - NGC评级
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        images: *ref_3
      required:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      x-apifox-orders:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      title: 文玩信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    beauty_makeup:
      type: object
      properties:
        brand:
          type: string
          title: 品牌
          examples:
            - 欧莱雅
        spec:
          type: string
          title: 规格
          examples:
            - 小瓶装
        level:
          type: string
          title: 成色
          examples:
            - 全新
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 181
            - 182
          examples:
            - 181
          description: |-
            枚举值：
            181 : 维鉴
            182 : 中检科深
          x-apifox-enum:
            - value: 181
              name: ''
              description: 维鉴
            - value: 182
              name: ''
              description: 中检科深
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 维鉴
        images: *ref_3
      required:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      x-apifox-orders:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      title: 美妆信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    food_data:
      type: object
      properties:
        brand:
          type: string
          title: 食品品牌
          minLength: 1
          maxLength: 30
          examples:
            - 旺旺
        spec:
          type: string
          title: 食品规格
          minLength: 1
          maxLength: 30
          examples:
            - 大包
        pack:
          type: string
          title: 食品包装
          minLength: 1
          maxLength: 10
          examples:
            - 袋装
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 食品有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 食品生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
            address:
              type: object
              properties:
                detail:
                  type: string
                  title: 详细地址
                  minLength: 1
                  maxLength: 60
                province:
                  type: integer
                  title: 生产地省份ID
                  format: int32
                  examples:
                    - 110000
                city:
                  type: integer
                  title: 生产地城市ID
                  format: int32
                  examples:
                    - 110100
                district:
                  type: integer
                  title: 生产地地区ID
                  format: int32
                  examples:
                    - 110101
              required:
                - detail
                - province
                - city
                - district
              x-apifox-orders:
                - detail
                - province
                - city
                - district
              title: 食品生产地信息
              x-apifox-ignore-properties: []
          required:
            - date
            - address
          x-apifox-orders:
            - date
            - address
          title: 食品生产信息
          x-apifox-ignore-properties: []
      required:
        - brand
        - spec
        - pack
        - expire
        - production
      x-apifox-orders:
        - brand
        - spec
        - pack
        - expire
        - production
      title: 食品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    book_data:
      type: object
      properties:
        isbn:
          type: string
          title: 图书ISBN码
          pattern: /^\(\(?:[0-9]{9}X|[0-9]{10}\)|\(?:\(?:97\(?:8|9\)\)[0-9]{10}\)\)$/
          additionalProperties: false
          examples:
            - '9787505720176'
        title:
          type: string
          title: 图书标题
          additionalProperties: false
          examples:
            - 北京法源寺
        author:
          type: string
          title: 图书作者
          additionalProperties: false
          examples:
            - 李敖
          minLength: 1
          maxLength: 30
        publisher:
          type: string
          title: 图书出版社
          additionalProperties: false
          examples:
            - 中国友谊出版公司
          minLength: 1
          maxLength: 30
      required:
        - isbn
        - title
      x-apifox-orders:
        - isbn
        - title
        - author
        - publisher
      title: 图书信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    publish_shop:
      type: object
      properties:
        user_name:
          type: string
          title: 闲鱼会员名
          examples:
            - tb924343042
        province:
          type: integer
          title: 商品发货省份
          format: int32
          examples:
            - 110000
        city:
          type: integer
          title: 商品发货城市
          format: int32
          examples:
            - 110100
        district:
          type: integer
          title: 商品发货地区
          format: int32
          examples:
            - 110101
        title:
          type: string
          title: 商品标题
          description: 注意：一个中文按2个字符算
          minLength: 1
          examples:
            - iPhone 12 128G 黑色
          maxLength: 60
        content:
          type: string
          title: 商品描述
          description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\\n换行
          minLength: 5
          maxLength: 5000
          examples:
            - iPhone 12 128G 黑色 8新，非诚勿扰~~
        images: *ref_3
        white_images:
          type: string
          title: 商品白底图URL
          examples:
            - https://xxx.com/xxx1.jpg
          description: |-
            注意 ：
            1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
            2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
        service_support: *ref_5
      x-apifox-orders:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
        - white_images
        - service_support
      required:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
      title: 店铺发布信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接
        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
    images1:
      type: array
      items:
        type: string
        examples:
          - https://xxx.com/xxx1.jpg
      title: 图片信息
      minItems: 1
      maxItems: 30
      uniqueItems: true
      x-apifox-folder: ''
    publish_status:
      type: integer
      title: 发布状态
      description: |-
        枚举值：
        -1：不可操作（不可上架/编辑）
        1：草稿箱（可编辑/删除）
        2：待发布（可上架/编辑/删除）
        3：销售中（可下架/编辑）
        4：已下架（可上架/编辑/删除）
        5：已售罄（可上架/编辑/删除）
        9：商品异常（可编辑/删除）
      enum:
        - -1
        - 1
        - 2
        - 3
        - 4
        - 5
        - 9
      format: int32
      examples:
        - 2
      x-apifox-enum:
        - value: -1
          name: ''
          description: 不可操作
        - value: 1
          name: ''
          description: 草稿箱
        - value: 2
          name: ''
          description: 待发布
        - value: 3
          name: ''
          description: 销售中
        - value: 4
          name: ''
          description: 已下架
        - value: 5
          name: ''
          description: 已售罄
        - value: 9
          name: ''
          description: 商品异常
      x-apifox-folder: ''
    stuff_status:
      type: integer
      title: 商品成色
      description: |-
        枚举值：
        0 : 无成色（普通商品可用）
        100 : 全新
         -1 : 准新 
        99 : 99新 
        95 : 95新 
        90 : 9新 
        80 : 8新 
        70 : 7新 
        60 : 6新 
        50 : 5新 
        -仅品牌捡漏类型可用-
        40 : 未使用·中度瑕疵
        30 : 未使用·轻微瑕疵
        20 : 未使用·仅拆封
        10 : 未使用·准新
        100 : 全新未使用
        -仅品牌捡漏类型可用-
        及以下注意：非普通商品类型时必填~~
      format: int32
      enum:
        - 100
        - -1
        - 99
        - 95
        - 90
        - 80
        - 70
        - 60
        - 50
        - 40
        - 30
        - 20
        - 10
        - 0
      default: 0
      examples:
        - 100
      x-apifox-enum:
        - value: 100
          name: ''
          description: 全新
        - value: -1
          name: ''
          description: 准新
        - value: 99
          name: ''
          description: 99新
        - value: 95
          name: ''
          description: 95新
        - value: 90
          name: ''
          description: 9新
        - value: 80
          name: ''
          description: 8新
        - value: 70
          name: ''
          description: 7新
        - value: 60
          name: ''
          description: 6新
        - value: 50
          name: ''
          description: 5新及以下
        - value: 40
          name: ''
          description: 未使用·中度瑕疵
        - value: 30
          name: ''
          description: 未使用·轻微瑕疵
        - value: 20
          name: ''
          description: 未使用·仅拆封
        - value: 10
          name: ''
          description: 未使用·准新
        - value: 0
          name: ''
          description: 无
      x-apifox-folder: ''
    express_fee:
      type: integer
      title: 运费
      format: int64
      x-apifox-folder: ''
    original_price:
      type: integer
      title: 商品原价
      minimum: 0
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    channel_pv:
      type: array
      items:
        type: object
        properties:
          property_id:
            type: string
            title: 属性ID
            examples:
              - 83b8f62c43df34e6
          property_name:
            type: string
            title: 属性名称
            examples:
              - 品牌
          value_id:
            type: string
            title: 属性值ID
            examples:
              - 76f78d92eeb4f5f6eccf7d4fabef47b6
          value_name:
            type: string
            title: 属性值名称
            examples:
              - Apple/苹果
        x-apifox-orders:
          - property_id
          - property_name
          - value_id
          - value_name
        required:
          - property_id
          - property_name
          - value_id
          - value_name
        x-apifox-ignore-properties: []
      title: 商品属性
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    product_status:
      type: integer
      title: 商品状态
      description: '枚举值：-1 : 已删除21 : 待发布22 : 销售中23 : 已售罄31 : 手动下架33 : 售出下架36 : 自动下架'
      format: int32
      enum:
        - -1
        - 21
        - 22
        - 23
        - 31
        - 33
        - 36
      default: 0
      examples:
        - 21
      x-apifox-enum:
        - value: -1
          name: ''
          description: 删除
        - value: 21
          name: ''
          description: 待发布
        - value: 22
          name: ''
          description: 销售中
        - value: 23
          name: ''
          description: 已售罄
        - value: 31
          name: ''
          description: 手动下架
        - value: 33
          name: ''
          description: 售出下架
        - value: 36
          name: ''
          description: 自动下架
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 创建商品（单个）

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/create:
    post:
      summary: 创建商品（单个）
      deprecated: false
      description: |
        注意事项：
        item_biz_type、sp_biz_type、channel_cat_id 存在依赖关系，务必传入正确
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item_biz_type:
                  title: 商品类型
                  $ref: '#/components/schemas/item_biz_type'
                sp_biz_type:
                  title: 商品行业
                  $ref: '#/components/schemas/sp_biz_type'
                channel_cat_id:
                  type: string
                  title: 商品类目ID
                  examples:
                    - e11455b218c06e7ae10cfa39bf43dc0f
                  description: 通过`查询商品类目`接口获取类目参数
                channel_pv:
                  title: 商品属性
                  $ref: '#/components/schemas/channel_pv'
                  description: 通过`查询商品属性`接口获取属性参数
                price: &ref_4
                  title: 商品售价（分）
                  $ref: '#/components/schemas/price'
                  description: 注意：多规格商品时，必须是SKU其中一个金额
                original_price:
                  title: 商品原价（分）
                  $ref: '#/components/schemas/original_price'
                  description: 注意：当商品类型是特卖类型，即`item_biz_type`=24时，`original_price`为必填
                express_fee:
                  title: 运费（分）
                  $ref: '#/components/schemas/express_fee'
                stock:
                  type: integer
                  title: 商品库存
                  minimum: 1
                  maximum: 399960
                  format: int32
                  examples:
                    - 1
                outer_id:
                  type: string
                  title: 商家编码
                  minLength: 1
                  maxLength: 64
                  examples:
                    - '317837811'
                  description: 注意：一个中文按2个字符算
                stuff_status:
                  title: 商品成色
                  $ref: '#/components/schemas/stuff_status'
                publish_shop:
                  type: array
                  items:
                    type: object
                    x-apifox-refs:
                      01JB46QMHGRRVZM00EXGGJ5GQT:
                        $ref: '#/components/schemas/publish_shop'
                        x-apifox-overrides:
                          content: &ref_0
                            type: string
                            title: 商品描述
                            description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\n换行
                            minLength: 5
                            maxLength: 5000
                            examples:
                              - iPhone 12 128G 黑色 8新，非诚勿扰~~
                        required:
                          - content
                    x-apifox-orders:
                      - 01JB46QMHGRRVZM00EXGGJ5GQT
                    properties:
                      user_name:
                        type: string
                        title: 闲鱼会员名
                        examples:
                          - tb924343042
                      province:
                        type: integer
                        title: 商品发货省份
                        format: int32
                        examples:
                          - 110000
                      city:
                        type: integer
                        title: 商品发货城市
                        format: int32
                        examples:
                          - 110100
                      district:
                        type: integer
                        title: 商品发货地区
                        format: int32
                        examples:
                          - 110101
                      title:
                        type: string
                        title: 商品标题
                        description: 注意：一个中文按2个字符算
                        minLength: 1
                        examples:
                          - iPhone 12 128G 黑色
                        maxLength: 60
                      content: *ref_0
                      images: &ref_3
                        title: 商品图片URL
                        description: 注意：第1张作为商品主图，前9张发布到闲鱼App
                        $ref: '#/components/schemas/images1'
                      white_images:
                        type: string
                        title: 商品白底图URL
                        examples:
                          - https://xxx.com/xxx1.jpg
                        description: |-
                          注意 ：
                          1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
                          2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
                      service_support: &ref_5
                        title: 商品服务
                        $ref: '#/components/schemas/service_support'
                    required:
                      - user_name
                      - province
                      - city
                      - district
                      - title
                      - content
                      - images
                    x-apifox-ignore-properties:
                      - user_name
                      - province
                      - city
                      - district
                      - title
                      - content
                      - images
                      - white_images
                      - service_support
                  title: 发布店铺
                sku_items:
                  type: array
                  items:
                    $ref: '#/components/schemas/sku_items'
                  title: 商品多规格信息
                book_data:
                  title: 图书信息
                  $ref: '#/components/schemas/book_data'
                food_data:
                  title: 食品信息
                  $ref: '#/components/schemas/food_data'
                report_data:
                  title: 验货报告信息
                  $ref: '#/components/schemas/report_data'
                  description: 注意：已验货类型的商品按需必填
                flash_sale_type:
                  $ref: '#/components/schemas/flash_sale_type'
                  title: 闲鱼特卖类型
                advent_data:
                  $ref: '#/components/schemas/advent_data'
                  title: 闲鱼特卖信息
                  description: 闲鱼特卖类型为临期非食品行业时必传
                inspect_data:
                  $ref: >-
                    #/components/schemas/%E9%AA%8C%E8%B4%A7%E5%AE%9D%E4%BF%A1%E6%81%AF
                  title: 验货宝信息
                  description: 商品类型为验货宝时必传
                brand_data:
                  $ref: '#/components/schemas/brand_data'
                  title: 品牌捡漏信息
                detail_images: &ref_2
                  $ref: '#/components/schemas/images'
                  title: 详情图片
                sku_images:
                  $ref: '#/components/schemas/sku_images'
                  title: 规格图片
                ship_region_data:
                  $ref: >-
                    #/components/schemas/%E8%B7%A8%E5%A2%83%E5%8F%91%E8%B4%A7%E5%9C%B0%E5%8C%BA
                is_tax_included:
                  type: boolean
                  title: 是否包含税费
                  description: 目前仅用于跨境商品
              required:
                - item_biz_type
                - sp_biz_type
                - channel_cat_id
                - price
                - express_fee
                - stock
                - publish_shop
              x-apifox-orders:
                - item_biz_type
                - sp_biz_type
                - channel_cat_id
                - channel_pv
                - price
                - original_price
                - express_fee
                - stock
                - outer_id
                - stuff_status
                - publish_shop
                - sku_items
                - book_data
                - food_data
                - report_data
                - flash_sale_type
                - advent_data
                - inspect_data
                - brand_data
                - detail_images
                - sku_images
                - ship_region_data
                - is_tax_included
              x-apifox-refs: {}
              x-apifox-ignore-properties: []
            example:
              item_biz_type: 2
              sp_biz_type: 1
              channel_cat_id: e11455b218c06e7ae10cfa39bf43dc0f
              channel_pv:
                - property_id: b5e5462c028aba7f1921b9e373cead75
                  property_name: 交易形式
                  value_id: 8a3445658e0bc44687b43d68bdc44732
                  value_name: 代下单
                - property_id: 96ad8793a2fdb81bb108d382c4e6ea42
                  property_name: 面值
                  value_id: 38ed5f6522cd7ab6
                  value_name: 100元
              price: 550000
              original_price: 700000
              express_fee: 10
              stock: 10
              outer_id: '2021110112345'
              stuff_status: 100
              publish_shop:
                - images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                  user_name: 闲鱼会员名
                  province: 130000
                  city: 130100
                  district: 130101
                  title: 商品标题
                  content: 商品描述。
                  service_support: SDR
              sku_items:
                - price: 500000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:白色;容量:128G
                - price: 600000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:白色;容量:256G
                - price: 500000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:黑色;容量:128G
                - price: 600000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:黑色;容量:256G
              book_data:
                title: 北京法源寺
                author: 李敖
                publisher: 中国友谊出版公司
                isbn: '9787505720176'
              food_data:
                pack: 罐装
                spec: '150'
                brand: 伏特加伏特加
                expire:
                  num: 360
                  unit: 天
                production:
                  date: '2021-11-29'
                  address:
                    detail: 北京市东城区x街道
                    province: 130000
                    city: 130100
                    district: 130101
              report_data:
                used_car:
                  report_url: https://xxxxxx.com
                beauty_makeup:
                  org_id: 181
                  brand: 欧莱雅
                  spec: 小瓶装
                  level: 全新
                  org_name: 哈哈哈
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                game:
                  qc_no: '123123'
                  qc_desc: 符合
                  title: 测试游戏
                  platform: 小霸王
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                curio:
                  org_id: 191
                  org_name: NGC评级
                  size: 12mmx14mm
                  material: 陶瓷
                  qc_no: '3131319'
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                jewelry:
                  org_name: 某某平台
                  shape: 圆形
                  color: 白色
                  weight: 125g
                  qc_no: '3131319'
                  qc_desc: 无瑕疵
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                valuable:
                  org_id: 162
                  org_name: 国检
                  qc_no: '454545'
                  qc_desc: 经检测符合制造商公示的制作工艺
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                yx_3c:
                  class_id: 10
                  subclass_id: 1001
                  brand_id: 10000
                  brand_name: 苹果
                  model_id: 10011
                  model_name: iPhone 14 Pro
                  model_sn: IMEI/序列号
                  report_user: 张胜男
                  report_time: '2024-03-15 18:04:44'
                  report_items:
                    - answer_id: 11103
                      answer_name: 不开机
                      answer_type: 2
                      category_name: 拆修侵液
                      group_name: 系统情况
                      question_name: 系统情况
                  answer_ids:
                    - 11103
                    - 11106
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5S9N3YCZKWMJ7EXY4R6KAY4:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_1
                        type: object
                        properties:
                          product_id:
                            type: integer
                            title: 管家商品ID
                            format: int64
                            examples:
                              - 219530767978565
                          product_status:
                            type: integer
                            title: 管家商品状态
                            examples:
                              - 21
                        required:
                          - product_id
                          - product_status
                        x-apifox-orders:
                          - product_id
                          - product_status
                        x-apifox-ignore-properties: []
                    required:
                      - data
                x-apifox-orders:
                  - 01H5S9N3YCZKWMJ7EXY4R6KAY4
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_1
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586377-run
components:
  schemas:
    跨境发货地区:
      type: object
      properties:
        region_name:
          type: string
          title: 地区名称
          examples:
            - 香港
        region_code:
          type: string
          title: 地区代码
          examples:
            - HKG
          enum:
            - HKG
            - JPN
          x-apifox-enum:
            - value: HKG
              name: 香港
              description: ''
            - value: JPN
              name: 日本
              description: ''
          description: 注意：目前仅支持香港/日本跨境商品
      x-apifox-orders:
        - region_name
        - region_code
      required:
        - region_name
        - region_code
      description: |
        目前仅用于跨境商品（必填）
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
          sku_text:
            type: string
            title: 规格属性
            examples:
              - 颜色:黑色
        x-apifox-orders:
          - src
          - width
          - height
          - sku_text
        required:
          - src
          - width
          - height
          - sku_text
        x-apifox-ignore-properties: []
      title: 规格图片
      x-apifox-folder: ''
    images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
        x-apifox-orders:
          - src
          - width
          - height
        required:
          - src
          - width
          - height
        x-apifox-ignore-properties: []
      title: 新图片信息
      x-apifox-folder: ''
    brand_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
        supplier:
          type: string
          title: 供应商名称
        images: *ref_2
      x-apifox-orders:
        - expire
        - production
        - supplier
        - images
      title: 品牌捡漏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    验货宝信息:
      type: object
      properties:
        trade_rule:
          type: string
          title: 交易规则
          enum:
            - yhbOptional
            - yhbOnly
          examples:
            - yhbOptional
          x-apifox-enum:
            - value: yhbOptional
              name: ''
              description: 买家可选是否走验货宝
            - value: yhbOnly
              name: ''
              description: 买家必须走验货宝
        assume_rule:
          type: string
          title: 验货费规则
          enum:
            - buyer
            - seller
          examples:
            - buyer
          x-apifox-enum:
            - value: buyer
              name: ''
              description: 买家承担验货费
            - value: seller
              name: ''
              description: 卖家承担验货费
      required:
        - trade_rule
        - assume_rule
      x-apifox-orders:
        - trade_rule
        - assume_rule
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    advent_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
      required:
        - expire
        - production
      x-apifox-orders:
        - expire
        - production
      title: 闲鱼特卖信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    flash_sale_type:
      type: integer
      title: 闲鱼特卖类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 99
        - 2601
        - 2602
        - 2603
        - 2604
      examples:
        - 1
      x-apifox-enum:
        - name: ''
          value: 1
          description: 临期
        - name: ''
          value: 2
          description: 孤品
        - name: ''
          value: 3
          description: 断码
        - name: ''
          value: 4
          description: 微瑕
        - name: ''
          value: 5
          description: 尾货
        - name: ''
          value: 6
          description: 官翻
        - name: ''
          value: 7
          description: 全新
        - name: ''
          value: 8
          description: 福袋
        - name: ''
          value: 99
          description: 其他
        - name: ''
          value: 2601
          description: 微瑕
        - name: ''
          value: 2602
          description: 临期
        - name: ''
          value: 2603
          description: 清仓
        - name: ''
          value: 2604
          description: 官翻
      description: |-
        枚举值：
        -仅闲鱼特卖类型可用-
        1 : 临期
        2 : 孤品
        3 : 断码
        4 : 微瑕
        5 : 尾货
        6 : 官翻
        7 : 全新
        8 : 福袋
        99 : 其他
        -仅闲鱼特卖类型可用-

        -仅品牌捡漏类型可用-
        2601 : 微瑕
        2602 : 临期
        2603 : 清仓
        2604 : 官翻
        -仅品牌捡漏类型可用-
      x-apifox-folder: ''
    report_data:
      type: object
      properties:
        beauty_makeup:
          title: 美妆信息
          $ref: '#/components/schemas/beauty_makeup'
        curio:
          title: 文玩信息
          $ref: '#/components/schemas/curio'
        jewelry:
          title: 珠宝信息
          $ref: '#/components/schemas/jewelry'
        game:
          title: 游戏信息
          $ref: '#/components/schemas/game'
        used_car:
          title: 二手车信息
          $ref: '#/components/schemas/used_car'
        valuable:
          title: 奢品信息
          $ref: '#/components/schemas/valuable'
        yx_3c:
          $ref: '#/components/schemas/%E4%B8%A5%E9%80%893c%E4%BF%A1%E6%81%AF'
      x-apifox-orders:
        - beauty_makeup
        - curio
        - jewelry
        - game
        - used_car
        - valuable
        - yx_3c
      title: 验货报告信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    严选3c信息:
      type: object
      properties:
        class_id:
          type: integer
          title: 品类ID
        subclass_id:
          type: integer
          title: 子类ID
        brand_id:
          type: integer
          title: 品牌ID
        brand_name:
          type: string
          title: 品牌名称
        model_id:
          type: integer
          title: 机型ID
        model_name:
          type: string
          title: 机型名称
        model_sn:
          type: string
          title: IMEI/序列号
        report_user:
          type: string
          title: 质检人
          description: 体现在商品验货报告页
        report_time:
          type: string
          title: 质检时间
          description: 体现在商品验货报告页
        report_items:
          type: array
          items:
            type: object
            properties:
              answer_id:
                type: integer
                format: int32
                title: 选项ID
              answer_name:
                type: string
                title: 选项名称
              answer_type:
                type: integer
                title: 选项类型
                enum:
                  - 0
                  - 1
                  - 2
                examples:
                  - 1
                format: int32
                x-apifox-enum:
                  - value: 0
                    name: ''
                    description: 普通项
                  - value: 1
                    name: ''
                    description: 正常项
                  - value: 2
                    name: ''
                    description: 异常项
              answer_desc:
                type: string
                title: 选项描述
              question_name:
                type: string
                title: 问题名称
              category_name:
                type: string
                title: 分类名称
              group_name:
                type: string
                title: 分组名称
            x-apifox-orders:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            required:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            x-apifox-ignore-properties: []
          title: 质检报告项
          description: 体现在商品验货报告页
        answer_ids:
          type: array
          items:
            type: integer
          title: 质检选项ID
          description: 内部存储，不对外展示
      required:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-orders:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    valuable:
      type: object
      properties:
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 161
            - 162
            - 163
            - 164
          examples:
            - 161
          description: |-
            枚举值：
            161 : 中检
            162 : 国检
            163 : 华测
            164 : 中溯
          x-apifox-enum:
            - value: 161
              name: ''
              description: 中检
            - value: 162
              name: ''
              description: 国检
            - value: 163
              name: ''
              description: 华测
            - value: 164
              name: ''
              description: 中溯
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 中检
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
        images: *ref_3
      required:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 奢品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    used_car:
      type: object
      properties:
        report_url:
          type: string
          description: ' 验货报告链接'
        driving_license_info:
          type: string
          description: ' 行驶证主页图片'
        driving_license_car_photo:
          type: string
          description: ' 行驶证车辆页图片'
        business_license_front:
          type: string
          description: ' 营业执照图片'
        car_function:
          type: string
          description: ' 使用性质 : 营运/非营运'
        car_vin:
          type: string
          description: ' 车辆识别代码VIN码'
      title: OpenProductReportUsedCar
      x-apifox-orders:
        - report_url
        - driving_license_info
        - driving_license_car_photo
        - business_license_front
        - car_function
        - car_vin
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    game:
      type: object
      properties:
        title:
          type: string
          title: 报告标题
          examples:
            - 怪物猎人
        platform:
          type: string
          title: 游戏平台
          examples:
            - PS5
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 符合
        images: *ref_3
      required:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      title: 游戏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    jewelry:
      type: object
      properties:
        shape:
          type: string
          title: 形状
          examples:
            - 圆形
        color:
          type: string
          title: 颜色
          examples:
            - 白色
        weight:
          type: string
          title: 重量
          examples:
            - 125g
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - xx平台
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 无瑕疵
        images: *ref_3
      required:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 珠宝信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    curio:
      type: object
      properties:
        size:
          type: string
          title: 尺寸
          examples:
            - 12mmx14mm
        material:
          type: string
          title: 材料
          examples:
            - 陶瓷
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 191
            - 192
            - 193
            - 194
            - 195
            - 196
            - 197
            - 198
            - 199
            - 1910
            - 1911
            - 1912
          examples:
            - 191
          description: |-
            枚举值：
            191 : NGC评级
            192 : PMG评级
            193 : 公博评级
            194 : PCGS评级
            195 : 众诚评级
            196 : 保粹评级
            197 : 华夏评级
            198 : 爱藏评级
            199 : 华龙盛世
            1910 : 国鉴鉴定
            1911 : 信泰评级
            1912 : 闻德评级
          x-apifox-enum:
            - value: 191
              name: ''
              description: NGC评级
            - value: 192
              name: ''
              description: PMG评级
            - value: 193
              name: ''
              description: 公博评级
            - value: 194
              name: ''
              description: PCGS评级
            - value: 195
              name: ''
              description: 众诚评级
            - value: 196
              name: ''
              description: 保粹评级
            - value: 197
              name: ''
              description: 华夏评级
            - value: 198
              name: ''
              description: 爱藏评级
            - value: 199
              name: ''
              description: 华龙盛世
            - value: 1910
              name: ''
              description: 国鉴鉴定
            - value: 1911
              name: ''
              description: 信泰评级
            - value: 1912
              name: ''
              description: 闻德评级
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - NGC评级
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        images: *ref_3
      required:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      x-apifox-orders:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      title: 文玩信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    beauty_makeup:
      type: object
      properties:
        brand:
          type: string
          title: 品牌
          examples:
            - 欧莱雅
        spec:
          type: string
          title: 规格
          examples:
            - 小瓶装
        level:
          type: string
          title: 成色
          examples:
            - 全新
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 181
            - 182
          examples:
            - 181
          description: |-
            枚举值：
            181 : 维鉴
            182 : 中检科深
          x-apifox-enum:
            - value: 181
              name: ''
              description: 维鉴
            - value: 182
              name: ''
              description: 中检科深
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 维鉴
        images: *ref_3
      required:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      x-apifox-orders:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      title: 美妆信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    food_data:
      type: object
      properties:
        brand:
          type: string
          title: 食品品牌
          minLength: 1
          maxLength: 30
          examples:
            - 旺旺
        spec:
          type: string
          title: 食品规格
          minLength: 1
          maxLength: 30
          examples:
            - 大包
        pack:
          type: string
          title: 食品包装
          minLength: 1
          maxLength: 10
          examples:
            - 袋装
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 食品有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 食品生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
            address:
              type: object
              properties:
                detail:
                  type: string
                  title: 详细地址
                  minLength: 1
                  maxLength: 60
                province:
                  type: integer
                  title: 生产地省份ID
                  format: int32
                  examples:
                    - 110000
                city:
                  type: integer
                  title: 生产地城市ID
                  format: int32
                  examples:
                    - 110100
                district:
                  type: integer
                  title: 生产地地区ID
                  format: int32
                  examples:
                    - 110101
              required:
                - detail
                - province
                - city
                - district
              x-apifox-orders:
                - detail
                - province
                - city
                - district
              title: 食品生产地信息
              x-apifox-ignore-properties: []
          required:
            - date
            - address
          x-apifox-orders:
            - date
            - address
          title: 食品生产信息
          x-apifox-ignore-properties: []
      required:
        - brand
        - spec
        - pack
        - expire
        - production
      x-apifox-orders:
        - brand
        - spec
        - pack
        - expire
        - production
      title: 食品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    book_data:
      type: object
      properties:
        isbn:
          type: string
          title: 图书ISBN码
          pattern: /^((?:[0-9]{9}X|[0-9]{10})|(?:(?:97(?:8|9))[0-9]{10}))$/
          additionalProperties: false
          examples:
            - '9787505720176'
        title:
          type: string
          title: 图书标题
          additionalProperties: false
          examples:
            - 北京法源寺
        author:
          type: string
          title: 图书作者
          additionalProperties: false
          examples:
            - 李敖
          minLength: 1
          maxLength: 30
        publisher:
          type: string
          title: 图书出版社
          additionalProperties: false
          examples:
            - 中国友谊出版公司
          minLength: 1
          maxLength: 30
      required:
        - isbn
        - title
      x-apifox-orders:
        - isbn
        - title
        - author
        - publisher
      title: 图书信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_items:
      type: object
      properties:
        price: *ref_4
        stock:
          type: integer
          title: SKU库存
          maximum: 9999
          format: int32
          minimum: 0
          examples:
            - 10
        sku_text:
          type: string
          title: SKU规格
          examples:
            - 颜色:黑色;内存:512G
          description: |-
            格式：规格:属性，多个时使用";"拼接
            示例：颜色:白色;容量:128G
            限制：规格名称最多4个字，属性名称最多 20 个字（不分区中英文）
        outer_id:
          type: string
          title: SKU商品编码
          examples:
            - '2023072101'
          minLength: 0
          maxLength: 64
          description: 注意：一个中文按2个字符算
      x-apifox-orders:
        - price
        - stock
        - sku_text
        - outer_id
      required:
        - price
        - stock
        - sku_text
      title: SKU信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接

        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
    images1:
      type: array
      items:
        type: string
        examples:
          - https://xxx.com/xxx1.jpg
      title: 图片信息
      minItems: 1
      maxItems: 30
      uniqueItems: true
      x-apifox-folder: ''
    publish_shop:
      type: object
      properties:
        user_name:
          type: string
          title: 闲鱼会员名
          examples:
            - tb924343042
        province:
          type: integer
          title: 商品发货省份
          format: int32
          examples:
            - 110000
        city:
          type: integer
          title: 商品发货城市
          format: int32
          examples:
            - 110100
        district:
          type: integer
          title: 商品发货地区
          format: int32
          examples:
            - 110101
        title:
          type: string
          title: 商品标题
          description: 注意：一个中文按2个字符算
          minLength: 1
          examples:
            - iPhone 12 128G 黑色
          maxLength: 60
        content:
          type: string
          title: 商品描述
          description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\n换行
          minLength: 5
          maxLength: 5000
          examples:
            - iPhone 12 128G 黑色 8新，非诚勿扰~~
        images: *ref_3
        white_images:
          type: string
          title: 商品白底图URL
          examples:
            - https://xxx.com/xxx1.jpg
          description: |-
            注意 ：
            1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
            2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
        service_support: *ref_5
      x-apifox-orders:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
        - white_images
        - service_support
      required:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
      title: 店铺发布信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    stuff_status:
      type: integer
      title: 商品成色
      description: |-
        枚举值：
        0 : 无成色（普通商品可用）
        100 : 全新
         -1 : 准新 
        99 : 99新 
        95 : 95新 
        90 : 9新 
        80 : 8新 
        70 : 7新 
        60 : 6新 
        50 : 5新 

        -仅品牌捡漏类型可用-
        40 : 未使用·中度瑕疵
        30 : 未使用·轻微瑕疵
        20 : 未使用·仅拆封
        10 : 未使用·准新
        100 : 全新未使用
        -仅品牌捡漏类型可用-

        及以下注意：非普通商品类型时必填~~
      format: int32
      enum:
        - 100
        - -1
        - 99
        - 95
        - 90
        - 80
        - 70
        - 60
        - 50
        - 40
        - 30
        - 20
        - 10
        - 0
      default: 0
      examples:
        - 100
      x-apifox-enum:
        - value: 100
          name: ''
          description: 全新
        - value: -1
          name: ''
          description: 准新
        - value: 99
          name: ''
          description: 99新
        - value: 95
          name: ''
          description: 95新
        - value: 90
          name: ''
          description: 9新
        - value: 80
          name: ''
          description: 8新
        - value: 70
          name: ''
          description: 7新
        - value: 60
          name: ''
          description: 6新
        - value: 50
          name: ''
          description: 5新及以下
        - value: 40
          name: ''
          description: 未使用·中度瑕疵
        - value: 30
          name: ''
          description: 未使用·轻微瑕疵
        - value: 20
          name: ''
          description: 未使用·仅拆封
        - value: 10
          name: ''
          description: 未使用·准新
        - value: 0
          name: ''
          description: 无
      x-apifox-folder: ''
    express_fee:
      type: integer
      title: 运费
      format: int64
      x-apifox-folder: ''
    original_price:
      type: integer
      title: 商品原价
      minimum: 0
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    channel_pv:
      type: array
      items:
        type: object
        properties:
          property_id:
            type: string
            title: 属性ID
            examples:
              - 83b8f62c43df34e6
          property_name:
            type: string
            title: 属性名称
            examples:
              - 品牌
          value_id:
            type: string
            title: 属性值ID
            examples:
              - 76f78d92eeb4f5f6eccf7d4fabef47b6
          value_name:
            type: string
            title: 属性值名称
            examples:
              - Apple/苹果
        x-apifox-orders:
          - property_id
          - property_name
          - value_id
          - value_name
        required:
          - property_id
          - property_name
          - value_id
          - value_name
        x-apifox-ignore-properties: []
      title: 商品属性
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 创建商品（批量）

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/batchCreate:
    post:
      summary: 创建商品（批量）
      deprecated: false
      description: |-
        注意事项：
        1：字段参数要求与单个创建商品一致
        2：每批次最多创建50个商品
        3：同批次时item_key字段值要唯一
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_data:
                  type: array
                  items:
                    type: object
                    properties:
                      item_key:
                        type: string
                        title: 批次商品KEY
                        examples:
                          - product-1
                          - product-2
                        description: 原样返回，用于匹配商家自己的商品
                      item_biz_type:
                        title: 商品类型ID
                        $ref: '#/components/schemas/item_biz_type'
                      sp_biz_type:
                        title: 商品分类ID
                        $ref: '#/components/schemas/sp_biz_type'
                      channel_cat_id:
                        type: string
                        title: 商品类目ID
                        examples:
                          - e11455b218c06e7ae10cfa39bf43dc0f
                        description: 通过`查询商品类目`接口获取类目参数
                      channel_pv:
                        title: 商品属性
                        $ref: '#/components/schemas/channel_pv'
                        description: 通过`查询商品属性`接口获取属性参数
                      price: &ref_3
                        title: 商品售价（分）
                        $ref: '#/components/schemas/price'
                        description: 注意：多规格商品时，必须是SKU其中一个金额
                      original_price:
                        title: 商品原价（分）
                        $ref: '#/components/schemas/original_price'
                      express_fee:
                        title: 运费（分）
                        $ref: '#/components/schemas/express_fee'
                      stock:
                        type: integer
                        title: 商品库存
                        minimum: 1
                        maximum: 399960
                        format: int32
                        examples:
                          - 1
                        description: 注意：多规格商品，必须是SKU库存的合计
                      outer_id:
                        type: string
                        title: 商家编码
                        minLength: 1
                        maxLength: 64
                        examples:
                          - '317837811'
                      stuff_status:
                        title: 商品成色
                        $ref: '#/components/schemas/stuff_status'
                      publish_shop:
                        type: array
                        items:
                          $ref: '#/components/schemas/publish_shop'
                        title: 发布店铺
                      bid_data:
                        title: 拍卖信息
                        $ref: '#/components/schemas/bid_data'
                      sku_items:
                        type: array
                        items:
                          $ref: '#/components/schemas/sku_items'
                        title: 商品多规格信息
                      book_data:
                        title: 图书信息
                        $ref: '#/components/schemas/book_data'
                      food_data:
                        title: 食品信息
                        $ref: '#/components/schemas/food_data'
                      report_data:
                        title: 验货报告信息
                        $ref: '#/components/schemas/report_data'
                        description: 注意：已验货类型的商品按需必填
                      flash_sale_type:
                        $ref: '#/components/schemas/flash_sale_type'
                        title: 闲鱼特卖类型
                      advent_data:
                        $ref: '#/components/schemas/advent_data'
                        title: 闲鱼特卖信息
                        description: 闲鱼特卖类型为临期非食品行业时必传
                      inspect_data:
                        $ref: >-
                          #/components/schemas/%E9%AA%8C%E8%B4%A7%E5%AE%9D%E4%BF%A1%E6%81%AF
                        title: 验货宝信息
                        description: 商品类型为验货宝时必传
                      brand_data:
                        $ref: '#/components/schemas/brand_data'
                        title: 品牌捡漏信息
                      detail_images: &ref_1
                        $ref: '#/components/schemas/images'
                        title: 详情图片
                      sku_images:
                        $ref: '#/components/schemas/sku_images'
                        title: 规格图片
                      ship_region_data:
                        $ref: >-
                          #/components/schemas/%E8%B7%A8%E5%A2%83%E5%8F%91%E8%B4%A7%E5%9C%B0%E5%8C%BA
                      is_tax_included:
                        type: boolean
                        title: 是否包含税费
                        description: 目前仅用于跨境商品
                    required:
                      - item_key
                      - item_biz_type
                      - sp_biz_type
                      - channel_cat_id
                      - price
                      - stock
                      - publish_shop
                    x-apifox-orders:
                      - item_key
                      - item_biz_type
                      - sp_biz_type
                      - channel_cat_id
                      - channel_pv
                      - price
                      - original_price
                      - express_fee
                      - stock
                      - outer_id
                      - stuff_status
                      - publish_shop
                      - bid_data
                      - sku_items
                      - book_data
                      - food_data
                      - report_data
                      - flash_sale_type
                      - advent_data
                      - inspect_data
                      - brand_data
                      - detail_images
                      - sku_images
                      - ship_region_data
                      - is_tax_included
                    x-apifox-ignore-properties: []
                  minItems: 1
                  maxItems: 50
              x-apifox-orders:
                - product_data
              required:
                - product_data
              x-apifox-ignore-properties: []
            example:
              product_data:
                - item_key: item1
                  item_biz_type: 2
                  sp_biz_type: 1
                  category_id: 50025386
                  channel_cat_id: e11455b218c06e7ae10cfa39bf43dc0f
                  channel_pv:
                    - property_id: b5e5462c028aba7f1921b9e373cead75
                      property_name: 交易形式
                      value_id: 8a3445658e0bc44687b43d68bdc44732
                      value_name: 代下单
                    - property_id: 96ad8793a2fdb81bb108d382c4e6ea42
                      property_name: 面值
                      value_id: 38ed5f6522cd7ab6
                      value_name: 100元
                  price: 550000
                  original_price: 700000
                  express_fee: 100
                  stock: 10
                  outer_id: '2021110112345'
                  stuff_status: 100
                  publish_shop:
                    - images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
                      user_name: 闲鱼会员名
                      province: 130000
                      city: 130100
                      district: 130101
                      title: 商品标题
                      content: 商品描述。
                      service_support: SDR
                  sku_items:
                    - price: 500000
                      stock: 10
                      outer_id: ''
                      sku_text: 颜色:白色;容量:128G
                    - price: 600000
                      stock: 10
                      outer_id: ''
                      sku_text: 颜色:白色;容量:256G
                    - price: 500000
                      stock: 10
                      outer_id: ''
                      sku_text: 颜色:黑色;容量:128G
                    - price: 600000
                      stock: 10
                      outer_id: ''
                      sku_text: 颜色:黑色;容量:256G
                  book_data:
                    title: 北京法源寺
                    author: 李敖
                    publisher: 中国友谊出版公司
                    isbn: '9787505720176'
                  food_data:
                    pack: 罐装
                    spec: '150'
                    brand: 伏特加伏特加
                    expire:
                      num: 360
                      unit: 天
                    production:
                      date: '2021-11-29'
                      address:
                        detail: 北京市东城区x街道
                        province: 130000
                        city: 130100
                        district: 130101
                  report_data:
                    used_car:
                      report_url: https://xxxxxx.com
                    beauty_makeup:
                      org_id: 181
                      brand: 欧莱雅
                      spec: 小瓶装
                      level: 全新
                      org_name: 哈哈哈
                      qc_result: 通过
                      images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
                    game:
                      qc_no: '123123'
                      qc_result: 符合
                      title: 测试游戏
                      platform: 小霸王
                      images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
                    curio:
                      org_id: 191
                      org_name: NGC评级
                      size: 12mmx14mm
                      material: 陶瓷
                      qc_no: '3131319'
                      qc_result: 真品
                      images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
                    jewelry:
                      org_name: 某某平台
                      shape: 圆形
                      color: 白色
                      weight: 125g
                      qc_no: '3131319'
                      qc_desc: 无瑕疵
                      images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
                    valuable:
                      org_id: 162
                      org_name: 国检
                      qc_no: '454545'
                      qc_result: 符合
                      images:
                        - https://xxx.com/xxx1.jpg
                        - https://xxx.com/xxx2.jpg
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5SAFXM14WSHCTDNYA9DNY52:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_0
                        type: object
                        properties:
                          success:
                            type: array
                            items:
                              type: object
                              properties:
                                item_key:
                                  type: string
                                  title: 批次商品KEY
                                  description: 示例：2021110801
                                product_id:
                                  type: integer
                                  title: 管家商品ID
                                  description: 示例：219530767978565
                                  format: int64
                                product_status:
                                  type: integer
                                  title: 管家商品状态
                                  description: 示例：10
                                  format: int32
                              required:
                                - item_key
                                - product_id
                                - product_status
                              x-apifox-orders:
                                - item_key
                                - product_id
                                - product_status
                              x-apifox-ignore-properties: []
                          error:
                            type: array
                            items:
                              type: object
                              properties:
                                item_key:
                                  type: string
                                  title: 批次商品KEY
                                  description: 示例：2021110802
                                msg:
                                  type: string
                                  title: 错误描述
                                  description: 示例：缺少商品标题
                              required:
                                - item_key
                                - msg
                              x-apifox-orders:
                                - item_key
                                - msg
                              x-apifox-ignore-properties: []
                        required:
                          - success
                          - error
                        x-apifox-orders:
                          - success
                          - error
                        x-apifox-ignore-properties: []
                    required:
                      - data
                x-apifox-orders:
                  - 01H5SAFXM14WSHCTDNYA9DNY52
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_0
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586378-run
components:
  schemas:
    跨境发货地区:
      type: object
      properties:
        region_name:
          type: string
          title: 地区名称
          examples:
            - 香港
        region_code:
          type: string
          title: 地区代码
          examples:
            - HKG
          enum:
            - HKG
            - JPN
          x-apifox-enum:
            - value: HKG
              name: 香港
              description: ''
            - value: JPN
              name: 日本
              description: ''
          description: 注意：目前仅支持香港/日本跨境商品
      x-apifox-orders:
        - region_name
        - region_code
      required:
        - region_name
        - region_code
      description: |
        目前仅用于跨境商品（必填）
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
          sku_text:
            type: string
            title: 规格属性
            examples:
              - 颜色:黑色
        x-apifox-orders:
          - src
          - width
          - height
          - sku_text
        required:
          - src
          - width
          - height
          - sku_text
        x-apifox-ignore-properties: []
      title: 规格图片
      x-apifox-folder: ''
    images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
        x-apifox-orders:
          - src
          - width
          - height
        required:
          - src
          - width
          - height
        x-apifox-ignore-properties: []
      title: 新图片信息
      x-apifox-folder: ''
    brand_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
        supplier:
          type: string
          title: 供应商名称
        images: *ref_1
      x-apifox-orders:
        - expire
        - production
        - supplier
        - images
      title: 品牌捡漏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    验货宝信息:
      type: object
      properties:
        trade_rule:
          type: string
          title: 交易规则
          enum:
            - yhbOptional
            - yhbOnly
          examples:
            - yhbOptional
          x-apifox-enum:
            - value: yhbOptional
              name: ''
              description: 买家可选是否走验货宝
            - value: yhbOnly
              name: ''
              description: 买家必须走验货宝
        assume_rule:
          type: string
          title: 验货费规则
          enum:
            - buyer
            - seller
          examples:
            - buyer
          x-apifox-enum:
            - value: buyer
              name: ''
              description: 买家承担验货费
            - value: seller
              name: ''
              description: 卖家承担验货费
      required:
        - trade_rule
        - assume_rule
      x-apifox-orders:
        - trade_rule
        - assume_rule
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    advent_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
      required:
        - expire
        - production
      x-apifox-orders:
        - expire
        - production
      title: 闲鱼特卖信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    flash_sale_type:
      type: integer
      title: 闲鱼特卖类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 99
        - 2601
        - 2602
        - 2603
        - 2604
      examples:
        - 1
      x-apifox-enum:
        - name: ''
          value: 1
          description: 临期
        - name: ''
          value: 2
          description: 孤品
        - name: ''
          value: 3
          description: 断码
        - name: ''
          value: 4
          description: 微瑕
        - name: ''
          value: 5
          description: 尾货
        - name: ''
          value: 6
          description: 官翻
        - name: ''
          value: 7
          description: 全新
        - name: ''
          value: 8
          description: 福袋
        - name: ''
          value: 99
          description: 其他
        - name: ''
          value: 2601
          description: 微瑕
        - name: ''
          value: 2602
          description: 临期
        - name: ''
          value: 2603
          description: 清仓
        - name: ''
          value: 2604
          description: 官翻
      description: |-
        枚举值：
        -仅闲鱼特卖类型可用-
        1 : 临期
        2 : 孤品
        3 : 断码
        4 : 微瑕
        5 : 尾货
        6 : 官翻
        7 : 全新
        8 : 福袋
        99 : 其他
        -仅闲鱼特卖类型可用-

        -仅品牌捡漏类型可用-
        2601 : 微瑕
        2602 : 临期
        2603 : 清仓
        2604 : 官翻
        -仅品牌捡漏类型可用-
      x-apifox-folder: ''
    report_data:
      type: object
      properties:
        beauty_makeup:
          title: 美妆信息
          $ref: '#/components/schemas/beauty_makeup'
        curio:
          title: 文玩信息
          $ref: '#/components/schemas/curio'
        jewelry:
          title: 珠宝信息
          $ref: '#/components/schemas/jewelry'
        game:
          title: 游戏信息
          $ref: '#/components/schemas/game'
        used_car:
          title: 二手车信息
          $ref: '#/components/schemas/used_car'
        valuable:
          title: 奢品信息
          $ref: '#/components/schemas/valuable'
        yx_3c:
          $ref: '#/components/schemas/%E4%B8%A5%E9%80%893c%E4%BF%A1%E6%81%AF'
      x-apifox-orders:
        - beauty_makeup
        - curio
        - jewelry
        - game
        - used_car
        - valuable
        - yx_3c
      title: 验货报告信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    严选3c信息:
      type: object
      properties:
        class_id:
          type: integer
          title: 品类ID
        subclass_id:
          type: integer
          title: 子类ID
        brand_id:
          type: integer
          title: 品牌ID
        brand_name:
          type: string
          title: 品牌名称
        model_id:
          type: integer
          title: 机型ID
        model_name:
          type: string
          title: 机型名称
        model_sn:
          type: string
          title: IMEI/序列号
        report_user:
          type: string
          title: 质检人
          description: 体现在商品验货报告页
        report_time:
          type: string
          title: 质检时间
          description: 体现在商品验货报告页
        report_items:
          type: array
          items:
            type: object
            properties:
              answer_id:
                type: integer
                format: int32
                title: 选项ID
              answer_name:
                type: string
                title: 选项名称
              answer_type:
                type: integer
                title: 选项类型
                enum:
                  - 0
                  - 1
                  - 2
                examples:
                  - 1
                format: int32
                x-apifox-enum:
                  - value: 0
                    name: ''
                    description: 普通项
                  - value: 1
                    name: ''
                    description: 正常项
                  - value: 2
                    name: ''
                    description: 异常项
              answer_desc:
                type: string
                title: 选项描述
              question_name:
                type: string
                title: 问题名称
              category_name:
                type: string
                title: 分类名称
              group_name:
                type: string
                title: 分组名称
            x-apifox-orders:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            required:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            x-apifox-ignore-properties: []
          title: 质检报告项
          description: 体现在商品验货报告页
        answer_ids:
          type: array
          items:
            type: integer
          title: 质检选项ID
          description: 内部存储，不对外展示
      required:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-orders:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    valuable:
      type: object
      properties:
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 161
            - 162
            - 163
            - 164
          examples:
            - 161
          description: |-
            枚举值：
            161 : 中检
            162 : 国检
            163 : 华测
            164 : 中溯
          x-apifox-enum:
            - value: 161
              name: ''
              description: 中检
            - value: 162
              name: ''
              description: 国检
            - value: 163
              name: ''
              description: 华测
            - value: 164
              name: ''
              description: 中溯
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 中检
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
        images: &ref_2
          title: 验货图片
          $ref: '#/components/schemas/images1'
      required:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 奢品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    images1:
      type: array
      items:
        type: string
        examples:
          - https://xxx.com/xxx1.jpg
      title: 图片信息
      minItems: 1
      maxItems: 30
      uniqueItems: true
      x-apifox-folder: ''
    used_car:
      type: object
      properties:
        report_url:
          type: string
          description: ' 验货报告链接'
        driving_license_info:
          type: string
          description: ' 行驶证主页图片'
        driving_license_car_photo:
          type: string
          description: ' 行驶证车辆页图片'
        business_license_front:
          type: string
          description: ' 营业执照图片'
        car_function:
          type: string
          description: ' 使用性质 : 营运/非营运'
        car_vin:
          type: string
          description: ' 车辆识别代码VIN码'
      title: OpenProductReportUsedCar
      x-apifox-orders:
        - report_url
        - driving_license_info
        - driving_license_car_photo
        - business_license_front
        - car_function
        - car_vin
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    game:
      type: object
      properties:
        title:
          type: string
          title: 报告标题
          examples:
            - 怪物猎人
        platform:
          type: string
          title: 游戏平台
          examples:
            - PS5
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 符合
        images: *ref_2
      required:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      title: 游戏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    jewelry:
      type: object
      properties:
        shape:
          type: string
          title: 形状
          examples:
            - 圆形
        color:
          type: string
          title: 颜色
          examples:
            - 白色
        weight:
          type: string
          title: 重量
          examples:
            - 125g
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - xx平台
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 无瑕疵
        images: *ref_2
      required:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 珠宝信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    curio:
      type: object
      properties:
        size:
          type: string
          title: 尺寸
          examples:
            - 12mmx14mm
        material:
          type: string
          title: 材料
          examples:
            - 陶瓷
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 191
            - 192
            - 193
            - 194
            - 195
            - 196
            - 197
            - 198
            - 199
            - 1910
            - 1911
            - 1912
          examples:
            - 191
          description: |-
            枚举值：
            191 : NGC评级
            192 : PMG评级
            193 : 公博评级
            194 : PCGS评级
            195 : 众诚评级
            196 : 保粹评级
            197 : 华夏评级
            198 : 爱藏评级
            199 : 华龙盛世
            1910 : 国鉴鉴定
            1911 : 信泰评级
            1912 : 闻德评级
          x-apifox-enum:
            - value: 191
              name: ''
              description: NGC评级
            - value: 192
              name: ''
              description: PMG评级
            - value: 193
              name: ''
              description: 公博评级
            - value: 194
              name: ''
              description: PCGS评级
            - value: 195
              name: ''
              description: 众诚评级
            - value: 196
              name: ''
              description: 保粹评级
            - value: 197
              name: ''
              description: 华夏评级
            - value: 198
              name: ''
              description: 爱藏评级
            - value: 199
              name: ''
              description: 华龙盛世
            - value: 1910
              name: ''
              description: 国鉴鉴定
            - value: 1911
              name: ''
              description: 信泰评级
            - value: 1912
              name: ''
              description: 闻德评级
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - NGC评级
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        images: *ref_2
      required:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      x-apifox-orders:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      title: 文玩信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    beauty_makeup:
      type: object
      properties:
        brand:
          type: string
          title: 品牌
          examples:
            - 欧莱雅
        spec:
          type: string
          title: 规格
          examples:
            - 小瓶装
        level:
          type: string
          title: 成色
          examples:
            - 全新
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 181
            - 182
          examples:
            - 181
          description: |-
            枚举值：
            181 : 维鉴
            182 : 中检科深
          x-apifox-enum:
            - value: 181
              name: ''
              description: 维鉴
            - value: 182
              name: ''
              description: 中检科深
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 维鉴
        images: *ref_2
      required:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      x-apifox-orders:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      title: 美妆信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    food_data:
      type: object
      properties:
        brand:
          type: string
          title: 食品品牌
          minLength: 1
          maxLength: 30
          examples:
            - 旺旺
        spec:
          type: string
          title: 食品规格
          minLength: 1
          maxLength: 30
          examples:
            - 大包
        pack:
          type: string
          title: 食品包装
          minLength: 1
          maxLength: 10
          examples:
            - 袋装
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 食品有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 食品生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
            address:
              type: object
              properties:
                detail:
                  type: string
                  title: 详细地址
                  minLength: 1
                  maxLength: 60
                province:
                  type: integer
                  title: 生产地省份ID
                  format: int32
                  examples:
                    - 110000
                city:
                  type: integer
                  title: 生产地城市ID
                  format: int32
                  examples:
                    - 110100
                district:
                  type: integer
                  title: 生产地地区ID
                  format: int32
                  examples:
                    - 110101
              required:
                - detail
                - province
                - city
                - district
              x-apifox-orders:
                - detail
                - province
                - city
                - district
              title: 食品生产地信息
              x-apifox-ignore-properties: []
          required:
            - date
            - address
          x-apifox-orders:
            - date
            - address
          title: 食品生产信息
          x-apifox-ignore-properties: []
      required:
        - brand
        - spec
        - pack
        - expire
        - production
      x-apifox-orders:
        - brand
        - spec
        - pack
        - expire
        - production
      title: 食品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    book_data:
      type: object
      properties:
        isbn:
          type: string
          title: 图书ISBN码
          pattern: /^((?:[0-9]{9}X|[0-9]{10})|(?:(?:97(?:8|9))[0-9]{10}))$/
          additionalProperties: false
          examples:
            - '9787505720176'
        title:
          type: string
          title: 图书标题
          additionalProperties: false
          examples:
            - 北京法源寺
        author:
          type: string
          title: 图书作者
          additionalProperties: false
          examples:
            - 李敖
          minLength: 1
          maxLength: 30
        publisher:
          type: string
          title: 图书出版社
          additionalProperties: false
          examples:
            - 中国友谊出版公司
          minLength: 1
          maxLength: 30
      required:
        - isbn
        - title
      x-apifox-orders:
        - isbn
        - title
        - author
        - publisher
      title: 图书信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_items:
      type: object
      properties:
        price: *ref_3
        stock:
          type: integer
          title: SKU库存
          maximum: 9999
          format: int32
          minimum: 0
          examples:
            - 10
        sku_text:
          type: string
          title: SKU规格
          examples:
            - 颜色:黑色;内存:512G
          description: |-
            格式：规格:属性，多个时使用";"拼接
            示例：颜色:白色;容量:128G
            限制：规格名称最多4个字，属性名称最多 20 个字（不分区中英文）
        outer_id:
          type: string
          title: SKU商品编码
          examples:
            - '2023072101'
          minLength: 0
          maxLength: 64
          description: 注意：一个中文按2个字符算
      x-apifox-orders:
        - price
        - stock
        - sku_text
        - outer_id
      required:
        - price
        - stock
        - sku_text
      title: SKU信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    bid_data:
      type: object
      properties:
        bid_start_time:
          type: string
          title: 拍卖开始时间
          examples:
            - '2023-07-21 00:00:00'
        bid_end_time:
          type: string
          title: 拍卖结束时间
          examples:
            - '2023-07-21 00:00:00'
        bid_reserve_price:
          type: integer
          title: 拍卖起拍价（分）
          format: int64
          additionalProperties: false
          minimum: 100
          maximum: 9999999900
          examples:
            - 100
        bid_increase_price:
          type: integer
          title: 拍卖加拍价（分）
          format: int64
          additionalProperties: false
          minimum: 100
          maximum: 10000
          examples:
            - 100
        bid_deposit:
          type: integer
          title: 拍卖保证金（分）
          format: int64
          additionalProperties: false
          minimum: 100
          maximum: 9999999900
          examples:
            - 100
      required:
        - bid_start_time
        - bid_end_time
        - bid_reserve_price
        - bid_increase_price
        - bid_deposit
      x-apifox-orders:
        - bid_start_time
        - bid_end_time
        - bid_reserve_price
        - bid_increase_price
        - bid_deposit
      title: 拍卖信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    publish_shop:
      type: object
      properties:
        user_name:
          type: string
          title: 闲鱼会员名
          examples:
            - tb924343042
        province:
          type: integer
          title: 商品发货省份
          format: int32
          examples:
            - 110000
        city:
          type: integer
          title: 商品发货城市
          format: int32
          examples:
            - 110100
        district:
          type: integer
          title: 商品发货地区
          format: int32
          examples:
            - 110101
        title:
          type: string
          title: 商品标题
          description: 注意：一个中文按2个字符算
          minLength: 1
          examples:
            - iPhone 12 128G 黑色
          maxLength: 60
        content:
          type: string
          title: 商品描述
          description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\n换行
          minLength: 5
          maxLength: 5000
          examples:
            - iPhone 12 128G 黑色 8新，非诚勿扰~~
        images: *ref_2
        white_images:
          type: string
          title: 商品白底图URL
          examples:
            - https://xxx.com/xxx1.jpg
          description: |-
            注意 ：
            1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
            2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
        service_support:
          title: 商品服务
          $ref: '#/components/schemas/service_support'
      x-apifox-orders:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
        - white_images
        - service_support
      required:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
      title: 店铺发布信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接

        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
    stuff_status:
      type: integer
      title: 商品成色
      description: |-
        枚举值：
        0 : 无成色（普通商品可用）
        100 : 全新
         -1 : 准新 
        99 : 99新 
        95 : 95新 
        90 : 9新 
        80 : 8新 
        70 : 7新 
        60 : 6新 
        50 : 5新 

        -仅品牌捡漏类型可用-
        40 : 未使用·中度瑕疵
        30 : 未使用·轻微瑕疵
        20 : 未使用·仅拆封
        10 : 未使用·准新
        100 : 全新未使用
        -仅品牌捡漏类型可用-

        及以下注意：非普通商品类型时必填~~
      format: int32
      enum:
        - 100
        - -1
        - 99
        - 95
        - 90
        - 80
        - 70
        - 60
        - 50
        - 40
        - 30
        - 20
        - 10
        - 0
      default: 0
      examples:
        - 100
      x-apifox-enum:
        - value: 100
          name: ''
          description: 全新
        - value: -1
          name: ''
          description: 准新
        - value: 99
          name: ''
          description: 99新
        - value: 95
          name: ''
          description: 95新
        - value: 90
          name: ''
          description: 9新
        - value: 80
          name: ''
          description: 8新
        - value: 70
          name: ''
          description: 7新
        - value: 60
          name: ''
          description: 6新
        - value: 50
          name: ''
          description: 5新及以下
        - value: 40
          name: ''
          description: 未使用·中度瑕疵
        - value: 30
          name: ''
          description: 未使用·轻微瑕疵
        - value: 20
          name: ''
          description: 未使用·仅拆封
        - value: 10
          name: ''
          description: 未使用·准新
        - value: 0
          name: ''
          description: 无
      x-apifox-folder: ''
    express_fee:
      type: integer
      title: 运费
      format: int64
      x-apifox-folder: ''
    original_price:
      type: integer
      title: 商品原价
      minimum: 0
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    channel_pv:
      type: array
      items:
        type: object
        properties:
          property_id:
            type: string
            title: 属性ID
            examples:
              - 83b8f62c43df34e6
          property_name:
            type: string
            title: 属性名称
            examples:
              - 品牌
          value_id:
            type: string
            title: 属性值ID
            examples:
              - 76f78d92eeb4f5f6eccf7d4fabef47b6
          value_name:
            type: string
            title: 属性值名称
            examples:
              - Apple/苹果
        x-apifox-orders:
          - property_id
          - property_name
          - value_id
          - value_name
        required:
          - property_id
          - property_name
          - value_id
          - value_name
        x-apifox-ignore-properties: []
      title: 商品属性
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 上架商品

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/publish:
    post:
      summary: 上架商品
      deprecated: false
      description: |-
        特别提醒：
        本接口会采用异步的方式更新商品信息到闲鱼 App 上，因此更新结果采用回调的方式进行通知。
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  examples:
                    - 219530767978565
                user_name:
                  type: array
                  items:
                    type: string
                    examples:
                      - tb924343042
                  title: 闲鱼会员名
                  minItems: 1
                  maxItems: 1
                  description: 指上架商品到哪个闲鱼店铺
                specify_publish_time:
                  type: string
                  title: 定时上架时间
                  examples:
                    - '2023-07-21 00:00:00'
                  description: 最小时间维度为分钟，并且以实际上架成功为准
                notify_url:
                  type: string
                  title: 上架回调地址
                  description: 回调参数请查看推送目录下的商品回调通知文档。
              required:
                - product_id
                - user_name
              x-apifox-orders:
                - product_id
                - user_name
                - specify_publish_time
                - notify_url
              x-apifox-ignore-properties: []
            example:
              product_id: 220656347074629
              user_name:
                - tb924343042
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response_ok'
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data: {}
                '2':
                  summary: 异常示例
                  value:
                    code: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-95038267-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 下架商品

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/downShelf:
    post:
      summary: 下架商品
      deprecated: false
      description: ''
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                  examples:
                    - 219530767978565
              required:
                - product_id
              x-apifox-orders:
                - product_id
              x-apifox-ignore-properties: []
            example:
              product_id: 220656347074629
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response_ok'
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data: {}
                '2':
                  summary: 异常示例
                  value:
                    code: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586382-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 编辑商品

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/edit:
    post:
      summary: 编辑商品
      deprecated: false
      description: |-
        注意事项：
        1：可以只传入需要更新的字段， 没有传入的字段不会更新
        2：多规格商品，如果已经发布到闲鱼则不能清空SKU，至少要保留一组
        3：如果商品状态为销售中，则同步更新到闲鱼App

        特别提醒：
        如果商品为在架状态时，采用异步的方式更新商品信息到闲鱼App上，因此更新结果采用异步回调的方式进行通知。
        如果商品不是在架状态，即使传入回调地址，也不会触发回调通知。
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                  examples:
                    - 441160510721413
                item_biz_type:
                  title: 商品类型ID
                  $ref: '#/components/schemas/item_biz_type'
                sp_biz_type:
                  title: 商品分类ID
                  $ref: '#/components/schemas/sp_biz_type'
                category_id:
                  type: integer
                  title: 商品分类
                  format: int32
                  examples:
                    - 50025386
                channel_cat_id:
                  type: string
                  title: 商品类目ID
                  examples:
                    - e11455b218c06e7ae10cfa39bf43dc0f
                channel_pv:
                  title: 商品属性
                  $ref: '#/components/schemas/channel_pv'
                price: &ref_8
                  title: 商品售价（分）
                  $ref: '#/components/schemas/price'
                  description: 注意：多规格商品时，必须是SKU其中一个金额
                original_price:
                  title: 商品原价（分）
                  $ref: '#/components/schemas/original_price'
                express_fee:
                  title: 运费
                  $ref: '#/components/schemas/express_fee'
                stock:
                  type: integer
                  title: 商品库存
                  minimum: 1
                  maximum: 399960
                  format: int32
                  examples:
                    - 1
                  description: 注意：多规格商品，必须是SKU库存的合计
                outer_id:
                  type: string
                  title: 商家编码
                  minLength: 1
                  maxLength: 64
                  examples:
                    - '317837811'
                  description: 注意：一个中文按2个字符算
                stuff_status:
                  title: 商品成色
                  $ref: '#/components/schemas/stuff_status'
                publish_shop:
                  type: array
                  items:
                    type: object
                    x-apifox-refs:
                      01J18VWFHWEBKB41W9DT61W8ZK:
                        $ref: '#/components/schemas/publish_shop'
                        x-apifox-overrides:
                          images: &ref_5
                            title: 商品图片URL
                            description: 注意：第1张作为商品主图，前9张发布到闲鱼App
                            $ref: '#/components/schemas/images1'
                          content: &ref_4
                            type: string
                            title: 商品描述
                            description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\n换行
                            minLength: 5
                            maxLength: 5000
                            examples:
                              - iPhone 12 128G 黑色 8新，非诚勿扰~~
                          title: &ref_3
                            type: string
                            title: 商品标题
                            description: 注意：一个中文按2个字符算
                            minLength: 1
                            examples:
                              - iPhone 12 128G 黑色
                            maxLength: 60
                          province: &ref_0
                            type: integer
                            title: 商品发货省份
                            format: int32
                            examples:
                              - 110000
                          city: &ref_1
                            type: integer
                            title: 商品发货城市
                            format: int32
                            examples:
                              - 110100
                          district: &ref_2
                            type: integer
                            title: 商品发货地区
                            format: int32
                            examples:
                              - 110101
                    x-apifox-orders:
                      - 01J18VWFHWEBKB41W9DT61W8ZK
                    properties:
                      user_name:
                        type: string
                        title: 闲鱼会员名
                        examples:
                          - tb924343042
                      province: *ref_0
                      city: *ref_1
                      district: *ref_2
                      title: *ref_3
                      content: *ref_4
                      images: *ref_5
                      white_images:
                        type: string
                        title: 商品白底图URL
                        examples:
                          - https://xxx.com/xxx1.jpg
                        description: |-
                          注意 ：
                          1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
                          2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
                      service_support: &ref_9
                        title: 商品服务
                        $ref: '#/components/schemas/service_support'
                    required:
                      - user_name
                    x-apifox-ignore-properties:
                      - user_name
                      - province
                      - city
                      - district
                      - title
                      - content
                      - images
                      - white_images
                      - service_support
                  title: 发布店铺
                sku_items:
                  type: array
                  items:
                    $ref: '#/components/schemas/sku_items'
                  title: 商品多规格信息
                book_data:
                  title: 图书信息
                  $ref: '#/components/schemas/book_data'
                food_data:
                  title: 食品信息
                  $ref: '#/components/schemas/food_data'
                report_data:
                  title: 验货报告信息
                  $ref: '#/components/schemas/report_data'
                notify_url:
                  type: string
                  title: 回调地址
                  description: |-
                    仅在商品状态为在架中编辑时，才会触发回调通知。
                    回调参数请查看推送目录下的商品回调通知文档。
                flash_sale_type:
                  $ref: '#/components/schemas/flash_sale_type'
                  title: 闲鱼特卖类型
                advent_data:
                  $ref: '#/components/schemas/advent_data'
                  title: 闲鱼特卖信息
                  description: 闲鱼特卖类型为临期非食品行业时必传
                inspect_data:
                  $ref: >-
                    #/components/schemas/%E9%AA%8C%E8%B4%A7%E5%AE%9D%E4%BF%A1%E6%81%AF
                  title: 验货宝信息
                  description: 商品类型为验货宝时必传
                brand_data:
                  $ref: '#/components/schemas/brand_data'
                  title: 品牌捡漏信息
                detail_images: &ref_7
                  $ref: '#/components/schemas/images'
                  title: 详情图片
                sku_images:
                  $ref: '#/components/schemas/sku_images'
                  title: 规格图片
                ship_region_data:
                  $ref: >-
                    #/components/schemas/%E8%B7%A8%E5%A2%83%E5%8F%91%E8%B4%A7%E5%9C%B0%E5%8C%BA
                is_tax_included:
                  type: boolean
                  title: 是否包含税费
                  description: 目前仅用于跨境商品
              required:
                - product_id
              x-apifox-orders:
                - product_id
                - item_biz_type
                - sp_biz_type
                - category_id
                - channel_cat_id
                - channel_pv
                - price
                - original_price
                - express_fee
                - stock
                - outer_id
                - stuff_status
                - publish_shop
                - sku_items
                - book_data
                - food_data
                - report_data
                - notify_url
                - flash_sale_type
                - advent_data
                - inspect_data
                - brand_data
                - detail_images
                - sku_images
                - ship_region_data
                - is_tax_included
              x-apifox-ignore-properties: []
            example:
              product_id: 443299347640581
              item_biz_type: 2
              sp_biz_type: 1
              category_id: 50025386
              channel_cat_id: e11455b218c06e7ae10cfa39bf43dc0f
              channel_pv:
                - property_id: b5e5462c028aba7f1921b9e373cead75
                  property_name: 交易形式
                  value_id: 8a3445658e0bc44687b43d68bdc44732
                  value_name: 代下单
                - property_id: 96ad8793a2fdb81bb108d382c4e6ea42
                  property_name: 面值
                  value_id: 38ed5f6522cd7ab6
                  value_name: 100元
              title: iPhone 12 128G 黑色
              price: 550000
              original_price: 700000
              express_fee: 10
              stock: 10
              outer_id: '2021110112345'
              stuff_status: 100
              publish_shop:
                - images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                  user_name: 闲鱼会员名
                  province: 130000
                  city: 130100
                  district: 130101
                  title: 商品标题
                  content: 商品描述。
                  white_images: https://xxx.com/xxx1.jpg
                  service_support: SDR
              sku_items:
                - price: 500000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:白色;容量:128G
                - price: 600000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:白色;容量:256G
                - price: 500000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:黑色;容量:128G
                - price: 600000
                  stock: 10
                  outer_id: ''
                  sku_text: 颜色:黑色;容量:256G
              book_data:
                title: 北京法源寺
                author: 李敖
                publisher: 中国友谊出版公司
                isbn: '9787505720176'
              food_data:
                pack: 罐装
                spec: '150'
                brand: 伏特加伏特加
                expire:
                  num: 360
                  unit: 天
                production:
                  date: '2021-11-29'
                  address:
                    detail: 北京市东城区x街道
                    province: 130000
                    city: 130100
                    district: 130101
              report_data:
                used_car:
                  report_url: https://xxxxxx.com
                beauty_makeup:
                  org_id: 181
                  brand: 欧莱雅
                  spec: 小瓶装
                  level: 全新
                  org_name: 哈哈哈
                  qc_result: 通过
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                game:
                  qc_no: '123123'
                  qc_result: 符合
                  title: 测试游戏
                  platform: 小霸王
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                curio:
                  org_id: 191
                  org_name: NGC评级
                  size: 12mmx14mm
                  material: 陶瓷
                  qc_no: '3131319'
                  qc_result: 真品
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                jewelry:
                  org_name: 某某平台
                  shape: 圆形
                  color: 白色
                  weight: 125g
                  qc_no: '3131319'
                  qc_desc: 无瑕疵
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                valuable:
                  org_id: 162
                  org_name: 国检
                  qc_no: '454545'
                  qc_result: 符合
                  images:
                    - https://xxx.com/xxx1.jpg
                    - https://xxx.com/xxx2.jpg
                yx_3c:
                  class_id: 10
                  subclass_id: 1001
                  brand_id: 10000
                  brand_name: 苹果
                  model_id: 10011
                  model_name: iPhone 14 Pro
                  model_sn: IMEI/序列号
                  report_user: 张胜男
                  report_time: '2024-03-15 18:04:44'
                  report_items:
                    - answer_id: 11103
                      answer_name: 不开机
                      answer_type: 2
                      category_name: 拆修侵液
                      group_name: 系统情况
                      question_name: 系统情况
                  answer_ids:
                    - 11103
                    - 11106
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs:
                  01H5SAJZ63A1D1MSJQYWZ6SZ8Y:
                    $ref: '#/components/schemas/response_ok'
                    x-apifox-overrides:
                      data: &ref_6
                        type: object
                        properties:
                          product_id:
                            type: integer
                            title: 管家商品ID
                            description: 示例：219530767978565
                            format: int64
                            additionalProperties: false
                          product_status:
                            type: integer
                            title: 管家商品状态
                            description: 示例：10
                            additionalProperties: false
                        required:
                          - product_id
                          - product_status
                        x-apifox-orders:
                          - product_id
                          - product_status
                        additionalProperties: false
                        x-apifox-ignore-properties: []
                    required:
                      - data
                    additionalProperties: false
                x-apifox-orders:
                  - 01H5SAJZ63A1D1MSJQYWZ6SZ8Y
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data: *ref_6
                required:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties:
                  - code
                  - msg
                  - data
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586379-run
components:
  schemas:
    跨境发货地区:
      type: object
      properties:
        region_name:
          type: string
          title: 地区名称
          examples:
            - 香港
        region_code:
          type: string
          title: 地区代码
          examples:
            - HKG
          enum:
            - HKG
            - JPN
          x-apifox-enum:
            - value: HKG
              name: 香港
              description: ''
            - value: JPN
              name: 日本
              description: ''
          description: 注意：目前仅支持香港/日本跨境商品
      x-apifox-orders:
        - region_name
        - region_code
      required:
        - region_name
        - region_code
      description: |
        目前仅用于跨境商品（必填）
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
          sku_text:
            type: string
            title: 规格属性
            examples:
              - 颜色:黑色
        x-apifox-orders:
          - src
          - width
          - height
          - sku_text
        required:
          - src
          - width
          - height
          - sku_text
        x-apifox-ignore-properties: []
      title: 规格图片
      x-apifox-folder: ''
    images:
      type: array
      items:
        type: object
        properties:
          src:
            type: string
            title: 图片地址
          width:
            type: integer
            format: int32
            title: 图片宽度
          height:
            type: integer
            format: int32
            title: 图片高度
        x-apifox-orders:
          - src
          - width
          - height
        required:
          - src
          - width
          - height
        x-apifox-ignore-properties: []
      title: 新图片信息
      x-apifox-folder: ''
    brand_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
        supplier:
          type: string
          title: 供应商名称
        images: *ref_7
      x-apifox-orders:
        - expire
        - production
        - supplier
        - images
      title: 品牌捡漏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    验货宝信息:
      type: object
      properties:
        trade_rule:
          type: string
          title: 交易规则
          enum:
            - yhbOptional
            - yhbOnly
          examples:
            - yhbOptional
          x-apifox-enum:
            - value: yhbOptional
              name: ''
              description: 买家可选是否走验货宝
            - value: yhbOnly
              name: ''
              description: 买家必须走验货宝
        assume_rule:
          type: string
          title: 验货费规则
          enum:
            - buyer
            - seller
          examples:
            - buyer
          x-apifox-enum:
            - value: buyer
              name: ''
              description: 买家承担验货费
            - value: seller
              name: ''
              description: 卖家承担验货费
      required:
        - trade_rule
        - assume_rule
      x-apifox-orders:
        - trade_rule
        - assume_rule
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    advent_data:
      type: object
      properties:
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
          required:
            - date
          x-apifox-orders:
            - date
          title: 生产信息
          x-apifox-ignore-properties: []
      required:
        - expire
        - production
      x-apifox-orders:
        - expire
        - production
      title: 闲鱼特卖信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    flash_sale_type:
      type: integer
      title: 闲鱼特卖类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 7
        - 8
        - 99
        - 2601
        - 2602
        - 2603
        - 2604
      examples:
        - 1
      x-apifox-enum:
        - name: ''
          value: 1
          description: 临期
        - name: ''
          value: 2
          description: 孤品
        - name: ''
          value: 3
          description: 断码
        - name: ''
          value: 4
          description: 微瑕
        - name: ''
          value: 5
          description: 尾货
        - name: ''
          value: 6
          description: 官翻
        - name: ''
          value: 7
          description: 全新
        - name: ''
          value: 8
          description: 福袋
        - name: ''
          value: 99
          description: 其他
        - name: ''
          value: 2601
          description: 微瑕
        - name: ''
          value: 2602
          description: 临期
        - name: ''
          value: 2603
          description: 清仓
        - name: ''
          value: 2604
          description: 官翻
      description: |-
        枚举值：
        -仅闲鱼特卖类型可用-
        1 : 临期
        2 : 孤品
        3 : 断码
        4 : 微瑕
        5 : 尾货
        6 : 官翻
        7 : 全新
        8 : 福袋
        99 : 其他
        -仅闲鱼特卖类型可用-

        -仅品牌捡漏类型可用-
        2601 : 微瑕
        2602 : 临期
        2603 : 清仓
        2604 : 官翻
        -仅品牌捡漏类型可用-
      x-apifox-folder: ''
    report_data:
      type: object
      properties:
        beauty_makeup:
          title: 美妆信息
          $ref: '#/components/schemas/beauty_makeup'
        curio:
          title: 文玩信息
          $ref: '#/components/schemas/curio'
        jewelry:
          title: 珠宝信息
          $ref: '#/components/schemas/jewelry'
        game:
          title: 游戏信息
          $ref: '#/components/schemas/game'
        used_car:
          title: 二手车信息
          $ref: '#/components/schemas/used_car'
        valuable:
          title: 奢品信息
          $ref: '#/components/schemas/valuable'
        yx_3c:
          $ref: '#/components/schemas/%E4%B8%A5%E9%80%893c%E4%BF%A1%E6%81%AF'
      x-apifox-orders:
        - beauty_makeup
        - curio
        - jewelry
        - game
        - used_car
        - valuable
        - yx_3c
      title: 验货报告信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    严选3c信息:
      type: object
      properties:
        class_id:
          type: integer
          title: 品类ID
        subclass_id:
          type: integer
          title: 子类ID
        brand_id:
          type: integer
          title: 品牌ID
        brand_name:
          type: string
          title: 品牌名称
        model_id:
          type: integer
          title: 机型ID
        model_name:
          type: string
          title: 机型名称
        model_sn:
          type: string
          title: IMEI/序列号
        report_user:
          type: string
          title: 质检人
          description: 体现在商品验货报告页
        report_time:
          type: string
          title: 质检时间
          description: 体现在商品验货报告页
        report_items:
          type: array
          items:
            type: object
            properties:
              answer_id:
                type: integer
                format: int32
                title: 选项ID
              answer_name:
                type: string
                title: 选项名称
              answer_type:
                type: integer
                title: 选项类型
                enum:
                  - 0
                  - 1
                  - 2
                examples:
                  - 1
                format: int32
                x-apifox-enum:
                  - value: 0
                    name: ''
                    description: 普通项
                  - value: 1
                    name: ''
                    description: 正常项
                  - value: 2
                    name: ''
                    description: 异常项
              answer_desc:
                type: string
                title: 选项描述
              question_name:
                type: string
                title: 问题名称
              category_name:
                type: string
                title: 分类名称
              group_name:
                type: string
                title: 分组名称
            x-apifox-orders:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            required:
              - answer_id
              - answer_name
              - answer_type
              - answer_desc
              - question_name
              - category_name
              - group_name
            x-apifox-ignore-properties: []
          title: 质检报告项
          description: 体现在商品验货报告页
        answer_ids:
          type: array
          items:
            type: integer
          title: 质检选项ID
          description: 内部存储，不对外展示
      required:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-orders:
        - class_id
        - subclass_id
        - brand_id
        - brand_name
        - model_id
        - model_name
        - model_sn
        - report_user
        - report_time
        - report_items
        - answer_ids
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    valuable:
      type: object
      properties:
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 161
            - 162
            - 163
            - 164
          examples:
            - 161
          description: |-
            枚举值：
            161 : 中检
            162 : 国检
            163 : 华测
            164 : 中溯
          x-apifox-enum:
            - value: 161
              name: ''
              description: 中检
            - value: 162
              name: ''
              description: 国检
            - value: 163
              name: ''
              description: 华测
            - value: 164
              name: ''
              description: 中溯
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 中检
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
        images: *ref_5
      required:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - org_id
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 奢品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    used_car:
      type: object
      properties:
        report_url:
          type: string
          description: ' 验货报告链接'
        driving_license_info:
          type: string
          description: ' 行驶证主页图片'
        driving_license_car_photo:
          type: string
          description: ' 行驶证车辆页图片'
        business_license_front:
          type: string
          description: ' 营业执照图片'
        car_function:
          type: string
          description: ' 使用性质 : 营运/非营运'
        car_vin:
          type: string
          description: ' 车辆识别代码VIN码'
      title: OpenProductReportUsedCar
      x-apifox-orders:
        - report_url
        - driving_license_info
        - driving_license_car_photo
        - business_license_front
        - car_function
        - car_vin
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    game:
      type: object
      properties:
        title:
          type: string
          title: 报告标题
          examples:
            - 怪物猎人
        platform:
          type: string
          title: 游戏平台
          examples:
            - PS5
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 符合
        images: *ref_5
      required:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - title
        - platform
        - qc_no
        - qc_desc
        - images
      title: 游戏信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    jewelry:
      type: object
      properties:
        shape:
          type: string
          title: 形状
          examples:
            - 圆形
        color:
          type: string
          title: 颜色
          examples:
            - 白色
        weight:
          type: string
          title: 重量
          examples:
            - 125g
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - xx平台
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        qc_desc:
          type: string
          title: 验货描述
          examples:
            - 无瑕疵
        images: *ref_5
      required:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      x-apifox-orders:
        - shape
        - color
        - weight
        - org_name
        - qc_no
        - qc_desc
        - images
      title: 珠宝信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    curio:
      type: object
      properties:
        size:
          type: string
          title: 尺寸
          examples:
            - 12mmx14mm
        material:
          type: string
          title: 材料
          examples:
            - 陶瓷
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 191
            - 192
            - 193
            - 194
            - 195
            - 196
            - 197
            - 198
            - 199
            - 1910
            - 1911
            - 1912
          examples:
            - 191
          description: |-
            枚举值：
            191 : NGC评级
            192 : PMG评级
            193 : 公博评级
            194 : PCGS评级
            195 : 众诚评级
            196 : 保粹评级
            197 : 华夏评级
            198 : 爱藏评级
            199 : 华龙盛世
            1910 : 国鉴鉴定
            1911 : 信泰评级
            1912 : 闻德评级
          x-apifox-enum:
            - value: 191
              name: ''
              description: NGC评级
            - value: 192
              name: ''
              description: PMG评级
            - value: 193
              name: ''
              description: 公博评级
            - value: 194
              name: ''
              description: PCGS评级
            - value: 195
              name: ''
              description: 众诚评级
            - value: 196
              name: ''
              description: 保粹评级
            - value: 197
              name: ''
              description: 华夏评级
            - value: 198
              name: ''
              description: 爱藏评级
            - value: 199
              name: ''
              description: 华龙盛世
            - value: 1910
              name: ''
              description: 国鉴鉴定
            - value: 1911
              name: ''
              description: 信泰评级
            - value: 1912
              name: ''
              description: 闻德评级
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - NGC评级
        qc_no:
          type: string
          title: 验货编码
          examples:
            - xxx
        images: *ref_5
      required:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      x-apifox-orders:
        - size
        - material
        - org_id
        - org_name
        - qc_no
        - images
      title: 文玩信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    beauty_makeup:
      type: object
      properties:
        brand:
          type: string
          title: 品牌
          examples:
            - 欧莱雅
        spec:
          type: string
          title: 规格
          examples:
            - 小瓶装
        level:
          type: string
          title: 成色
          examples:
            - 全新
        org_id:
          type: integer
          title: 检测机构ID
          format: int32
          enum:
            - 181
            - 182
          examples:
            - 181
          description: |-
            枚举值：
            181 : 维鉴
            182 : 中检科深
          x-apifox-enum:
            - value: 181
              name: ''
              description: 维鉴
            - value: 182
              name: ''
              description: 中检科深
        org_name:
          type: string
          title: 检测机构名称
          examples:
            - 维鉴
        images: *ref_5
      required:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      x-apifox-orders:
        - brand
        - spec
        - level
        - org_id
        - org_name
        - images
      title: 美妆信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    food_data:
      type: object
      properties:
        brand:
          type: string
          title: 食品品牌
          minLength: 1
          maxLength: 30
          examples:
            - 旺旺
        spec:
          type: string
          title: 食品规格
          minLength: 1
          maxLength: 30
          examples:
            - 大包
        pack:
          type: string
          title: 食品包装
          minLength: 1
          maxLength: 10
          examples:
            - 袋装
        expire:
          type: object
          properties:
            num:
              type: integer
              title: 保质期
              minimum: 1
              maximum: 9999
              format: int32
              examples:
                - 180
            unit:
              type: string
              title: 单位
              enum:
                - 天
                - 月
                - 年
              examples:
                - 天
              x-apifox-enum:
                - value: 天
                  name: ''
                  description: ''
                - value: 月
                  name: ''
                  description: ''
                - value: 年
                  name: ''
                  description: ''
          required:
            - num
            - unit
          x-apifox-orders:
            - num
            - unit
          title: 食品有效期信息
          x-apifox-ignore-properties: []
        production:
          type: object
          properties:
            date:
              type: string
              title: 食品生产日期
              minLength: 1
              maxLength: 20
              examples:
                - 2023-7-15
            address:
              type: object
              properties:
                detail:
                  type: string
                  title: 详细地址
                  minLength: 1
                  maxLength: 60
                province:
                  type: integer
                  title: 生产地省份ID
                  format: int32
                  examples:
                    - 110000
                city:
                  type: integer
                  title: 生产地城市ID
                  format: int32
                  examples:
                    - 110100
                district:
                  type: integer
                  title: 生产地地区ID
                  format: int32
                  examples:
                    - 110101
              required:
                - detail
                - province
                - city
                - district
              x-apifox-orders:
                - detail
                - province
                - city
                - district
              title: 食品生产地信息
              x-apifox-ignore-properties: []
          required:
            - date
            - address
          x-apifox-orders:
            - date
            - address
          title: 食品生产信息
          x-apifox-ignore-properties: []
      required:
        - brand
        - spec
        - pack
        - expire
        - production
      x-apifox-orders:
        - brand
        - spec
        - pack
        - expire
        - production
      title: 食品信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    book_data:
      type: object
      properties:
        isbn:
          type: string
          title: 图书ISBN码
          pattern: /^((?:[0-9]{9}X|[0-9]{10})|(?:(?:97(?:8|9))[0-9]{10}))$/
          additionalProperties: false
          examples:
            - '9787505720176'
        title:
          type: string
          title: 图书标题
          additionalProperties: false
          examples:
            - 北京法源寺
        author:
          type: string
          title: 图书作者
          additionalProperties: false
          examples:
            - 李敖
          minLength: 1
          maxLength: 30
        publisher:
          type: string
          title: 图书出版社
          additionalProperties: false
          examples:
            - 中国友谊出版公司
          minLength: 1
          maxLength: 30
      required:
        - isbn
        - title
      x-apifox-orders:
        - isbn
        - title
        - author
        - publisher
      title: 图书信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    sku_items:
      type: object
      properties:
        price: *ref_8
        stock:
          type: integer
          title: SKU库存
          maximum: 9999
          format: int32
          minimum: 0
          examples:
            - 10
        sku_text:
          type: string
          title: SKU规格
          examples:
            - 颜色:黑色;内存:512G
          description: |-
            格式：规格:属性，多个时使用";"拼接
            示例：颜色:白色;容量:128G
            限制：规格名称最多4个字，属性名称最多 20 个字（不分区中英文）
        outer_id:
          type: string
          title: SKU商品编码
          examples:
            - '2023072101'
          minLength: 0
          maxLength: 64
          description: 注意：一个中文按2个字符算
      x-apifox-orders:
        - price
        - stock
        - sku_text
        - outer_id
      required:
        - price
        - stock
        - sku_text
      title: SKU信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接

        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
    publish_shop:
      type: object
      properties:
        user_name:
          type: string
          title: 闲鱼会员名
          examples:
            - tb924343042
        province:
          type: integer
          title: 商品发货省份
          format: int32
          examples:
            - 110000
        city:
          type: integer
          title: 商品发货城市
          format: int32
          examples:
            - 110100
        district:
          type: integer
          title: 商品发货地区
          format: int32
          examples:
            - 110101
        title:
          type: string
          title: 商品标题
          description: 注意：一个中文按2个字符算
          minLength: 1
          examples:
            - iPhone 12 128G 黑色
          maxLength: 60
        content:
          type: string
          title: 商品描述
          description: 注意：一个中文按2个字符算，不支持HTML代码，可使用\n换行
          minLength: 5
          maxLength: 5000
          examples:
            - iPhone 12 128G 黑色 8新，非诚勿扰~~
        images: *ref_5
        white_images:
          type: string
          title: 商品白底图URL
          examples:
            - https://xxx.com/xxx1.jpg
          description: |-
            注意 ：
            1：如果传入会在闲鱼商品详情显示，并且无法删除，只能修改
            2：当商品类型是特卖类型，即`item_biz_type`=24时，`white_images`为必填
        service_support: *ref_9
      x-apifox-orders:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
        - white_images
        - service_support
      required:
        - user_name
        - province
        - city
        - district
        - title
        - content
        - images
      title: 店铺发布信息
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    images1:
      type: array
      items:
        type: string
        examples:
          - https://xxx.com/xxx1.jpg
      title: 图片信息
      minItems: 1
      maxItems: 30
      uniqueItems: true
      x-apifox-folder: ''
    stuff_status:
      type: integer
      title: 商品成色
      description: |-
        枚举值：
        0 : 无成色（普通商品可用）
        100 : 全新
         -1 : 准新 
        99 : 99新 
        95 : 95新 
        90 : 9新 
        80 : 8新 
        70 : 7新 
        60 : 6新 
        50 : 5新 

        -仅品牌捡漏类型可用-
        40 : 未使用·中度瑕疵
        30 : 未使用·轻微瑕疵
        20 : 未使用·仅拆封
        10 : 未使用·准新
        100 : 全新未使用
        -仅品牌捡漏类型可用-

        及以下注意：非普通商品类型时必填~~
      format: int32
      enum:
        - 100
        - -1
        - 99
        - 95
        - 90
        - 80
        - 70
        - 60
        - 50
        - 40
        - 30
        - 20
        - 10
        - 0
      default: 0
      examples:
        - 100
      x-apifox-enum:
        - value: 100
          name: ''
          description: 全新
        - value: -1
          name: ''
          description: 准新
        - value: 99
          name: ''
          description: 99新
        - value: 95
          name: ''
          description: 95新
        - value: 90
          name: ''
          description: 9新
        - value: 80
          name: ''
          description: 8新
        - value: 70
          name: ''
          description: 7新
        - value: 60
          name: ''
          description: 6新
        - value: 50
          name: ''
          description: 5新及以下
        - value: 40
          name: ''
          description: 未使用·中度瑕疵
        - value: 30
          name: ''
          description: 未使用·轻微瑕疵
        - value: 20
          name: ''
          description: 未使用·仅拆封
        - value: 10
          name: ''
          description: 未使用·准新
        - value: 0
          name: ''
          description: 无
      x-apifox-folder: ''
    express_fee:
      type: integer
      title: 运费
      format: int64
      x-apifox-folder: ''
    original_price:
      type: integer
      title: 商品原价
      minimum: 0
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    channel_pv:
      type: array
      items:
        type: object
        properties:
          property_id:
            type: string
            title: 属性ID
            examples:
              - 83b8f62c43df34e6
          property_name:
            type: string
            title: 属性名称
            examples:
              - 品牌
          value_id:
            type: string
            title: 属性值ID
            examples:
              - 76f78d92eeb4f5f6eccf7d4fabef47b6
          value_name:
            type: string
            title: 属性值名称
            examples:
              - Apple/苹果
        x-apifox-orders:
          - property_id
          - property_name
          - value_id
          - value_name
        required:
          - property_id
          - property_name
          - value_id
          - value_name
        x-apifox-ignore-properties: []
      title: 商品属性
      x-apifox-folder: ''
    sp_biz_type:
      type: integer
      title: 行业类型
      format: int32
      enum:
        - 1
        - 2
        - 3
        - 8
        - 9
        - 16
        - 17
        - 18
        - 19
        - 20
        - 21
        - 22
        - 23
        - 24
        - 25
        - 27
        - 28
        - 29
        - 30
        - 31
        - 33
        - 99
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 1
          description: 手机
        - name: ''
          value: 2
          description: 潮品
        - name: ''
          value: 3
          description: 家电
        - name: ''
          value: 8
          description: 乐器
        - name: ''
          value: 9
          description: 3C数码
        - name: ''
          value: 16
          description: 奢品
        - name: ''
          value: 17
          description: 母婴
        - name: ''
          value: 18
          description: 美妆个护
        - name: ''
          value: 19
          description: 文玩/珠宝
        - name: ''
          value: 20
          description: 游戏电玩
        - name: ''
          value: 21
          description: 家居
        - name: ''
          value: 22
          description: 虚拟游戏
        - name: ''
          value: 23
          description: 租号
        - name: ''
          value: 24
          description: 图书
        - name: ''
          value: 25
          description: 卡券
        - name: ''
          value: 27
          description: 食品
        - name: ''
          value: 28
          description: 潮玩
        - name: ''
          value: 29
          description: 二手车
        - name: ''
          value: 30
          description: 宠植
        - name: ''
          value: 31
          description: 工艺礼品
        - name: ''
          value: 33
          description: 汽车服务
        - name: ''
          value: 99
          description: 其他
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 编辑库存

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/edit/stock:
    post:
      summary: 编辑库存
      deprecated: false
      description: |-
        特别提醒：
        如果商品为在架状态时，会同步更新库存信息到闲鱼App上。
        如果商品不是在架状态，只会更新闲管家内的库存信息。
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                price:
                  type: integer
                  title: 商品售价（分）
                  description: 注意：多规格商品，必须是SKU其中一个金额
                  maximum: 9999999900
                  minimum: 1
                  examples:
                    - 199900
                original_price:
                  type: integer
                  title: 商品原价（分）
                  maximum: 9999999900
                  minimum: 0
                  examples:
                    - 299900
                stock:
                  type: integer
                  title: 单规格库存
                  description: 注意：单规格商品时必填
                  minimum: 0
                  maximum: 9999
                  examples:
                    - 10
                sku_items:
                  type: array
                  items:
                    type: object
                    properties:
                      sku_id:
                        type: integer
                        title: 管家SKU规格ID
                        format: int64
                        examples:
                          - 441870024105926
                      price:
                        title: SKU售价（分）
                        $ref: '#/components/schemas/price'
                      stock:
                        type: integer
                        title: SKU库存
                        maximum: 9999
                        format: int32
                        minimum: 0
                        examples:
                          - 10
                      outer_id:
                        type: string
                        title: SKU商品编码
                        examples:
                          - '2023072101'
                        minLength: 0
                        maxLength: 64
                    x-apifox-refs: {}
                    x-apifox-orders:
                      - sku_id
                      - price
                      - stock
                      - outer_id
                    required:
                      - sku_id
                      - stock
                    x-apifox-ignore-properties: []
                  description: 注意：多规格商品时必填，按需传入需要同步的sku库存即可
                  title: 多规格库存
              required:
                - product_id
              x-apifox-orders:
                - product_id
                - price
                - original_price
                - stock
                - sku_items
              x-apifox-ignore-properties: []
            example:
              product_id: 219530767978565
              stock: 99999
              sku_items:
                - stock: 6699
                  price: 99999
                  sku_id: 219530767978561
                - stock: 3982
                  price: 99999
                  sku_id: 219530767978562
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response_ok'
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data: {}
                '2':
                  summary: '异常示例 '
                  value:
                    status: 500
                    msg: Internal Server Error
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586384-run
components:
  schemas:
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 删除商品

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/product/delete:
    post:
      summary: 删除商品
      deprecated: false
      description: |-
        注意事项：
        该接口只能删除状态为草稿箱、待发布的商品， 注意：不会删除闲鱼APP已下架的商品，需要手动去闲鱼APP删除！
      tags:
        - 商品
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                  examples:
                    - 219530767978565
              required:
                - product_id
              x-apifox-orders:
                - product_id
              x-apifox-ignore-properties: []
            example:
              product_id: 220656347074629
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response_ok'
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data: {}
                '2':
                  summary: 异常示例
                  value:
                    code: 90
                    msg: incididunt aliquip
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 商品
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586383-run
components:
  schemas:
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询订单列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/order/list:
    post:
      summary: 查询订单列表
      deprecated: false
      description: |-
        ERP同步订单流程说明：
        第一步：在开放平台的自研应用中填写订单推送地址
        第二步：通过订单推送接口，接收订单信息
        第三步：通过订单查询接口，获取订单详情
      tags:
        - 订单
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              x-apifox-orders:
                - authorize_id
                - order_status
                - refund_status
                - order_time
                - pay_time
                - consign_time
                - confirm_time
                - refund_time
                - update_time
                - page_no
                - page_size
              properties:
                authorize_id:
                  type: integer
                  format: int64
                  title: 店铺授权ID
                order_status: &ref_1
                  title: 订单状态
                  $ref: '#/components/schemas/order_status'
                refund_status: &ref_2
                  $ref: '#/components/schemas/refund_status'
                  title: 退款状态
                order_time: &ref_0
                  title: 买家下单时间
                  $ref: '#/components/schemas/time_range'
                  deprecated: true
                pay_time: *ref_0
                consign_time: *ref_0
                confirm_time: *ref_0
                refund_time: *ref_0
                update_time: *ref_0
                page_no:
                  type: integer
                  title: 页码
                  minimum: 1
                  default: 1
                  maximum: 100
                  format: int32
                page_size:
                  type: integer
                  title: 每页行数
                  description: 当翻页获取的条数（page_no*page_size）超过1万，接口将报错，请尽可能的细化搜索条件
                  default: 50
                  minimum: 1
                  maximum: 100
                  format: int32
              x-apifox-ignore-properties: []
            example:
              page_size: 10
              page_no: 1
              order_status: 22
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    additionalProperties: false
                    format: int32
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data:
                    type: object
                    properties:
                      list:
                        type: array
                        items:
                          $ref: '#/components/schemas/order_detail'
                      count:
                        type: integer
                        format: int32
                        title: 查询总数
                      page_no:
                        type: integer
                        format: int32
                        title: 页码
                      page_size:
                        type: integer
                        format: int32
                        title: 每页行数
                    required:
                      - list
                      - count
                      - page_no
                      - page_size
                    x-apifox-orders:
                      - list
                      - count
                      - page_no
                      - page_size
                    x-apifox-ignore-properties: []
                required:
                  - code
                  - msg
                  - data
                x-apifox-orders:
                  - code
                  - msg
                  - data
                x-apifox-ignore-properties: []
              examples:
                '1':
                  summary: 成功示例
                  value:
                    code: 0
                    msg: OK
                    data:
                      list:
                        - order_no: '3364202298717566229'
                          order_status: 22
                          order_time: 1685087039
                          total_amount: 8000
                          pay_amount: 1
                          pay_no: '2023052622001114731441899001'
                          pay_time: 1685087067
                          refund_status: 0
                          refund_time: 0
                          receiver_mobile: '15889106633'
                          receiver_name: 萧祁锐
                          prov_name: 广东省
                          city_name: 深圳市
                          area_name: 南山区
                          town_name: 粤海街道
                          address: 桂庙新村
                          waybill_no: JT3032658260816
                          express_code: other
                          express_name: ''
                          express_fee: 0
                          consign_type: 1
                          consign_time: 1685087379
                          confirm_time: 1685951386
                          cancel_reason: ''
                          cancel_time: 0
                          create_time: 1685087040
                          update_time: 1685951390
                          buyer_eid: 6R97619OKz5WmtZ/cgibMA==
                          buyer_nick: 蓝兔子与精灵
                          seller_eid: 6R97619OKz5WmtZ/cgibMA==
                          seller_name: 逗逼猴子321123
                          seller_remark: ''
                          goods:
                            quantity: 1
                            price: 8000
                            product_id: 421611860404485
                            item_id: 709548670377
                            outer_id: '1111'
                            sku_id: 0
                            sku_outer_id: ''
                            sku_text: ''
                            title: 佳韵宝哺乳枕  买完后闺蜜又送了一个  标签都还没拆  便宜
                            images:
                              - >-
                                http://img.alicdn.com/bao/uploaded/i4/O1CN01VciDtc1gFLShhFzH9_!!53-fleamarket.heic
                            service_support: ''
                        - order_no: '3364342266781566229'
                          order_status: 22
                          order_time: 1685088183
                          total_amount: 4350
                          pay_amount: 1
                          pay_no: '2023052622001114731441822171'
                          pay_time: 1685088230
                          refund_status: 0
                          refund_time: 0
                          receiver_mobile: '15889106633'
                          receiver_name: 萧祁锐
                          prov_name: 广东省
                          city_name: 深圳市
                          area_name: 南山区
                          town_name: 粤海街道
                          address: 桂庙新村
                          waybill_no: ''
                          express_code: ''
                          express_name: ''
                          express_fee: 0
                          consign_type: 2
                          consign_time: 1686821376
                          confirm_time: 1687685382
                          cancel_reason: ''
                          cancel_time: 0
                          create_time: 1685088185
                          update_time: 1687685386
                          buyer_eid: 6R97619OKz5WmtZ/cgibMA==
                          buyer_nick: 蓝兔子与精灵
                          seller_eid: 6R97619OKz5WmtZ/cgibMA==
                          seller_name: 逗逼猴子321123
                          seller_remark: 订单卖家备注
                          goods:
                            quantity: 1
                            price: 4350
                            product_id: 421611860506885
                            item_id: 708245707949
                            outer_id: ''
                            sku_id: 5146011339969
                            sku_outer_id: ''
                            sku_text: 【款式】:充电款
                            title: 小黄鸭宝宝洗澡花洒戏水玩具小孩电动喷水婴儿沐浴儿童男孩女孩
                            images:
                              - >-
                                http://img.alicdn.com/bao/uploaded/i4/O1CN01iuNpnP1gFLRZFghNL_!!53-fleamarket.heic
                            service_support: ''
                '2':
                  summary: 异常示例
                  value:
                    code: 100004
                    msg: 请求参数错误, the value "{{timestamp}}" cannot parsed as int
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 订单
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-95074856-run
components:
  schemas:
    time_range:
      type: array
      items:
        type: integer
        format: int64
        x-apifox-mock: '@timestamp'
      title: 时间范围
      description: 第一个元素值为开始时间戳,第二个元素值为结束时间戳
      minItems: 2
      maxItems: 2
      x-apifox-folder: ''
    refund_status:
      type: integer
      title: 退款状态
      description: |-
        枚举值：
        0 : 未申请退款（表示买家没有申请退款）
        1 : 待商家处理（买家已经申请退款，等待卖家同意）
        2 : 待买家退货（卖家已经同意退款，等待买家退货）
        3 : 待商家收货（买家已经退货，等待卖家确认收货）
        4 : 退款关闭（买家取消退款/超时未处理自动关闭）
        5 : 退款成功（卖家同意退款/超时未处理自动退款）
        6 : 已拒绝退款（卖家拒绝退款）
        8 : 待确认退货地址（等待卖家确认退货地址）
      format: int32
      enum:
        - 0
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 8
      default: 0
      x-apifox-enum:
        - value: 0
          name: ''
          description: 未申请退款
        - value: 1
          name: ''
          description: 待商家处理
        - value: 2
          name: ''
          description: 待买家退货
        - value: 3
          name: ''
          description: 待商家收货
        - value: 4
          name: ''
          description: 退款关闭
        - value: 5
          name: ''
          description: 退款成功
        - value: 6
          name: ''
          description: 已拒绝退款
        - value: 8
          name: ''
          description: 待确认退货地址
      x-apifox-folder: ''
    order_status:
      type: integer
      title: 订单状态
      enum:
        - 11
        - 12
        - 21
        - 22
        - 23
        - 24
      format: int32
      x-apifox-enum:
        - name: ''
          value: 11
          description: 待付款
        - name: ''
          value: 12
          description: 待发货
        - name: ''
          value: 21
          description: 已发货
        - name: ''
          value: 22
          description: 已完成
        - name: ''
          value: 23
          description: 已退款
        - name: ''
          value: 24
          description: 已关闭
      x-apifox-folder: ''
    order_detail:
      type: object
      properties:
        order_no:
          type: string
          title: 闲鱼订单号
          examples:
            - '2226688164543566229'
        order_type:
          type: integer
          title: 订单类型
          format: int32
          enum:
            - 1
            - 2
            - 3
            - 4
            - 7
            - 8
            - 9
            - 10
            - 11
            - 12
            - 14
            - 15
            - 24
          x-apifox-enum:
            - name: ''
              value: 1
              description: 普通订单
            - name: ''
              value: 2
              description: 分销订单
            - name: ''
              value: 3
              description: 验货宝订单
            - name: ''
              value: 4
              description: 拍卖订单
            - name: ''
              value: 7
              description: 卡密订单
            - name: ''
              value: 8
              description: 直充订单
            - name: ''
              value: 9
              description: 严选订单
            - name: ''
              value: 10
              description: 特卖订单
            - value: 11
              name: ''
              description: 潮玩订单
            - value: 12
              name: ''
              description: 捡漏订单
            - value: 14
              name: ''
              description: 预售订单
            - value: 15
              name: ''
              description: 拼团订单
            - value: 24
              name: ''
              description: 跨境订单
        order_status: *ref_1
        order_time:
          type: integer
          format: int32
          title: 买家下单时间
          examples:
            - '1636021636'
        total_amount:
          type: integer
          format: int64
          title: 订单下单金额（分）
          examples:
            - '16000'
        pay_amount:
          type: integer
          title: 订单实付金额（分）
          format: int64
          examples:
            - '1'
        pay_time:
          type: integer
          format: int32
          title: 订单支付时间
          examples:
            - '1636021791'
        pay_no:
          type: string
          title: 支付宝交易号
          examples:
            - '2021110422001114735717689066'
        refund_status: *ref_2
        refund_amount:
          type: integer
          title: 订单退款金额（分）
          format: int64
          examples:
            - '1'
        refund_time:
          type: integer
          title: 订单退款时间
          description: 仅退款成功有值
          format: int32
          examples:
            - 1636077361
        receiver_name:
          type: string
          examples:
            - 张三
          description: 仅待发货状态返回
          title: 收货人姓名
        receiver_mobile:
          type: string
          description: 仅待发货状态返回
          examples:
            - '13800138000'
          title: 收货人号码
        prov_name:
          type: string
          examples:
            - 广东省
          description: 仅待发货状态返回
          title: 收货省份
        city_name:
          type: string
          examples:
            - 深圳市
          description: 仅待发货状态返回
          title: 收货城市
        area_name:
          type: string
          examples:
            - 南山区
          description: 仅待发货状态返回
          title: 收货地区
        town_name:
          type: string
          examples:
            - 粤海街道
          description: 仅待发货状态返回
          title: 收货街道
        address:
          type: string
          examples:
            - 桂庙新村100室
          description: 仅待发货状态返回
          title: 收货详细地址
        waybill_no:
          type: string
          title: 快递单号
          examples:
            - SF23817389113
        express_code:
          type: string
          title: 快递公司代码
          examples:
            - shunfeng
        express_name:
          type: string
          title: 快递公司名称
          examples:
            - 顺丰速运
        express_fee:
          type: integer
          format: int32
          title: 运费（分）
          examples:
            - '0'
        consign_time:
          type: integer
          format: int32
          title: 订单发货时间
          examples:
            - '1636021854'
        consign_type:
          type: integer
          title: 订单发货类型
          format: int32
          enum:
            - 1
            - 2
          description: |-
            枚举值：
            1 : 物流发货
            2 : 虚拟发货
          x-apifox-enum:
            - name: ''
              value: 1
              description: 物流发货
            - name: ''
              value: 2
              description: 虚拟发货
        confirm_time:
          type: integer
          format: int32
          title: 订单成交时间
          examples:
            - '1636077361'
        cancel_reason:
          type: string
          title: 订单取消原因
          examples:
            - 不想要了
        cancel_time:
          type: integer
          format: int32
          title: 订单取消时间
          examples:
            - '1636077361'
        create_time:
          type: integer
          format: int32
          title: 订单创建时间
        update_time:
          type: integer
          format: int32
          title: 订单更新时间
          examples:
            - '1636077365'
        buyer_eid:
          type: string
          title: 买家标识
          examples:
            - 6R97619OKz5WmtZ/cgibMA==
          description: 闲鱼体系内唯一的用户标识
        buyer_nick:
          type: string
          title: 买家昵称
          examples:
            - 疯狂小子
        seller_eid:
          type: string
          title: 卖家标识
          examples:
            - 6R97619OKz5WmtZ/cgibMA==
          description: 与闲鱼店铺`user_identity`字段一致（闲鱼内唯一且不变）
        seller_name:
          type: string
          title: 卖家会员名
          examples:
            - tb924343042
          description: 与闲鱼店铺`user_name`字段一致（存在变更的可能性）
        seller_remark:
          type: string
          title: 卖家备注
          examples:
            - 疫情期间暂停发货
        idle_biz_type:
          type: integer
          format: int32
          enum:
            - 20
          x-apifox-enum:
            - value: 20
              name: 拼团订单
              description: ''
          examples:
            - 20
          title: 子业务类型
          description: |-
            枚举值：
            20：拼团订单
        pin_group_status:
          type: integer
          title: 拼团状态
          description: |-
            枚举值：
            1：拼团中
            2：拼团成功
            3：拼团超时
          format: int32
          examples:
            - 1
          enum:
            - 1
            - 2
            - 3
          x-apifox-enum:
            - value: 1
              name: 拼团中
              description: ''
            - value: 2
              name: 拼团成功
              description: ''
            - value: 3
              name: 拼团超时
              description: ''
        is_tax_included:
          type: boolean
          title: 是否包含税费
          description: 目前仅用于跨境订单
        goods:
          type: object
          properties:
            quantity:
              type: integer
              format: int32
              title: 购买数量
              examples:
                - '2'
            price:
              type: integer
              format: int64
              title: 商品单价（分）
              examples:
                - '8000'
            product_id:
              type: integer
              title: 管家商品ID
              format: int64
            item_id:
              type: integer
              title: 闲鱼商品ID
              examples:
                - '659437081448'
              format: int64
            outer_id:
              type: string
              title: 商家编码
              examples:
                - GJKCS01234
            sku_id:
              type: integer
              title: 管家SKU规格ID
              format: int64
              examples:
                - 219530767978567
            sku_outer_id:
              type: string
              title: 商家SKU编码
              examples:
                - gjkcs404
            sku_text:
              type: string
              title: SKU规格
              examples:
                - 颜色:黑色;大小:小
            title:
              type: string
              title: 商品标题
              examples:
                - 公交卡测试
            images:
              type: array
              items:
                type: string
              title: 商品主图
            service_support:
              title: 商品服务项
              $ref: '#/components/schemas/service_support'
          required:
            - quantity
            - price
            - product_id
            - item_id
            - outer_id
            - sku_id
            - sku_outer_id
            - sku_text
            - title
            - images
            - service_support
          title: 商品信息
          x-apifox-orders:
            - quantity
            - price
            - product_id
            - item_id
            - outer_id
            - sku_id
            - sku_outer_id
            - sku_text
            - title
            - images
            - service_support
          x-apifox-ignore-properties: []
      required:
        - order_no
        - order_type
        - order_status
        - order_time
        - total_amount
        - pay_amount
        - pay_time
        - pay_no
        - refund_status
        - refund_amount
        - refund_time
        - waybill_no
        - express_code
        - express_name
        - express_fee
        - consign_time
        - consign_type
        - confirm_time
        - cancel_reason
        - cancel_time
        - create_time
        - update_time
        - buyer_eid
        - buyer_nick
        - seller_eid
        - seller_name
        - seller_remark
        - idle_biz_type
        - pin_group_status
        - goods
      x-apifox-orders:
        - order_no
        - order_type
        - order_status
        - order_time
        - total_amount
        - pay_amount
        - pay_time
        - pay_no
        - refund_status
        - refund_amount
        - refund_time
        - receiver_name
        - receiver_mobile
        - prov_name
        - city_name
        - area_name
        - town_name
        - address
        - waybill_no
        - express_code
        - express_name
        - express_fee
        - consign_time
        - consign_type
        - confirm_time
        - cancel_reason
        - cancel_time
        - create_time
        - update_time
        - buyer_eid
        - buyer_nick
        - seller_eid
        - seller_name
        - seller_remark
        - idle_biz_type
        - pin_group_status
        - is_tax_included
        - goods
      title: 订单详情
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    service_support:
      type: string
      title: 商品服务项
      description: |-
        多个时用英文逗号`,`拼接

        枚举值：
        SDR : 七天无理由退货
        NFR : 描述不符包邮退
        VNR : 描述不符全额退（虚拟类）
        FD_10MS : 10分钟极速发货（虚拟类）
        FD_24HS : 24小时极速发货
        FD_48HS : 48小时极速发货
        FD_GPA : 正品保障（包赔）
        NFGC : 不符必赔
        RISK_30D : 30天收货
        RISK_90D : 90天收货  
      examples:
        - SDR,NFR
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 查询订单详情

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/order/detail:
    post:
      summary: 查询订单详情
      deprecated: false
      description: ''
      operationId: GetOpenOrderDetail
      tags:
        - 订单
        - order
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GetOpenOrderDetailReq'
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetOpenOrderDetailResp'
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
                x-apifox-ignore-properties: []
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 订单
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586385-run
components:
  schemas:
    GetOpenOrderDetailReq:
      type: object
      properties:
        order_no:
          type: string
          description: ' 闲鱼订单号，示例：2226688164543566229'
      title: GetOpenOrderDetailReq
      required:
        - order_no
      x-apifox-orders:
        - order_no
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    GetOpenOrderDetailResp:
      type: object
      properties:
        order_no:
          type: string
          description: ' 闲鱼订单号'
        order_status:
          type: integer
          format: int32
          description: ' 订单状态'
        order_type:
          type: integer
          format: int32
          description: ' 订单类型'
        order_time:
          type: integer
          format: int64
          description: ' 买家下单时间'
        total_amount:
          type: integer
          format: int64
          description: ' 订单下单金额（分）'
        pay_amount:
          type: integer
          format: int64
          description: ' 订单实付金额（分）'
        pay_no:
          type: string
          description: ' 支付宝交易号'
        pay_time:
          type: integer
          format: int64
          description: ' 订单支付时间'
        refund_status:
          type: integer
          format: int32
          description: ' 订单退款状态'
        refund_amount:
          type: integer
          format: int64
          examples:
            - '1'
          description: 订单退款金额（分）
        refund_time:
          type: integer
          format: int64
          description: ' 订单退款时间，仅退款成功有值'
        receiver_mobile:
          type: string
          description: ' 收货人号码，仅待发货状态返回'
        receiver_name:
          type: string
          description: ' 收货人姓名，仅待发货状态返回'
        prov_name:
          type: string
          description: ' 收货省份，仅待发货状态返回'
        city_name:
          type: string
          description: ' 收货城市，仅待发货状态返回'
        area_name:
          type: string
          description: ' 收货地区，仅待发货状态返回'
        town_name:
          type: string
          description: ' 收货街道，仅待发货状态返回'
        address:
          type: string
          description: ' 收货详情地址，仅待发货状态返回'
        waybill_no:
          type: string
          description: ' 快递单号'
        express_code:
          type: string
          description: ' 快递公司代码'
        express_name:
          type: string
          description: ' 快递公司名称'
        express_fee:
          type: integer
          format: int32
          description: ' 运费（分）'
        consign_type:
          type: integer
          format: int32
          description: ' 订单发货类型，枚举值：; 1 : 物流发货; 2 : 虚拟发货'
        consign_time:
          type: integer
          format: int64
          description: ' 订单发货时间'
        confirm_time:
          type: integer
          format: int64
          description: ' 订单成交时间'
        cancel_reason:
          type: string
          description: ' 订单取消原因'
        cancel_time:
          type: integer
          format: int64
          description: ' 订单取消时间'
        create_time:
          type: integer
          format: int64
          description: ' 订单创建时间'
        update_time:
          type: integer
          format: int64
          description: ' 订单更新时间'
        buyer_eid:
          type: string
          description: ' 买家标识，闲鱼体系内唯一的用户标识'
        buyer_nick:
          type: string
          description: ' 买家昵称'
        seller_eid:
          type: string
          description: ' 卖家标识，闲鱼体系内唯一的用户标识'
        seller_name:
          type: string
          description: ' 卖家会员名'
        seller_remark:
          type: string
          description: ' 卖家备注'
        idle_biz_type:
          type: integer
          format: int32
          description: ' 子业务类型'
        pin_group_status:
          type: integer
          format: int32
          description: ' 拼团状态'
        goods:
          $ref: '#/components/schemas/Goods'
        xyb_seller_amount:
          type: integer
          format: int64
          description: ' 卖家应收闲鱼币'
        is_tax_included:
          type: boolean
          title: 是否包含税费
          description: 目前仅用于跨境订单
      title: GetOpenOrderDetailResp
      required:
        - order_no
        - order_status
        - order_type
        - order_time
        - total_amount
        - pay_amount
        - pay_no
        - pay_time
        - refund_status
        - refund_amount
        - refund_time
        - receiver_mobile
        - receiver_name
        - prov_name
        - city_name
        - area_name
        - town_name
        - address
        - waybill_no
        - express_code
        - express_name
        - express_fee
        - consign_type
        - consign_time
        - confirm_time
        - cancel_reason
        - cancel_time
        - create_time
        - update_time
        - buyer_eid
        - buyer_nick
        - seller_eid
        - seller_name
        - seller_remark
        - idle_biz_type
        - pin_group_status
        - goods
        - xyb_seller_amount
      x-apifox-orders:
        - order_no
        - order_status
        - order_type
        - order_time
        - total_amount
        - pay_amount
        - pay_no
        - pay_time
        - refund_status
        - refund_amount
        - refund_time
        - receiver_mobile
        - receiver_name
        - prov_name
        - city_name
        - area_name
        - town_name
        - address
        - waybill_no
        - express_code
        - express_name
        - express_fee
        - consign_type
        - consign_time
        - confirm_time
        - cancel_reason
        - cancel_time
        - create_time
        - update_time
        - buyer_eid
        - buyer_nick
        - seller_eid
        - seller_name
        - seller_remark
        - idle_biz_type
        - pin_group_status
        - goods
        - xyb_seller_amount
        - is_tax_included
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    Goods:
      type: object
      properties:
        quantity:
          type: integer
          format: int32
          description: ' 购买数量'
        price:
          type: integer
          format: int64
          description: ' 商品单价（分）'
        product_id:
          type: integer
          format: int64
          description: ' 管家商品ID'
        item_id:
          type: integer
          format: int64
          description: ' 闲鱼商品ID'
        outer_id:
          type: string
          description: ' 商家编码'
        sku_id:
          type: integer
          format: int64
          description: ' 管家SKUID'
        sku_outer_id:
          type: string
          description: ' 商家SKU编码'
        sku_text:
          type: string
          description: ' SKU规格'
        title:
          type: string
          description: ' 商品标题'
        images:
          type: array
          items:
            type: string
          description: ' 商品主图'
        service_support:
          type: string
          description: ' 商品服务项'
      title: Goods
      required:
        - quantity
        - price
        - product_id
        - item_id
        - outer_id
        - sku_id
        - sku_outer_id
        - sku_text
        - title
        - images
        - service_support
      x-apifox-orders:
        - quantity
        - price
        - product_id
        - item_id
        - outer_id
        - sku_id
        - sku_outer_id
        - sku_text
        - title
        - images
        - service_support
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 订单修改价格

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/order/modify/price:
    post:
      summary: 订单修改价格
      deprecated: false
      description: ''
      tags:
        - 订单
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                order_no:
                  type: string
                  title: 闲鱼订单号
                express_fee:
                  type: integer
                  title: 运费金额（分）
                  description: 注意：传入`0`表示包邮
                  format: int64
                  minimum: 0
                order_price:
                  type: integer
                  title: 订单价格（分）
                  minimum: 1
                  format: int64
              x-apifox-orders:
                - order_no
                - order_price
                - express_fee
              required:
                - order_no
                - order_price
                - express_fee
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: object
                    properties: {}
                    x-apifox-orders: []
                  01JAPECKZN4F793XEW7E05GW0R:
                    type: string
                required:
                  - code
                  - msg
                  - data
                  - 01JAPECKZN4F793XEW7E05GW0R
                x-apifox-orders:
                  - code
                  - msg
                  - data
                  - 01JAPECKZN4F793XEW7E05GW0R
              example:
                code: 0
                msg: ok
                data: {}
          headers: {}
          x-apifox-name: 成功
        x-200:失败:
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  msg:
                    type: string
                    examples:
                      - Internal Server Error
                    additionalProperties: false
                  code:
                    type: integer
                    format: int32
                    examples:
                      - 500
                    additionalProperties: false
                required:
                  - code
                  - msg
                x-apifox-orders:
                  - code
                  - msg
          headers: {}
          x-apifox-name: 失败
      security: []
      x-apifox-folder: 订单
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-333703388-run
components:
  schemas: {}
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 商品回调通知

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /product/receive（这里仅做示例）:
    post:
      summary: 商品回调通知
      deprecated: false
      description: '###请商家自行在上架商品和编辑商品接口填写真实的推送地址###'
      tags:
        - 推送
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                seller_id:
                  type: integer
                  format: int64
                  title: 商家ID
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                product_status:
                  title: 商品状态
                  $ref: '#/components/schemas/product_status'
                publish_status:
                  $ref: '#/components/schemas/publish_status'
                  title: 发布状态
                item_biz_type:
                  $ref: '#/components/schemas/item_biz_type'
                  title: 商品类型
                user_name:
                  type: string
                  title: 闲鱼会员名
                item_id:
                  type: integer
                  title: 闲鱼商品ID
                  format: int64
                task_type:
                  type: integer
                  title: 任务类型
                  description: |-
                    枚举值：
                    10 : 上架新商品
                    11 : 上架存量商品
                    13 : 编辑在架商品
                  enum:
                    - 10
                    - 11
                    - 13
                  format: int32
                  x-apifox-enum:
                    - value: 10
                      name: ''
                      description: 上架新商品
                    - value: 11
                      name: ''
                      description: 上架存量商品
                    - value: 13
                      name: ''
                      description: 编辑在架商品
                task_time:
                  type: integer
                  title: 任务执行时间
                  format: int64
                task_result:
                  type: integer
                  title: 任务执行结果
                  description: |-
                    枚举值：
                    1 : 执行成功
                    2 : 执行失败
                  enum:
                    - 1
                    - 2
                  format: int32
                  x-apifox-enum:
                    - value: 1
                      name: ''
                      description: 执行成功
                    - value: 2
                      name: ''
                      description: 执行失败
                err_code:
                  type: string
                  title: 错误码
                err_msg:
                  type: string
                  title: 错误描述
              x-apifox-orders:
                - seller_id
                - product_id
                - product_status
                - publish_status
                - item_biz_type
                - user_name
                - item_id
                - task_type
                - task_time
                - task_result
                - err_code
                - err_msg
              required:
                - seller_id
                - product_id
                - product_status
                - publish_status
                - item_biz_type
                - user_name
                - task_type
                - task_time
                - task_result
              x-apifox-ignore-properties: []
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_ok'
          headers: {}
          x-apifox-name: 成功
        x-200:异常:
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_fail'
          headers: {}
          x-apifox-name: 异常
      security: []
      x-apifox-folder: 推送
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-98676477-run
components:
  schemas:
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    publish_status:
      type: integer
      title: 发布状态
      description: |-
        枚举值：
        -1：不可操作（不可上架/编辑）
        1：草稿箱（可编辑/删除）
        2：待发布（可上架/编辑/删除）
        3：销售中（可下架/编辑）
        4：已下架（可上架/编辑/删除）
        5：已售罄（可上架/编辑/删除）
        9：商品异常（可编辑/删除）
      enum:
        - -1
        - 1
        - 2
        - 3
        - 4
        - 5
        - 9
      format: int32
      examples:
        - 2
      x-apifox-enum:
        - value: -1
          name: ''
          description: 不可操作
        - value: 1
          name: ''
          description: 草稿箱
        - value: 2
          name: ''
          description: 待发布
        - value: 3
          name: ''
          description: 销售中
        - value: 4
          name: ''
          description: 已下架
        - value: 5
          name: ''
          description: 已售罄
        - value: 9
          name: ''
          description: 商品异常
      x-apifox-folder: ''
    product_status:
      type: integer
      title: 商品状态
      description: '枚举值：-1 : 已删除21 : 待发布22 : 销售中23 : 已售罄31 : 手动下架33 : 售出下架36 : 自动下架'
      format: int32
      enum:
        - -1
        - 21
        - 22
        - 23
        - 31
        - 33
        - 36
      default: 0
      examples:
        - 21
      x-apifox-enum:
        - value: -1
          name: ''
          description: 删除
        - value: 21
          name: ''
          description: 待发布
        - value: 22
          name: ''
          description: 销售中
        - value: 23
          name: ''
          description: 已售罄
        - value: 31
          name: ''
          description: 手动下架
        - value: 33
          name: ''
          description: 售出下架
        - value: 36
          name: ''
          description: 自动下架
      x-apifox-folder: ''
    notify_resp_ok:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: success
        msg:
          type: string
          title: 描述
          examples:
            - 接收成功
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送成功响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    notify_resp_fail:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: fail
        msg:
          type: string
          title: 描述
          examples:
            - 签名失败
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送失败响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 商品推送通知

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /product/receive（这里仅做示例）:
    post:
      summary: 商品推送通知
      deprecated: false
      description: '###请商家自行在闲管家的开放平台填写真实的推送地址###'
      tags:
        - 推送
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                seller_id:
                  type: integer
                  format: int64
                  title: 商家ID
                product_id:
                  type: integer
                  title: 管家商品ID
                  format: int64
                  examples:
                    - 441160510721413
                product_status:
                  title: 商品状态
                  $ref: '#/components/schemas/product_status'
                publish_status:
                  title: 发布状态
                  $ref: '#/components/schemas/publish_status'
                item_biz_type:
                  $ref: '#/components/schemas/item_biz_type'
                  title: 商品类型
                price:
                  title: 商品售价
                  $ref: '#/components/schemas/price'
                stock:
                  type: integer
                  title: 商品库存
                  minimum: 1
                  maximum: 399960
                  format: int32
                  examples:
                    - 1
                user_name:
                  type: string
                  title: 闲鱼会员名
                  examples:
                    - tb924343042
                modify_time:
                  type: integer
                  title: 商品更新时间
                  examples:
                    - 1636077365
              required:
                - seller_id
                - product_id
                - product_status
                - publish_status
                - item_biz_type
                - price
                - stock
                - user_name
                - modify_time
              x-apifox-orders:
                - seller_id
                - product_id
                - product_status
                - publish_status
                - item_biz_type
                - price
                - stock
                - user_name
                - modify_time
              x-apifox-ignore-properties: []
            example:
              product_id: 458193644184453
              product_status: 22
              price: 5500
              stock: 1
              user_name: tb924343042
              modify_time: 1694000092
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_ok'
              example:
                result: success
                msg: 接收成功
          headers: {}
          x-apifox-name: 成功
        x-200:异常:
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_fail'
              example:
                result: fail
                msg: mollit in tempor cupidatat in
          headers: {}
          x-apifox-name: 异常
      security: []
      x-apifox-folder: 推送
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-108700789-run
components:
  schemas:
    price:
      type: integer
      title: 商品售价
      minimum: 1
      maximum: 9999999900
      format: int64
      examples:
        - 199900
      x-apifox-folder: ''
    item_biz_type:
      type: integer
      title: 商品类型
      format: int32
      enum:
        - 2
        - 0
        - 10
        - 16
        - 19
        - 24
        - 26
        - 35
      examples:
        - 2
      x-apifox-enum:
        - name: ''
          value: 2
          description: 普通商品
        - name: ''
          value: 0
          description: 已验货
        - name: ''
          value: 10
          description: 验货宝
        - name: ''
          value: 16
          description: 品牌授权
        - name: ''
          value: 19
          description: 闲鱼严选
        - name: ''
          value: 24
          description: 闲鱼特卖
        - name: ''
          value: 26
          description: 品牌捡漏
        - value: 35
          name: ''
          description: 跨境商品
      x-apifox-folder: ''
    publish_status:
      type: integer
      title: 发布状态
      description: |-
        枚举值：
        -1：不可操作（不可上架/编辑）
        1：草稿箱（可编辑/删除）
        2：待发布（可上架/编辑/删除）
        3：销售中（可下架/编辑）
        4：已下架（可上架/编辑/删除）
        5：已售罄（可上架/编辑/删除）
        9：商品异常（可编辑/删除）
      enum:
        - -1
        - 1
        - 2
        - 3
        - 4
        - 5
        - 9
      format: int32
      examples:
        - 2
      x-apifox-enum:
        - value: -1
          name: ''
          description: 不可操作
        - value: 1
          name: ''
          description: 草稿箱
        - value: 2
          name: ''
          description: 待发布
        - value: 3
          name: ''
          description: 销售中
        - value: 4
          name: ''
          description: 已下架
        - value: 5
          name: ''
          description: 已售罄
        - value: 9
          name: ''
          description: 商品异常
      x-apifox-folder: ''
    product_status:
      type: integer
      title: 商品状态
      description: '枚举值：-1 : 已删除21 : 待发布22 : 销售中23 : 已售罄31 : 手动下架33 : 售出下架36 : 自动下架'
      format: int32
      enum:
        - -1
        - 21
        - 22
        - 23
        - 31
        - 33
        - 36
      default: 0
      examples:
        - 21
      x-apifox-enum:
        - value: -1
          name: ''
          description: 删除
        - value: 21
          name: ''
          description: 待发布
        - value: 22
          name: ''
          description: 销售中
        - value: 23
          name: ''
          description: 已售罄
        - value: 31
          name: ''
          description: 手动下架
        - value: 33
          name: ''
          description: 售出下架
        - value: 36
          name: ''
          description: 自动下架
      x-apifox-folder: ''
    notify_resp_ok:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: success
        msg:
          type: string
          title: 描述
          examples:
            - 接收成功
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送成功响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    notify_resp_fail:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: fail
        msg:
          type: string
          title: 描述
          examples:
            - 签名失败
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送失败响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 订单推送通知

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /order/receive（这里仅做示例）:
    post:
      summary: 订单推送通知
      deprecated: false
      description: |-
        ###请商家自行在闲管家的开放平台填写真实的推送地址###

        注意事项：
        1：订单信息/订单状态/退款状态发生变更时推送
        2：请确保该接口稳定，如果推送失败，最多重试三次
        3：只有响应报文的result字段返回success，才认为成功 
        4：接口请求超时时间为3秒（建议接收到推送通知后，异步处理业务逻辑）
      tags:
        - 推送
      parameters:
        - name: appid
          in: query
          description: 开放平台的AppKey
          required: true
          example: '{{appid}}'
          schema:
            type: integer
            default: '{{appid}}'
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                seller_id:
                  type: integer
                  format: int64
                  title: 商家ID
                user_name:
                  type: string
                  title: 闲鱼会员名
                  examples:
                    - tb924343042
                order_no:
                  type: string
                  title: 闲鱼订单号
                  examples:
                    - '2226688164543566229'
                order_type:
                  type: integer
                  title: 订单类型
                  format: int32
                  enum:
                    - 1
                    - 2
                    - 3
                    - 4
                    - 7
                    - 8
                    - 9
                    - 10
                  x-apifox-enum:
                    - name: ''
                      value: 1
                      description: 普通订单
                    - name: ''
                      value: 2
                      description: 分销订单
                    - name: ''
                      value: 3
                      description: 验货宝订单
                    - name: ''
                      value: 4
                      description: 拍卖订单
                    - name: ''
                      value: 7
                      description: 卡密订单
                    - name: ''
                      value: 8
                      description: 直充订单
                    - name: ''
                      value: 9
                      description: 严选订单
                    - name: ''
                      value: 10
                      description: 特卖订单
                order_status:
                  title: 订单状态
                  $ref: '#/components/schemas/order_status'
                refund_status:
                  title: 退款状态
                  $ref: '#/components/schemas/refund_status'
                modify_time:
                  type: integer
                  title: 订单更新时间
                  examples:
                    - 1636077365
                product_id:
                  type: integer
                  title: 管家商品ID
                item_id:
                  type: integer
                  title: 闲鱼商品ID
              required:
                - seller_id
                - user_name
                - order_no
                - order_type
                - order_status
                - refund_status
                - modify_time
                - product_id
                - item_id
              x-apifox-orders:
                - seller_id
                - user_name
                - order_no
                - order_type
                - order_status
                - refund_status
                - modify_time
                - product_id
                - item_id
              x-apifox-ignore-properties: []
            example:
              order_no: '1339920336328048683'
              order_status: 11
              refund_status: 1
              modify_time: 1636013302
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_ok'
              example:
                result: success
                msg: 接收成功
          headers: {}
          x-apifox-name: 成功
        x-200:异常:
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/notify_resp_fail'
              example:
                result: fail
                msg: mollit in tempor cupidatat in
          headers: {}
          x-apifox-name: 异常
      security: []
      x-apifox-folder: 推送
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-93586387-run
components:
  schemas:
    refund_status:
      type: integer
      title: 退款状态
      description: |-
        枚举值：
        0 : 未申请退款（表示买家没有申请退款）
        1 : 待商家处理（买家已经申请退款，等待卖家同意）
        2 : 待买家退货（卖家已经同意退款，等待买家退货）
        3 : 待商家收货（买家已经退货，等待卖家确认收货）
        4 : 退款关闭（买家取消退款/超时未处理自动关闭）
        5 : 退款成功（卖家同意退款/超时未处理自动退款）
        6 : 已拒绝退款（卖家拒绝退款）
        8 : 待确认退货地址（等待卖家确认退货地址）
      format: int32
      enum:
        - 0
        - 1
        - 2
        - 3
        - 4
        - 5
        - 6
        - 8
      default: 0
      x-apifox-enum:
        - value: 0
          name: ''
          description: 未申请退款
        - value: 1
          name: ''
          description: 待商家处理
        - value: 2
          name: ''
          description: 待买家退货
        - value: 3
          name: ''
          description: 待商家收货
        - value: 4
          name: ''
          description: 退款关闭
        - value: 5
          name: ''
          description: 退款成功
        - value: 6
          name: ''
          description: 已拒绝退款
        - value: 8
          name: ''
          description: 待确认退货地址
      x-apifox-folder: ''
    order_status:
      type: integer
      title: 订单状态
      enum:
        - 11
        - 12
        - 21
        - 22
        - 23
        - 24
      format: int32
      x-apifox-enum:
        - name: ''
          value: 11
          description: 待付款
        - name: ''
          value: 12
          description: 待发货
        - name: ''
          value: 21
          description: 已发货
        - name: ''
          value: 22
          description: 已完成
        - name: ''
          value: 23
          description: 已退款
        - name: ''
          value: 24
          description: 已关闭
      x-apifox-folder: ''
    notify_resp_ok:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: success
        msg:
          type: string
          title: 描述
          examples:
            - 接收成功
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送成功响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    notify_resp_fail:
      type: object
      properties:
        result:
          type: string
          title: 结果
          const: fail
        msg:
          type: string
          title: 描述
          examples:
            - 签名失败
      required:
        - result
        - msg
      x-apifox-orders:
        - result
        - msg
      title: 推送失败响应报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```


### 无需物流发货

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/trade/logistics/dummy/send:
    post:
      summary: 无需物流发货
      deprecated: false
      description: 注意：send_way=2时，如果卡密商品设置了发货申明，买家不确认是不会发送卡密的
      operationId: OpenLogisticsDummySend
      tags:
        - 订单
        - trade
      parameters:
        - name: appid
          in: query
          description: ''
          required: true
          example: '{{appid}}'
          schema:
            type: string
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
            default: '{{timestamp}}'
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OpenLogisticsDummySendReq'
            example:
              order_no: '11111111111111'
              send_way: 2
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/response_ok'
              example:
                code: 0
                msg: ok
                data: {}
          headers: {}
          x-apifox-name: ''
      security: []
      x-apifox-folder: 订单
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-495532178-run
components:
  schemas:
    OpenLogisticsDummySendReq:
      type: object
      properties:
        order_no:
          type: string
          description: ' 闲鱼订单号'
        send_way:
          type: integer
          format: int32
          description: ' 发货方式 1：仅更新订单状态；2：发卡密并更新订单状态'
      title: OpenLogisticsDummySendReq
      required:
        - order_no
        - send_way
      x-apifox-orders:
        - order_no
        - send_way
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
    response_ok:
      type: object
      properties:
        code:
          type: integer
          format: int32
          additionalProperties: false
          default: 0
        msg:
          type: string
          additionalProperties: false
          default: OK
        data:
          type: object
          properties: {}
          x-apifox-orders: []
          additionalProperties: false
          x-apifox-ignore-properties: []
      x-apifox-orders:
        - code
        - msg
        - data
      required:
        - code
        - msg
        - data
      title: 成功报文
      x-apifox-ignore-properties: []
      x-apifox-folder: ''
  securitySchemes:
    apiKey:
      type: apikey
      description: Enter JWT Bearer token **_only_**
      name: Authorization
      in: header
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```

### 售后订单列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/trade/refund/list:
    post:
      summary: 售后订单列表
      deprecated: false
      description: ''
      operationId: OpenRefundList
      tags:
        - 售后
        - trade
      parameters:
        - name: appid
          in: query
          description: ''
          required: true
          example: '{{appid}}'
          schema:
            type: string
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          example: '{{timestamp}}'
          schema:
            type: integer
            default: '{{timestamp}}'
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          example: '{{seller_id}}'
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          example: '{{sign}}'
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OpenRefundListReq'
            examples: {}
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                x-apifox-refs: {}
                x-apifox-orders:
                  - code
                  - msg
                  - data
                properties:
                  code:
                    type: integer
                    format: int32
                    additionalProperties: false
                    default: 0
                  msg:
                    type: string
                    additionalProperties: false
                    default: OK
                  data:
                    type: object
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          properties:
                            refund_no:
                              type: string
                              description: 注意：多次申请退款时，该退款单号会变更
                              title: ' 闲鱼退款单号'
                            order_no:
                              type: string
                              title: ' 闲鱼订单号'
                            seller_eid:
                              type: string
                              description: 闲鱼体系内唯一的用户标识
                              title: ' 卖家标识'
                            seller_name:
                              type: string
                              title: ' 卖家会员名'
                            goods_status:
                              title: ' 商品状态'
                              $ref: '#/components/schemas/goods_status'
                            refund_type:
                              title: ' 退款类型'
                              $ref: '#/components/schemas/refund_type'
                            refund_status:
                              title: ' 售后单退款状态'
                              $ref: '#/components/schemas/refund_status'
                            refund_amount:
                              type: integer
                              format: int64
                              title: 订单已退款金额
                              description: 注意：多次退款的总金额
                            apply_amount:
                              type: integer
                              format: int64
                              title: 当前申请退款金额
                              description: 注意：单次申请退款的金额
                            refund_time:
                              type: integer
                              format: int64
                              description: 仅退款成功有值
                              title: ' 订单退款时间'
                            apply_time:
                              type: integer
                              format: int64
                              title: ' 售后申请时间'
                            timeout_time:
                              type: integer
                              format: int64
                              title: ' 售后单超时时间'
                            timeout_status:
                              title: ' 退款超时运行状态'
                              $ref: '#/components/schemas/timeout_status'
                            timeout_type:
                              title: ' 退款超时动作类型'
                              $ref: '#/components/schemas/timeout_type'
                            waybill_no:
                              type: string
                              title: ' 退货快递单号'
                            express_code:
                              type: string
                              title: ' 快递公司代码'
                            reject_time:
                              type: integer
                              format: int64
                              description: 仅退款拒绝有值
                              title: ' 售后拒绝时间'
                            refund_reason:
                              type: string
                              title: ' 退款原因'
                          required:
                            - refund_no
                            - order_no
                            - seller_eid
                            - seller_name
                            - goods_status
                            - refund_type
                            - refund_status
                            - refund_amount
                            - apply_amount
                            - refund_time
                            - apply_time
                            - timeout_time
                            - timeout_status
                            - timeout_type
                            - waybill_no
                            - express_code
                            - reject_time
                            - refund_reason
                      has_next_page:
                        type: boolean
                        format: boolean
                        title: ' 是否有下页'
                    required:
                      - list
                      - has_next_page
                required:
                  - code
                  - msg
                  - data
      security: []
      x-apifox-folder: 售后
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/2973339/apis/api-469952533-run
components:
  schemas:
    OpenRefundListReq:
      type: object
      properties:
        order_no:
          type: string
          description: ' 闲鱼订单号'
        authorize_id:
          type: integer
          format: int64
          description: ' 店铺授权ID'
        apply_time:
          type: array
          items:
            type: integer
            format: int64
          description: ' 申请时间'
        refund_time:
          type: array
          items:
            type: integer
            format: int64
          description: ' 退款时间'
        refund_type:
          type: integer
          format: int32
          description: ' 退款类型(1:仅退款 2:退货退款)'
        refund_status:
          type: integer
          format: int32
          description: ' 退款状态'
        page_no:
          type: integer
          format: int32
          default: '1'
          description: ' 页码'
        page_size:
          type: integer
          format: int32
          default: '50'
          description: ' 每页行数，当翻页获取的条数（page_no*page_size）超过1万，接口将报错，请尽可能的细化搜索条件'
    timeout_type:
      type: integer
      format: int32
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      title: 退款超时动作类型
    timeout_status:
      type: integer
      title: 退款超时运行状态
      format: int32
      enum: [0, 1, 2, 3, 4, 5]
    refund_status:
      type: integer
      title: 退款状态 (0:未申请 1:待商家处理 2:待买家退货 3:待商家收货 4:退款关闭 5:退款成功 6:已拒绝退款 8:待确认退货地址)
      format: int32
      enum: [0, 1, 2, 3, 4, 5, 6, 8]
    refund_type:
      type: integer
      title: 退款类型 (1:仅退款 2:退货退款)
      format: int32
      enum: [1, 2]
    goods_status:
      type: integer
      title: 售后商品状态 (1:未收到货 2:已收到货 3:已寄回 4:未发货 5:卖家确认收货 6:已发货)
      format: int32
      enum: [1, 2, 3, 4, 5, 6]
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
security: []
```

### 售后订单详情

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/trade/refund/detail:
    post:
      summary: 售后订单详情
      deprecated: false
      description: ''
      operationId: OpenRefundDetail
      tags:
        - 售后
        - trade
      parameters:
        - name: appid
          in: query
          required: true
          schema:
            type: string
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                order_no:
                  type: string
                  description: ' 订单号'
              required:
                - order_no
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: object
                    description: 同售后订单列表单条记录结构
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
```

### 售后订单同意退款

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/trade/refund/operate/agree:
    post:
      summary: 售后订单同意退款
      deprecated: false
      description: ''
      operationId: OpenRefundAgree
      tags:
        - 售后
        - trade
      parameters:
        - name: appid
          in: query
          required: true
          schema:
            type: string
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          required: false
          schema:
            type: integer
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          schema:
            type: integer
        - name: sign
          in: query
          description: 签名MD5值（参考签名说明）
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OpenRefundAgreeReq'
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OpenRefundOperateResp'
components:
  schemas:
    OpenRefundAgreeReq:
      type: object
      properties:
        order_no:
          type: string
          description: ' 订单号'
        return_address:
          $ref: '#/components/schemas/OpenRefundReturnAddress'
        return_explain:
          type: string
          description: ' 退货说明'
      required:
        - order_no
    OpenRefundReturnAddress:
      type: object
      properties:
        address:
          type: string
          description: ' 收货方详细地址，示例：侨香路某某大厦A栋301室'
        prov_name:
          type: string
          description: ' 收货方所在省份（如果没有传入district_id，则必传）'
        city_name:
          type: string
          description: ' 收货方所在城市（如果没有传入district_id，则必传）'
        area_name:
          type: string
          description: ' 收货方所在地区（如果没有传入district_id，则必传）'
        district_id:
          type: integer
          format: int32
          description: ' 收货方所在地区ID，示例：440305（如果没有传入该参数，则必传省市区）'
        mobile:
          type: string
          description: ' 收货方号码，示例：13800138000'
        name:
          type: string
          description: ' 收货方姓名，示例：张三'
    OpenRefundOperateResp:
      type: object
      properties: {}
servers:
  - url: https://open.goofish.pro
    description: 新版正式环境
```

### 卡密分类列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/category/list:
    post:
      summary: 卡密分类列表
      operationId: CategoryList
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          description: 当前时间戳（单位秒，5分钟内有效）
          schema: { type: integer }
        - name: seller_id
          in: query
          description: 商家ID（仅商务对接传入，自研/第三方ERP对接忽略即可）
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [list, count]
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          properties:
                            category_id: { type: integer, description: 分类ID }
                            category_name: { type: string, maxLength: 20, description: 卡密分类名称 }
                            remark: { type: string, maxLength: 50, description: 卡密分类备注 }
                            create_time: { type: string, description: 创建时间 }
                            update_time: { type: string, description: 更新时间 }
                      count: { type: integer, description: 查询总数 }
servers:
  - url: https://open.goofish.pro
```

### 卡密分类创建

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/category/create:
    post:
      summary: 卡密分类创建
      operationId: CategoryCreate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [category_name, remark]
              properties:
                category_name: { type: string, description: 分类名称 }
                remark: { type: string, description: 分类备注 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [category_id]
                    properties:
                      category_id: { type: integer }
servers:
  - url: https://open.goofish.pro
```

### 卡密分类编辑

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/category/edit:
    post:
      summary: 卡密分类编辑
      operationId: CategoryModify
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [category_id, category_name, remark]
              properties:
                category_id: { type: integer, format: int64, description: 分类ID }
                category_name: { type: string, maxLength: 20, description: 卡密分类名称 }
                remark: { type: string, maxLength: 50, description: 卡密分类备注 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```

### 卡密分类删除

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/category/delete:
    post:
      summary: 卡密分类删除
      operationId: CategoryDelete
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [category_id]
              properties:
                category_id:
                  type: array
                  items: { type: integer, format: int64 }
                  description: 分类ID
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```

### 发卡组合列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/group/list:
    post:
      summary: 发卡组合列表
      operationId: GroupList
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [page_no, page_size]
              properties:
                group_name: { type: string, description: 组合名称 }
                group_type: { type: integer, format: int32, enum: [1, 2], description: '组合类型 1:普通组合, 2:数量组合' }
                status: { type: integer, format: int32, enum: [1, 2], description: '组合状态 1:启用, 2:禁用' }
                page_no: { type: integer, format: int32, default: 1, description: 页码 }
                page_size: { type: integer, format: int32, default: 50, description: 页数 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [list, count]
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          required: [group_id, group_name, group_type, status, kind_group, modify_time, create_time]
                          properties:
                            group_id: { type: integer, format: int64, description: 发卡组合ID }
                            group_name: { type: string, description: 组合名称 }
                            group_type: { type: integer, format: int32, enum: [1, 2], description: '1:普通组合, 2:数量组合' }
                            status: { type: integer, format: int32, enum: [1, 2], description: '1:启用, 2:禁用' }
                            kind_group:
                              type: array
                              items:
                                type: object
                                required: [items]
                                properties:
                                  items:
                                    type: array
                                    items:
                                      type: object
                                      required: [kind_id, multiple]
                                      properties:
                                        kind_id: { type: integer, format: int64, description: 卡种ID }
                                        multiple: { type: integer, format: int32, description: 发卡倍数 }
                                  quantity: { type: integer, format: int32, description: 购买数量（仅按数量组合传递） }
                            modify_time: { type: string }
                            create_time: { type: string }
                      count: { type: integer, format: int64 }
servers:
  - url: https://open.goofish.pro
```

### 发卡组合创建

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/group/create:
    post:
      summary: 发卡组合创建
      operationId: GroupCreate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [group_name, group_type, kind_group]
              properties:
                group_name: { type: string, description: 组合名称 }
                group_type: { type: integer, format: int32, enum: [1, 2], description: '1:普通组合, 2:数量组合' }
                kind_group:
                  type: array
                  items:
                    type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items:
                          type: object
                          required: [kind_id, multiple]
                          properties:
                            kind_id: { type: integer, format: int64 }
                            multiple: { type: integer, format: int32 }
                      quantity: { type: integer, format: int32, description: 购买数量（仅按数量组合传递） }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [group_id]
                    properties:
                      group_id: { type: integer, format: int64 }
servers:
  - url: https://open.goofish.pro
```

### 发卡组合修改

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/group/edit:
    post:
      summary: 发卡组合修改
      operationId: GroupUpdate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [group_id, group_name, group_type, kind_group]
              properties:
                group_id: { type: integer, format: int64, description: 发卡组合ID }
                group_name: { type: string, description: 组合名称 }
                group_type: { type: integer, format: int32, enum: [1, 2], description: '1:普通组合, 2:数量组合' }
                kind_group:
                  type: array
                  items:
                    type: object
                    required: [items]
                    properties:
                      items:
                        type: array
                        items:
                          type: object
                          required: [kind_id, multiple]
                          properties:
                            kind_id: { type: integer, format: int64 }
                            multiple: { type: integer, format: int32 }
                      quantity: { type: integer, format: int32 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [group_id]
                    properties:
                      group_id: { type: integer, format: int64 }
servers:
  - url: https://open.goofish.pro
```

### 发卡组合更新状态

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/group/update/status:
    post:
      summary: 发卡组合更新状态
      operationId: GroupUpdateStatus
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [group_id, status]
              properties:
                group_id:
                  type: array
                  items: { type: integer, format: int64 }
                  description: 发卡组合ID数组
                status: { type: integer, format: int32, enum: [1, 2], description: '1:启用, 2:禁用' }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```

### 发卡组合删除

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/group/delete:
    post:
      summary: 发卡组合删除
      operationId: GroupDelete
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [group_id]
              properties:
                group_id:
                  type: array
                  items: { type: integer, format: int64 }
                  description: 发卡组合ID
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```

### 卡种列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/kind/list:
    post:
      summary: 卡种列表
      operationId: OpenKamKindList
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                kind_name: { type: string, description: 卡种名称（模糊搜索） }
                kind_category: { type: integer, description: 卡种分类ID }
                kind_type: { type: integer, format: uint32, enum: [1, 2], description: '1:唯一卡, 2:图片' }
                page_no: { type: integer, format: int32, default: 1 }
                page_size: { type: integer, format: int32, default: 50 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [list, count]
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          properties:
                            kind_id: { type: integer, description: 卡种ID }
                            kind_name: { type: string, description: 卡种名称 }
                            kind_alias: { type: string, description: 卡种别名 }
                            kind_category: { type: integer, description: 卡种分类ID }
                            kind_category_name: { type: string, description: 卡种分类名称 }
                            kind_type: { type: integer, enum: [1, 2], description: '1:唯一卡, 2:图片' }
                            cost: { type: string, description: 成本单价（元） }
                            avg_cost: { type: string, description: 平均成本单价（元） }
                            stock: { type: integer, description: 未售库存数 }
                            sold: { type: integer, description: 已售数 }
                            total_cost: { type: string, description: 未售总成本（元） }
                            total_stock: { type: integer, description: 总库存（已售+未售） }
                            card_type: { type: integer, enum: [1, 2, 3, 4, 5], description: '1:文本, 2:二维码, 3:条形码, 4:图片链接, 5:相册链接' }
                            pwd_type: { type: integer, enum: [1, 2, 3], description: '1:文本, 2:二维码, 3:条形码' }
                            card_prefix: { type: string }
                            pwd_prefix: { type: string }
                            priority_sale: { type: integer, enum: [1, 2], description: '1:卡密库存, 2:货源采购' }
                            priority_sale_name: { type: string }
                            app_id: { type: integer }
                            app_name: { type: string }
                            erp_id: { type: integer }
                            goods_no: { type: string }
                            goods_name: { type: string }
                            goods_price: { type: string }
                            goods_stock: { type: integer }
                            separator: { type: integer, enum: [0, 1, 2, 3, 4], description: '0:无, 1:逗号, 2:空格, 3:|, 4:换行' }
                            separator_name: { type: string }
                            stock_warning: { type: integer }
                            sort: { type: integer }
                            modify_time: { type: string }
                            create_time: { type: string }
                      count: { type: integer }
servers:
  - url: https://open.goofish.pro
```

### 卡种详情

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/kind/info:
    post:
      summary: 卡种详情
      operationId: OpenKamKindInfo
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [kind_id]
              properties:
                kind_id: { type: integer, description: 卡种ID }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object, description: 同卡种列表单条记录结构 }
servers:
  - url: https://open.goofish.pro
```

### 卡种创建

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/kind/create:
    post:
      summary: 卡种创建
      operationId: OpenKamKindCreate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [kind_name, kind_type, card_type]
              properties:
                kind_name: { type: string, description: 最多60个字 }
                kind_alias: { type: string, description: 最多60个字 }
                kind_category: { type: integer, description: 卡种分类ID }
                kind_type: { type: integer, enum: [1, 2], description: '1:唯一卡, 2:图片（设置后不可更改）' }
                card_type: { type: integer, enum: [1, 2, 3, 4, 5], description: '1:文本, 2:二维码, 3:条形码, 4:图片链接, 5:相册链接' }
                pwd_type: { type: integer, enum: [1, 2, 3], description: '1:文本, 2:二维码, 3:条形码' }
                card_prefix: { type: string, description: 卡号前缀，最多50个字 }
                pwd_prefix: { type: string, description: 密码前缀，最多50个字 }
                separator: { type: integer, enum: [0, 1, 2, 3, 4], description: '0:无, 1:逗号, 2:空格, 3:|, 4:换行' }
                stock_warning: { type: integer, format: int32, description: 库存预警阈值 }
                sort: { type: integer, format: int32, description: 排序值，越大越靠前 }
                cost: { type: integer, format: int32, description: 成本单价（分） }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [kind_id]
                    properties:
                      kind_id: { type: integer, description: 卡种ID }
servers:
  - url: https://open.goofish.pro
```

### 卡种编辑

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/kind/edit:
    post:
      summary: 卡种编辑
      operationId: OpenKamKindUpdate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [kind_id, kind_name, card_type]
              properties:
                kind_id: { type: integer, description: 卡种ID }
                kind_name: { type: string, description: 最多60个字 }
                kind_alias: { type: string, description: 最多60个字 }
                kind_category: { type: integer, description: 卡种分类ID }
                card_type: { type: integer, enum: [1, 2, 3, 4, 5] }
                pwd_type: { type: integer, enum: [1, 2, 3] }
                card_prefix: { type: string }
                pwd_prefix: { type: string }
                separator: { type: integer, enum: [0, 1, 2, 3, 4] }
                stock_warning: { type: integer, format: int32 }
                sort: { type: integer, format: int32 }
                cost: { type: integer, format: int32, description: 成本单价（分） }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [kind_id]
                    properties:
                      kind_id: { type: integer }
servers:
  - url: https://open.goofish.pro
```

### 卡种删除

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/kind/delete:
    post:
      summary: 卡种删除
      operationId: OpenKamKindDelete
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [kind_id]
              properties:
                kind_id:
                  type: array
                  items: { type: integer, format: int64 }
                  description: 卡种ID列表
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```

### 卡种添加卡密库存

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/kami/storage/create:
    post:
      summary: 卡种添加卡密库存
      operationId: StorageCreate
      tags: [卡密, kami]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [kind_id, cost, is_cover, is_repeat, is_priority, cards]
              properties:
                kind_id: { type: integer, description: 卡种ID }
                cost: { type: integer, description: 成本单价（分） }
                is_cover: { type: boolean, description: 是否覆盖已存在卡密 }
                is_repeat: { type: boolean, description: 是否添加重复卡密 }
                is_priority: { type: boolean, description: 是否优先出售 }
                cards:
                  type: array
                  description: 卡密内容
                  items:
                    type: object
                    required: [card_no, card_pwd]
                    properties:
                      card_no: { type: string, description: 卡号 }
                      card_pwd: { type: string, description: 卡密 }
      responses:
        '200':
          description: A successful response.
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data: { type: object }
servers:
  - url: https://open.goofish.pro
```


### 订单卡密列表

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/order/kam/list:
    post:
      summary: 订单卡密列表
      tags: [订单]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [order_no]
              properties:
                order_no: { type: string, description: 闲鱼订单号 }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [code, msg, data]
                properties:
                  code: { type: integer }
                  msg: { type: string }
                  data:
                    type: object
                    required: [list]
                    properties:
                      list:
                        type: array
                        items:
                          type: object
                          required: [card_no, card_pwd, cost, sold_type]
                          properties:
                            card_no: { type: string, description: 卡密账号 }
                            card_pwd: { type: string, description: 卡密密码 }
                            cost: { type: integer, description: 成本单价（分） }
                            sold_type: { type: integer, enum: [11, 12, 21, 22], description: '11:自动发货 12:手动发货 21:手动提卡 22:手动标识已售' }
servers:
  - url: https://open.goofish.pro
```

### 售后订单拒绝退款

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/open/trade/refund/operate/refused:
    post:
      summary: 售后订单拒绝退款
      tags: [售后, trade]
      parameters:
        - name: appid
          in: query
          required: true
          schema: { type: string }
        - name: timestamp
          in: query
          schema: { type: integer }
        - name: seller_id
          in: query
          schema: { type: integer }
        - name: sign
          in: query
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [order_no, refuse_reason]
              properties:
                order_no: { type: string, description: 订单号 }
                refuse_reason: { type: string, description: 拒绝原因 }
                refuse_explain: { type: string, description: 拒绝说明 }
                refuse_images:
                  type: array
                  items:
                    type: object
                    required: [size, src]
                    properties:
                      size: { type: integer }
                      src: { type: string }
                      width: { type: integer }
                      height: { type: integer }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { type: object }
servers:
  - url: https://open.goofish.pro
```
