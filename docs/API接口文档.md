# 🐟 闲管家 OpenAPI 接口文档

> **生产环境地址:** `https://open.goofish.pro`  
> **文档版本:** 1.0.1  
> **最后更新:** 2026-03-07  
> **状态:** ✅ 已验证

---

## 📖 目录

- [接入说明](#-接入说明)
- [签名规则](#-签名规则) ⭐ 重要
- [接口列表](#-接口列表)
- [接口详细说明](#-接口详细说明)
  - [查询闲鱼店铺](#查询闲鱼店铺) ✅ 已测试
  - [查询商品列表](#查询商品列表)
  - [查询商品详情](#查询商品详情)
  - [创建商品](#创建商品)
  - [批量创建商品](#批量创建商品)
  - [上架商品](#上架商品)
  - [下架商品](#下架商品)
  - [编辑商品](#编辑商品)
  - [编辑库存](#编辑库存)
  - [删除商品](#删除商品)
- [代码示例](#-代码示例)

---

## 📖 接入说明

### 环境地址

| 环境 | 地址 |
|------|------|
| **生产环境** | `https://open.goofish.pro` |

### 相关数据文件

文档包中包含以下数据文件：

| 文件名 | 说明 |
|--------|------|
| `闲管家省市区.xlsx` | 省市区数据（Excel 格式） |
| `闲管家省市区.sql` | 省市区数据（SQL 格式） |
| `商品异常状态码.xlsx` | 商品发布异常状态码及处理建议（Excel） |
| `商品异常状态码.sql` | 商品发布异常状态码及处理建议（SQL） |

---

## 🔐 签名规则

### ⚠️ 重要提示

**签名规则已更新！请使用以下正确的签名算法。**

### 签名参数说明

所有接口调用都需要传入以下参数：

| 参数名 | 位置 | 必填 | 类型 | 说明 |
|--------|------|------|------|------|
| `appid` | query | 是 | integer | 开放平台的 AppKey |
| `timestamp` | query | 是 | integer | 当前时间戳（秒，5 分钟内有效） |
| `seller_id` | query | 否 | integer | 商家 ID（仅商务对接传入，自研/第三方 ERP 忽略） |
| `sign` | query | 是 | string | 签名 MD5 值 |

### 签名生成步骤（正确版本）

**签名公式：**
```
sign = md5("appKey,bodyMd5,timestamp,appSecret")
```

**详细步骤：**

1. **计算 Body 的 MD5**
   - 如果请求有 Body：`bodyMd5 = md5(Body 字符串)`
   - 如果请求无 Body（GET 或空 POST）：`bodyMd5 = md5("{}")` 或 `md5("")`

2. **拼接签名字符串**
   ```
   appKey,bodyMd5,timestamp,appSecret
   ```
   注意：使用**英文逗号**分隔，顺序固定

3. **MD5 加密**
   - 对拼接后的字符串进行 MD5 加密
   - 得到 32 位小写签名

### Python 代码示例

```python
import hashlib
import time

def generate_sign(appid: int, body_string: str, timestamp: int, appsecret: str) -> str:
    """
    生成 API 签名（正确版本）
    
    Args:
        appid: 应用 Key
        body_string: 请求 Body 字符串（无 Body 时用"{}"）
        timestamp: 时间戳（秒）
        appsecret: 应用密钥
    
    Returns:
        32 位小写 MD5 签名
    """
    # 1. 计算 Body 的 MD5
    body_md5 = hashlib.md5(body_string.encode()).hexdigest()
    
    # 2. 拼接签名字符串：appKey,bodyMd5,timestamp,appSecret
    sign_str = f"{appid},{body_md5},{timestamp},{appsecret}"
    
    # 3. MD5 加密
    return hashlib.md5(sign_str.encode()).hexdigest()

# 使用示例
appid = 1478693701682949
appsecret = "RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH"
timestamp = int(time.time())
body_string = "{}"  # 查询接口无 Body

sign = generate_sign(appid, body_string, timestamp, appsecret)
print(f"签名：{sign}")
```

### 完整示例

**场景 1: 查询接口（无 Body）**

假设：
- `appid = 1478693701682949`
- `appsecret = "RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH"`
- `timestamp = 1772873254`

**步骤 1: 计算 Body MD5**
```python
body_md5 = md5("{}")
# 输出：99914b932bd37a50b983c5e7c90ae93b
```

**步骤 2: 拼接签名字符串**
```
1478693701682949,99914b932bd37a50b983c5e7c90ae93b,1772873254,RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH
```

**步骤 3: MD5 加密**
```
sign = md5("1478693701682949,99914b932bd37a50b983c5e7c90ae93b,1772873254,RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH")
# 输出：11ff6ab03b7e16c3236fde7077fe34d0
```

---

**场景 2: 创建商品接口（有 Body）**

假设：
- `appid = 203413189371893`
- `appsecret = "o9wl81dncmvby3ijpq7eur456zhgtaxs"`
- `timestamp = 1636087298`
- `body = {"product_id":"219530767978565"}`

**步骤 1: 计算 Body MD5**
```python
body_md5 = md5('{"product_id":"219530767978565"}')
# 输出：2608f2139cca8755cabf25209251e549
```

**步骤 2: 拼接签名字符串**
```
203413189371893,2608f2139cca8755cabf25209251e549,1636087298,o9wl81dncmvby3ijpq7eur456zhgtaxs
```

**步骤 3: MD5 加密**
```
sign = md5("203413189371893,2608f2139cca8755cabf25209251e549,1636087298,o9wl81dncmvby3ijpq7eur456zhgtaxs")
# 输出：c26c8a48809141f3dd80bd9b9ddb41ea
```

---

**场景 3: 商务对接（包含 seller_id）**

```
sign = md5("appKey,bodyMd5,timestamp,seller_id,appSecret")
```

示例：
```
sign = md5("203413189371893,2608f2139cca8755cabf25209251e549,1636087298,203413189371893,o9wl81dncmvby3ijpq7eur456zhgtaxs")
# 输出：f31947b7a10b9c266a1115d11d334780
```

---

## 📋 接口列表

### 用户授权接口

| 接口名称 | 方法 | 路径 | 说明 | 状态 |
|----------|------|------|------|------|
| 查询闲鱼店铺 | POST | `/api/open/user/authorize/list` | 查询已授权的闲鱼店铺列表 | ✅ 已测试 |

### 商品管理接口

| 接口名称 | 方法 | 路径 | 说明 |
|----------|------|------|------|
| 查询商品列表 | GET | `/api/open/product/list` | 查询商品列表（包含店铺信息） |
| 查询商品详情 | GET | `/api/open/product/detail` | 查询单个商品详情 |
| 创建商品（单个） | POST | `/api/open/product/create` | 创建单个商品 |
| 创建商品（批量） | POST | `/api/open/product/batchCreate` | 批量创建商品（最多 50 个） |
| 上架商品 | POST | `/api/open/product/publish` | 上架商品到闲鱼 App |
| 下架商品 | POST | `/api/open/product/downShelf` | 下架商品 |
| 编辑商品 | POST | `/api/open/product/edit` | 编辑商品信息 |
| 编辑库存 | POST | `/api/open/product/edit/stock` | 编辑商品库存 |
| 删除商品 | POST | `/api/open/product/delete` | 删除商品（仅草稿/待发布） |

---

## 🔍 接口详细说明

### 查询闲鱼店铺 ✅

**接口路径:** `POST /api/open/user/authorize/list`

**接口说明:** 查询已授权的闲鱼店铺列表

**测试状态:** ✅ 已验证（2026-03-07）

#### 请求参数

**Query 参数:**
| 参数名 | 位置 | 必填 | 类型 | 说明 |
|--------|------|------|------|------|
| `appid` | query | 是 | integer | 开放平台的 AppKey |
| `timestamp` | query | 是 | integer | 当前时间戳（秒，5 分钟内有效） |
| `seller_id` | query | 否 | integer | 商家 ID（仅商务对接传入） |
| `sign` | query | 是 | string | 签名 MD5 值 |

**Request Body:**
```json
{}
```

#### 签名示例

```python
import hashlib
import time

appid = 1478693701682949
appsecret = "RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH"
timestamp = int(time.time())
body_string = "{}"

# 计算 Body MD5
body_md5 = hashlib.md5(body_string.encode()).hexdigest()

# 生成签名
sign_str = f"{appid},{body_md5},{timestamp},{appsecret}"
sign = hashlib.md5(sign_str.encode()).hexdigest()
```

#### 响应示例

**成功响应:**
```json
{
  "code": 0,
  "msg": "OK",
  "data": {
    "list": [
      {
        "authorize_id": 600028192407621,
        "authorize_expires": 1787912587,
        "seller_id": 567062243049541,
        "user_identity": "btxTUYLUeSDSRUdkMgI2lQ==",
        "user_name": "xy159841643999",
        "user_nick": "chongya",
        "shop_name": "chongya",
        "is_pro": true,
        "is_deposit_enough": true,
        "service_support": "",
        "is_valid": true,
        "is_trial": false,
        "valid_end_time": 1775059199,
        "valid_start_time": 0,
        "item_biz_types": "2,10"
      }
    ]
  }
}
```

#### 返回字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `authorize_id` | integer | 授权 ID |
| `authorize_expires` | integer | 授权过期时间戳 |
| `seller_id` | integer | 商家 ID |
| `user_identity` | string | 闲鱼会员 ID（唯一标识，加密） |
| `user_name` | string | 闲鱼会员名 |
| `user_nick` | string | 闲鱼号昵称 |
| `shop_name` | string | 店铺名称 |
| `is_pro` | boolean | 是否开通鱼小铺 |
| `is_deposit_enough` | boolean | 是否已缴纳足够的服务保证金 |
| `service_support` | string | 已开通的服务项（多个用逗号分隔） |
| `is_valid` | boolean | 是否有效订购中 |
| `is_trial` | boolean | 是否免费试用版本 |
| `valid_start_time` | integer | 订购有效开始时间戳 |
| `valid_end_time` | integer | 订购有效结束时间戳 |
| `item_biz_types` | string | 准入业务类型（逗号分隔，如"2,10"） |

#### 业务类型说明

| 代码 | 说明 |
|------|------|
| `2` | 普通商品 |
| `10` | 验货宝 |
| `16` | 品牌授权 |
| `19` | 闲鱼严选 |
| `24` | 闲鱼特卖 |
| `26` | 品牌捡漏 |
| `35` | 跨境商品 |

#### 服务支持项

| 代码 | 说明 |
|------|------|
| `SDR` | 七天无理由退货 |
| `NFR` | 描述不符包邮退 |
| `VNR` | 描述不符全额退（虚拟类） |
| `FD_10MS` | 10 分钟极速发货（虚拟类） |
| `FD_24HS` | 24 小时极速发货 |
| `FD_48HS` | 48 小时极速发货 |
| `FD_GPA` | 正品保障（包赔） |
| `NFGC` | 不符必赔 |
| `RISK_30D` | 30 天收货 |
| `RISK_90D` | 90 天收货 |

---

### 查询商品列表

**接口路径:** `GET /api/open/product/list`

**接口说明:** 查询商品列表，包含店铺信息

#### 请求参数

| 参数名 | 位置 | 必填 | 类型 | 说明 |
|--------|------|------|------|------|
| `appid` | query | 是 | integer | 开放平台的 AppKey |
| `timestamp` | query | 是 | integer | 当前时间戳（秒） |
| `seller_id` | query | 否 | integer | 商家 ID |
| `sign` | query | 是 | string | 签名 MD5 值 |

#### 响应示例

```json
{
  "code": 0,
  "msg": "OK",
  "data": {
    "list": [
      {
        "product_id": 448592974859525,
        "product_status": 31,
        "title": "测试 0717 食品 - 海外",
        "price": 400000,
        "stock": 2,
        "sold": 0
      }
    ],
    "count": 100,
    "page_no": 1,
    "page_size": 5
  }
}
```

---

### 查询商品详情

**接口路径:** `GET /api/open/product/detail`

**接口说明:** 查询单个商品的详细信息

#### 请求参数

| 参数名 | 位置 | 必填 | 类型 | 说明 |
|--------|------|------|------|------|
| `appid` | query | 是 | integer | 开放平台的 AppKey |
| `timestamp` | query | 是 | integer | 当前时间戳（秒） |
| `product_id` | query | 是 | integer | 商品 ID |
| `sign` | query | 是 | string | 签名 MD5 值 |

---

### 创建商品（单个）

**接口路径:** `POST /api/open/product/create`

**接口说明:** 创建单个商品

#### Request Body

```json
{
  "item_biz_type": 2,
  "sp_biz_type": 1,
  "channel_cat_id": "e11455b218c06e7ae10cfa39bf43dc0f",
  "price": 550000,
  "original_price": 700000,
  "express_fee": 10,
  "stock": 10,
  "publish_shop": [
    {
      "user_name": "闲鱼会员名",
      "province": 130000,
      "city": 130100,
      "district": 130101,
      "title": "商品标题",
      "content": "商品描述。",
      "images": [
        "https://xxx.com/xxx1.jpg",
        "https://xxx.com/xxx2.jpg"
      ]
    }
  ]
}
```

---

### 批量创建商品

**接口路径:** `POST /api/open/product/batchCreate`

**接口说明:** 批量创建商品，每批次最多 50 个

#### 注意事项

1. 字段参数要求与单个创建商品一致
2. 每批次最多创建 50 个商品
3. 同批次时 `item_key` 字段值要唯一

---

### 上架商品

**接口路径:** `POST /api/open/product/publish`

**接口说明:** 上架商品到闲鱼 App（异步处理）

#### 特别提醒

本接口会采用异步的方式更新商品信息到闲鱼 App 上，因此更新结果采用回调的方式进行通知。

---

### 下架商品

**接口路径:** `POST /api/open/product/downShelf`

**接口说明:** 下架商品

---

### 编辑商品

**接口路径:** `POST /api/open/product/edit`

**接口说明:** 编辑商品信息

#### 注意事项

1. 可以只传入需要更新的字段，没有传入的字段不会更新
2. 多规格商品，如果已经发布到闲鱼则不能清空 SKU，至少要保留一组
3. 如果商品状态为销售中，则同步更新到闲鱼 App

---

### 编辑库存

**接口路径:** `POST /api/open/product/edit/stock`

**接口说明:** 编辑商品库存

#### 特别提醒

- 如果商品为在架状态时，会同步更新库存信息到闲鱼 App 上
- 如果商品不是在架状态，只会更新闲管家内的库存信息

---

### 删除商品

**接口路径:** `POST /api/open/product/delete`

**接口说明:** 删除商品

#### 注意事项

该接口只能删除状态为**草稿箱**、**待发布**的商品。

**注意:** 不会删除闲鱼 App 已下架的商品，需要手动去闲鱼 App 删除！

---

## 💻 代码示例

### Python 调用示例

#### 查询闲鱼店铺

```python
import requests
import hashlib
import time
import json

def generate_sign(appid: int, body_string: str, timestamp: int, appsecret: str) -> str:
    """生成 API 签名"""
    body_md5 = hashlib.md5(body_string.encode()).hexdigest()
    sign_str = f"{appid},{body_md5},{timestamp},{appsecret}"
    return hashlib.md5(sign_str.encode()).hexdigest()

def query_authorized_shops(appid: int, appsecret: str):
    """查询已授权的闲鱼店铺"""
    # 准备参数
    timestamp = int(time.time())
    body_string = "{}"
    
    # 生成签名
    sign = generate_sign(appid, body_string, timestamp, appsecret)
    
    # 构建请求
    url = "https://open.goofish.pro/api/open/user/authorize/list"
    params = {
        "appid": appid,
        "timestamp": timestamp,
        "sign": sign,
    }
    
    # 发送请求
    response = requests.post(url, params=params, data=body_string, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get("code") == 0:
            shops = data.get("data", {}).get("list", [])
            print(f"✅ 查询成功，共 {len(shops)} 个店铺")
            for shop in shops:
                print(f"  - {shop['shop_name']} ({shop['user_name']})")
                print(f"    鱼小铺：{'是' if shop['is_pro'] else '否'}")
                print(f"    保证金：{'已缴足' if shop['is_deposit_enough'] else '未缴足'}")
        else:
            print(f"❌ API 错误：{data.get('msg')}")
    else:
        print(f"❌ HTTP 错误：{response.status_code}")

# 使用示例
if __name__ == "__main__":
    appid = 1478693701682949
    appsecret = "RydzNKbHkR9UA0Ggu8DNvl7CHRBc0kVH"
    query_authorized_shops(appid, appsecret)
```

---

## 📊 商品状态码

### 商品状态 (product_status)

| 状态码 | 状态名称 | 说明 |
|--------|---------|------|
| -1 | 已删除 | 商品已删除 |
| 21 | 待发布 | 商品等待发布 |
| 22 | 销售中 | 商品正在销售 |
| 23 | 已售罄 | 商品已售完 |
| 31 | 手动下架 | 卖家手动下架 |
| 33 | 售出下架 | 售出后自动下架 |
| 36 | 自动下架 | 系统自动下架 |

### 商品成色 (stuff_status)

| 状态码 | 成色 | 说明 |
|--------|------|------|
| 0 | 无成色 | 普通商品可用 |
| 100 | 全新 | 全新商品 |
| -1 | 准新 | 准新商品 |
| 99 | 99 新 | 99 新商品 |
| 95 | 95 新 | 95 新商品 |
| 90 | 9 新 | 9 新商品 |
| 80 | 8 新 | 8 新商品 |
| 70 | 7 新 | 7 新商品 |
| 60 | 6 新 | 6 新商品 |
| 50 | 5 新 | 5 新及以下 |

---

## 🔗 相关链接

- **闲管家开放平台:** https://open.goofish.pro
- **API 文档:** 详见 `接口示例.docx`
- **省市区数据:** `闲管家省市区.xlsx` / `闲管家省市区.sql`
- **异常状态码:** `商品异常状态码.xlsx` / `商品异常状态码.sql`

---

**文档版本:** 1.0.1  
**最后更新:** 2026-03-07  
**测试状态:** ✅ 查询闲鱼店铺接口已验证  
**生成工具:** OpenClaw AI Assistant
