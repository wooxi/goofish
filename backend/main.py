#!/usr/bin/env python3
"""
Goofish 闲鱼管理后端 - FastAPI
端口：8001

严格按照接口文档实现：https://open.goofish.pro
签名规则：sign = md5("appKey,bodyMd5,timestamp,appSecret")
"""
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# ── 路径配置 ──
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
CONFIG_FILE = PROJECT_ROOT / "config" / "app_config.json"
CALLBACK_FILE = PROJECT_ROOT / "data" / "product_callback_records.jsonl"

LOG_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
CALLBACK_FILE.parent.mkdir(parents=True, exist_ok=True)

# ── 日志配置 ──
LOG_FILE = LOG_DIR / "backend.log"
logger = logging.getLogger("goofish")
logger.setLevel(logging.DEBUG)
logger.handlers.clear()

file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))

logger.addHandler(file_handler)
logger.addHandler(console_handler)

# ── 应用导入 ──
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import httpx
import time
import hashlib
import json
import uvicorn

# ── FastAPI 应用 ──
app = FastAPI(title="Goofish 闲鱼管理 API", version="1.0.0")

# 端口配置（8000-8010 范围）
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "8001"))

logger.info("=" * 60)
logger.info("🐟 Goofish Backend 启动中...")
logger.info(f"📂 项目根目录：{PROJECT_ROOT}")
logger.info(f"📝 日志文件：{LOG_FILE}")
logger.info(f"📄 配置文件：{CONFIG_FILE}")
logger.info(f"🔌 服务端口：{BACKEND_PORT}")
logger.info("=" * 60)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# API 基础 URL - 严格按照文档
API_BASE = "https://open.goofish.pro"

# ── 配置管理 ──
class AppConfig(BaseModel):
    appid: int = Field(default=0)
    appsecret: str = Field(default="")
    seller_id: Optional[int] = Field(default=None)
    updated_at: Optional[str] = Field(default=None)

def load_config() -> AppConfig:
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"✅ 配置已加载：appid={data.get('appid', 0)}")
                return AppConfig(**data)
        return AppConfig()
    except Exception as e:
        logger.error(f"❌ 配置加载失败：{e}", exc_info=True)
        return AppConfig()

def save_config_to_file(config: AppConfig) -> bool:
    try:
        config.updated_at = datetime.now().isoformat()
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            # 兼容 Pydantic v1/v2
            try:
                config_dict = config.model_dump()
            except AttributeError:
                config_dict = config.dict()
            json.dump(config_dict, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ 配置已保存到文件：{CONFIG_FILE}")
        return True
    except Exception as e:
        logger.error(f"❌ 配置保存失败：{e}", exc_info=True)
        return False

config = load_config()

# ── 签名生成（严格按照文档）──
def generate_sign(appid: int, body_string: str, timestamp: int, appsecret: str) -> str:
    """
    生成 API 签名（正确版本）
    sign = md5("appKey,bodyMd5,timestamp,appSecret")
    """
    # 1. 计算 Body 的 MD5
    body_md5 = hashlib.md5(body_string.encode()).hexdigest()

    # 2. 拼接签名字符串：appKey,bodyMd5,timestamp,appSecret
    sign_str = f"{appid},{body_md5},{timestamp},{appsecret}"

    # 3. MD5 加密
    return hashlib.md5(sign_str.encode()).hexdigest()


def ensure_api_configured():
    """校验 API 配置是否完整"""
    if not config.appid or not config.appsecret:
        logger.warning("⚠️ 未配置 appid 或 appsecret")
        raise HTTPException(status_code=400, detail="请先配置 appid 和 appsecret")


def build_signed_params(body_string: str) -> Dict[str, Any]:
    """构建签名后的 query 参数"""
    timestamp = int(time.time())
    sign = generate_sign(config.appid, body_string, timestamp, config.appsecret)

    params = {
        "appid": config.appid,
        "timestamp": timestamp,
        "sign": sign,
    }

    # seller_id 按文档为可选参数，仅配置时透传
    if config.seller_id:
        params["seller_id"] = config.seller_id

    return params


async def call_open_api(path: str, body: Optional[Dict[str, Any]] = None, action_name: str = "OpenAPI 调用"):
    """调用闲管家 OpenAPI 并处理公共错误"""
    ensure_api_configured()

    payload = body or {}
    try:
        body_string = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    except TypeError as e:
        logger.error(f"❌ {action_name}请求体不可序列化：{e}")
        raise HTTPException(status_code=400, detail=f"请求体格式错误：{e}")

    params = build_signed_params(body_string)

    logger.info(f"🌐 {action_name} URL: {API_BASE}{path}")
    logger.debug(f"📝 {action_name} Query 参数：{params}")
    logger.debug(f"🧾 {action_name} Body：{body_string[:1000]}")

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{API_BASE}{path}",
                params=params,
                content=body_string.encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )

        elapsed = time.time() - start_time
        logger.info(f"⏱️ {action_name} 响应时间：{elapsed:.2f}s, 状态码：{response.status_code}")
        logger.debug(f"📦 {action_name} 响应内容：{response.text[:2000]}")

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"HTTP 错误：{response.status_code}")

        try:
            api_result = response.json()
        except Exception as e:
            logger.error(f"❌ {action_name}响应解析失败：{e}")
            raise HTTPException(status_code=502, detail=f"上游响应不是合法 JSON：{e}")

        if api_result.get("code") != 0:
            api_code = api_result.get("code")
            api_msg = api_result.get("msg", "Unknown error")
            raise HTTPException(status_code=400, detail=f"API 错误（code={api_code}）：{api_msg}")

        return api_result, elapsed

    except HTTPException:
        raise
    except httpx.TimeoutException as e:
        logger.error(f"⏰ {action_name}请求超时：{e}", exc_info=True)
        raise HTTPException(status_code=504, detail=f"请求超时：{str(e)}")
    except httpx.RequestError as e:
        logger.error(f"❌ {action_name}请求失败：{e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"请求失败：{str(e)}")


# ── 商品参数校验（严格按接口文档的最小必填集合）──
ITEM_BIZ_TYPE_ALLOWED = {2, 0, 10, 16, 19, 24, 26, 35}
SP_BIZ_TYPE_ALLOWED = {1, 2, 3, 8, 9, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 33, 99}
CREATE_REQUIRED_FIELDS = ["item_biz_type", "sp_biz_type", "channel_cat_id", "price", "express_fee", "stock", "publish_shop"]
PUBLISH_REQUIRED_FIELDS = ["product_id", "user_name"]
PUBLISH_SHOP_REQUIRED_FIELDS = ["user_name", "province", "city", "district", "title", "content", "images"]
CALLBACK_REQUIRED_FIELDS = [
    "seller_id",
    "product_id",
    "product_status",
    "publish_status",
    "item_biz_type",
    "user_name",
    "item_id",
    "task_type",
    "task_time",
    "task_result",
    "err_code",
    "err_msg",
]


def _ensure_int(value: Any, field_name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"字段 `{field_name}` 必须是整数")
    return value


def _ensure_str(value: Any, field_name: str, *, min_len: int = 0, max_len: Optional[int] = None) -> str:
    if not isinstance(value, str):
        raise ValueError(f"字段 `{field_name}` 必须是字符串")
    if len(value) < min_len:
        raise ValueError(f"字段 `{field_name}` 长度不能小于 {min_len}")
    if max_len is not None and len(value) > max_len:
        raise ValueError(f"字段 `{field_name}` 长度不能大于 {max_len}")
    return value


def validate_create_payload(payload: Dict[str, Any]) -> None:
    if not isinstance(payload, dict):
        raise ValueError("请求体必须是 JSON 对象")

    missing = [f for f in CREATE_REQUIRED_FIELDS if f not in payload]
    if missing:
        raise ValueError(f"缺少必填字段：{', '.join(missing)}")

    item_biz_type = _ensure_int(payload.get("item_biz_type"), "item_biz_type")
    if item_biz_type not in ITEM_BIZ_TYPE_ALLOWED:
        raise ValueError(f"字段 `item_biz_type` 不在文档枚举范围内：{sorted(ITEM_BIZ_TYPE_ALLOWED)}")

    sp_biz_type = _ensure_int(payload.get("sp_biz_type"), "sp_biz_type")
    if sp_biz_type not in SP_BIZ_TYPE_ALLOWED:
        raise ValueError(f"字段 `sp_biz_type` 不在文档枚举范围内：{sorted(SP_BIZ_TYPE_ALLOWED)}")

    _ensure_str(payload.get("channel_cat_id"), "channel_cat_id", min_len=1)

    price = _ensure_int(payload.get("price"), "price")
    if price < 1 or price > 9999999900:
        raise ValueError("字段 `price` 超出文档限制范围：1~9999999900")

    _ensure_int(payload.get("express_fee"), "express_fee")

    stock = _ensure_int(payload.get("stock"), "stock")
    if stock < 1 or stock > 399960:
        raise ValueError("字段 `stock` 超出文档限制范围：1~399960")

    publish_shop = payload.get("publish_shop")
    if not isinstance(publish_shop, list) or len(publish_shop) == 0:
        raise ValueError("字段 `publish_shop` 必须是非空数组")

    for idx, shop in enumerate(publish_shop):
        if not isinstance(shop, dict):
            raise ValueError(f"字段 `publish_shop[{idx}]` 必须是对象")

        missing_shop = [f for f in PUBLISH_SHOP_REQUIRED_FIELDS if f not in shop]
        if missing_shop:
            raise ValueError(f"publish_shop[{idx}] 缺少必填字段：{', '.join(missing_shop)}")

        _ensure_str(shop.get("user_name"), f"publish_shop[{idx}].user_name", min_len=1)
        _ensure_int(shop.get("province"), f"publish_shop[{idx}].province")
        _ensure_int(shop.get("city"), f"publish_shop[{idx}].city")
        _ensure_int(shop.get("district"), f"publish_shop[{idx}].district")
        _ensure_str(shop.get("title"), f"publish_shop[{idx}].title", min_len=1, max_len=60)
        _ensure_str(shop.get("content"), f"publish_shop[{idx}].content", min_len=5, max_len=5000)

        images = shop.get("images")
        if not isinstance(images, list):
            raise ValueError(f"字段 `publish_shop[{idx}].images` 必须是数组")
        if len(images) < 1 or len(images) > 30:
            raise ValueError(f"字段 `publish_shop[{idx}].images` 数量需在 1~30 之间")
        normalized_images: List[str] = []
        for image_idx, image in enumerate(images):
            normalized_images.append(_ensure_str(image, f"publish_shop[{idx}].images[{image_idx}]", min_len=1))
        if len(set(normalized_images)) != len(normalized_images):
            raise ValueError(f"字段 `publish_shop[{idx}].images` 不能包含重复项")


def validate_publish_payload(payload: Dict[str, Any]) -> None:
    if not isinstance(payload, dict):
        raise ValueError("请求体必须是 JSON 对象")

    missing = [f for f in PUBLISH_REQUIRED_FIELDS if f not in payload]
    if missing:
        raise ValueError(f"缺少必填字段：{', '.join(missing)}")

    _ensure_int(payload.get("product_id"), "product_id")

    user_names = payload.get("user_name")
    if not isinstance(user_names, list):
        raise ValueError("字段 `user_name` 必须是数组")
    if len(user_names) < 1 or len(user_names) > 1:
        raise ValueError("字段 `user_name` 数组长度需为 1（文档约束 minItems=1, maxItems=1）")
    for idx, user_name in enumerate(user_names):
        _ensure_str(user_name, f"user_name[{idx}]", min_len=1)

    if "specify_publish_time" in payload and payload.get("specify_publish_time") is not None:
        _ensure_str(payload.get("specify_publish_time"), "specify_publish_time", min_len=1)

    if "notify_url" in payload and payload.get("notify_url") is not None:
        _ensure_str(payload.get("notify_url"), "notify_url", min_len=1)


def validate_callback_payload(payload: Dict[str, Any]) -> None:
    if not isinstance(payload, dict):
        raise ValueError("回调请求体必须是 JSON 对象")

    missing = [f for f in CALLBACK_REQUIRED_FIELDS if f not in payload]
    if missing:
        raise ValueError(f"缺少回调字段：{', '.join(missing)}")


def append_callback_record(record: Dict[str, Any]) -> None:
    with open(CALLBACK_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_callback_records(limit: int = 50) -> List[Dict[str, Any]]:
    if not CALLBACK_FILE.exists():
        return []

    try:
        with open(CALLBACK_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        logger.error(f"❌ 读取回调记录失败：{e}", exc_info=True)
        return []

    records: List[Dict[str, Any]] = []
    for line in reversed(lines[-limit:]):
        line = line.strip()
        if not line:
            continue
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    return records

# ── 全局异常处理 ──
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ 未捕获的异常：{exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": f"服务器内部错误：{str(exc)}"})

# ── API 端点 ──
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "goofish-backend", "timestamp": datetime.now().isoformat()}

@app.get("/api/config")
async def get_config():
    logger.info(f"📖 获取配置请求 - appid={config.appid}")
    return {"appid": config.appid, "has_secret": bool(config.appsecret), "seller_id": config.seller_id, "updated_at": config.updated_at}

class ConfigUpdateRequest(BaseModel):
    appid: int = Field(..., gt=0)
    appsecret: Optional[str] = Field(default=None)
    seller_id: Optional[int] = Field(default=None)

@app.post("/api/config")
async def save_config(req: ConfigUpdateRequest):
    global config
    logger.info(f"💾 保存配置请求 - appid={req.appid}")
    try:
        incoming_secret = (req.appsecret or "").strip()
        final_secret = incoming_secret if incoming_secret else (config.appsecret or "")
        secret_preserved = not incoming_secret and bool(config.appsecret)

        if not final_secret:
            raise HTTPException(status_code=400, detail="请提供 appsecret（当前没有可保留的旧 secret）")

        config = AppConfig(appid=req.appid, appsecret=final_secret, seller_id=req.seller_id)
        success = save_config_to_file(config)
        if success:
            logger.info(f"✅ 配置保存成功 - appid={config.appid}, has_secret={bool(config.appsecret)}")
            return {
                "success": True,
                "message": "配置已保存",
                "appid": config.appid,
                "seller_id": config.seller_id,
                "updated_at": config.updated_at,
                "has_secret": bool(config.appsecret),
                "secret_preserved": secret_preserved,
                "config_path": str(CONFIG_FILE),
            }
        else:
            logger.warning("⚠️ 配置已更新到内存，但文件保存失败")
            return {
                "success": True,
                "message": "配置已保存（内存）",
                "warning": "文件保存失败",
                "updated_at": config.updated_at,
                "has_secret": bool(config.appsecret),
                "secret_preserved": secret_preserved,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 保存配置失败：{e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"保存失败：{str(e)}")

@app.get("/api/shops")
async def get_shops():
    """
    查询闲鱼店铺信息 - 严格按照文档实现
    POST https://open.goofish.pro/api/open/user/authorize/list
    签名规则：sign = md5("appKey,bodyMd5,timestamp,appSecret")
    """
    logger.info(f"🏪 查询店铺信息 - appid={config.appid}")
    
    if not config.appid or not config.appsecret:
        logger.warning("⚠️ 未配置 appid 或 appsecret")
        raise HTTPException(status_code=400, detail="请先配置 appid 和 appsecret")
    
    # 构建请求
    timestamp = int(time.time())
    body_string = "{}"  # 查询接口无 Body
    
    # 生成签名（正确规则）
    sign = generate_sign(config.appid, body_string, timestamp, config.appsecret)
    
    logger.debug(f"📝 请求参数：appid={config.appid}, timestamp={timestamp}, sign={sign}")
    logger.info(f"🌐 请求 URL: {API_BASE}/api/open/user/authorize/list")
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # POST 请求，参数在 query string 中，body 为空对象
            response = await client.post(
                f"{API_BASE}/api/open/user/authorize/list",
                params={
                    "appid": config.appid,
                    "timestamp": timestamp,
                    "sign": sign,
                },
                data=body_string
            )
            
            elapsed = time.time() - start_time
            logger.info(f"⏱️ 响应时间：{elapsed:.2f}s, 状态码：{response.status_code}")
            logger.debug(f"📦 响应内容：{response.text[:500]}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == 0:
                    result_data = data.get("data", {})
                    shops = result_data.get("list", [])
                    shop_count = len(shops)
                    logger.info(f"✅ 查询成功，共 {shop_count} 个店铺")
                    
                    # 格式化店铺信息
                    formatted_shops = []
                    for shop in shops:
                        formatted_shop = {
                            "authorize_id": shop.get("authorize_id"),
                            "shop_name": shop.get("shop_name"),
                            "user_name": shop.get("user_name"),
                            "user_nick": shop.get("user_nick"),
                            "is_pro": shop.get("is_pro", False),
                            "is_deposit_enough": shop.get("is_deposit_enough", False),
                            "is_valid": shop.get("is_valid", False),
                            "is_trial": shop.get("is_trial", False),
                            "authorize_expires": shop.get("authorize_expires"),
                            "authorize_expires_str": datetime.fromtimestamp(shop.get("authorize_expires", 0)).strftime("%Y-%m-%d %H:%M:%S") if shop.get("authorize_expires") else None,
                            "item_biz_types": shop.get("item_biz_types", ""),
                            "seller_id": shop.get("seller_id"),
                        }
                        formatted_shops.append(formatted_shop)
                    
                    return {
                        "success": True,
                        "data": formatted_shops,
                        "message": f"查询成功，共 {shop_count} 个店铺",
                        "query_time": f"{elapsed:.2f}s"
                    }
                else:
                    error_msg = data.get('msg', 'Unknown error')
                    logger.error(f"❌ API 返回错误：code={data.get('code')}, msg={error_msg}")
                    raise HTTPException(status_code=400, detail=f"API 错误：{error_msg}")
            else:
                logger.error(f"❌ HTTP 错误：{response.status_code} - {response.text[:200]}")
                raise HTTPException(status_code=response.status_code, detail=f"HTTP 错误：{response.status_code}")
    except httpx.TimeoutException as e:
        logger.error(f"⏰ 请求超时：{e}", exc_info=True)
        raise HTTPException(status_code=504, detail=f"请求超时：{str(e)}")
    except httpx.RequestError as e:
        logger.error(f"❌ 请求失败：{e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"请求失败：{str(e)}")

def format_order_time(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None

    try:
        if isinstance(value, (int, float)):
            timestamp = float(value)
            # 兼容秒/毫秒时间戳
            if timestamp > 1e12:
                timestamp = timestamp / 1000
            return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")

        # 尝试解析纯数字字符串
        value_str = str(value)
        if value_str.isdigit():
            timestamp = float(value_str)
            if timestamp > 1e12:
                timestamp = timestamp / 1000
            return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")

        # 其他类型统一返回原始值字符串
        return value_str
    except Exception:
        return str(value)


def get_order_status_text(status: Any) -> str:
    status_map = {
        0: "待付款",
        1: "待发货",
        2: "待收货",
        3: "已完成",
        4: "已关闭",
        5: "退款中",
        6: "已退款",
        21: "待付款",
        22: "已付款",
        23: "已发货",
        24: "已取消",
        31: "已关闭",
    }

    try:
        status_int = int(status)
    except (TypeError, ValueError):
        return str(status or "未知")

    return status_map.get(status_int, f"状态({status_int})")


@app.get("/api/orders")
async def get_orders(page_no: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    """
    查询订单列表（Phase-1 最小可用版）

    TODO(phase-2): 依据上游订单文档补齐筛选能力（订单状态、时间范围、游标分页等）并开放前端高级过滤。
    """
    logger.info(f"🧾 查询订单列表 - appid={config.appid}, page_no={page_no}, page_size={page_size}")

    # 按文档最小参数实现，优先保证链路可用；若上游不接受分页字段，可改为 {}。
    payload = {
        "page_no": page_no,
        "page_size": page_size,
    }

    api_result, elapsed = await call_open_api(
        path="/api/open/order/list",
        body=payload,
        action_name="查询订单列表",
    )

    result_data = api_result.get("data") or {}

    raw_orders: List[Dict[str, Any]] = []
    if isinstance(result_data, dict):
        for key in ("list", "order_list", "orders", "records"):
            candidate = result_data.get(key)
            if isinstance(candidate, list):
                raw_orders = candidate
                break
    elif isinstance(result_data, list):
        raw_orders = result_data

    formatted_orders: List[Dict[str, Any]] = []
    for order in raw_orders:
        if not isinstance(order, dict):
            continue

        amount_value = order.get("amount")
        if amount_value is None:
            amount_value = order.get("pay_amount")
        if amount_value is None:
            amount_value = order.get("total_amount")

        amount_str = "-"
        if isinstance(amount_value, (int, float)):
            amount_str = f"¥{float(amount_value) / 100:.2f}"
        elif isinstance(amount_value, str) and amount_value.isdigit():
            amount_str = f"¥{float(amount_value) / 100:.2f}"

        order_status = order.get("order_status", order.get("status"))
        created_at = order.get("created_at", order.get("create_time", order.get("order_time")))
        goods = order.get("goods") if isinstance(order.get("goods"), dict) else {}

        formatted_orders.append(
            {
                "order_id": order.get("order_id") or order.get("order_no") or order.get("biz_order_id") or order.get("id"),
                "product_id": order.get("product_id") or goods.get("product_id") or order.get("item_id") or goods.get("item_id"),
                "title": order.get("title") or order.get("product_title") or order.get("item_title") or goods.get("title") or "-",
                "amount": amount_value,
                "amount_str": amount_str,
                "order_status": order_status,
                "order_status_text": get_order_status_text(order_status),
                "buyer_name": order.get("buyer_name") or order.get("buyer_nick") or order.get("buyer_id") or "-",
                "seller_name": order.get("seller_name") or order.get("seller_nick") or order.get("user_name") or "-",
                "created_at": created_at,
                "created_at_text": format_order_time(created_at),
                "raw": order,
            }
        )

    pagination = {
        "count": result_data.get("count", len(formatted_orders)) if isinstance(result_data, dict) else len(formatted_orders),
        "page_no": result_data.get("page_no", page_no) if isinstance(result_data, dict) else page_no,
        "page_size": result_data.get("page_size", page_size) if isinstance(result_data, dict) else page_size,
    }

    return {
        "success": True,
        "data": formatted_orders,
        "pagination": pagination,
        "message": f"查询成功，共 {len(formatted_orders)} 条记录",
        "query_time": f"{elapsed:.2f}s",
        "upstream_endpoint": "/api/open/order/list",
    }


@app.get("/api/products")
async def get_products():
    """
    查询商品列表 - 严格按照文档实现
    POST https://open.goofish.pro/api/open/product/list
    签名规则：sign = md5("appKey,bodyMd5,timestamp,appSecret")
    """
    logger.info(f"📦 查询商品列表 - appid={config.appid}")
    
    if not config.appid or not config.appsecret:
        logger.warning("⚠️ 未配置 appid 或 appsecret")
        raise HTTPException(status_code=400, detail="请先配置 appid 和 appsecret")
    
    # 构建请求
    timestamp = int(time.time())
    body_string = "{}"  # 查询接口无 Body
    
    # 生成签名（正确规则）
    sign = generate_sign(config.appid, body_string, timestamp, config.appsecret)
    
    logger.debug(f"📝 请求参数：appid={config.appid}, timestamp={timestamp}, sign={sign}")
    logger.info(f"🌐 请求 URL: {API_BASE}/api/open/product/list")
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # POST 请求，参数在 query string 中，body 为空对象
            response = await client.post(
                f"{API_BASE}/api/open/product/list",
                params={
                    "appid": config.appid,
                    "timestamp": timestamp,
                    "sign": sign,
                },
                data=body_string
            )
            
            elapsed = time.time() - start_time
            logger.info(f"⏱️ 响应时间：{elapsed:.2f}s, 状态码：{response.status_code}")
            logger.debug(f"📦 响应内容：{response.text[:500]}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == 0:
                    result_data = data.get("data", {})
                    products = result_data.get("list", [])
                    product_count = len(products)
                    pagination = {
                        "count": result_data.get("count", product_count),
                        "page_no": result_data.get("page_no", 1),
                        "page_size": result_data.get("page_size", 20),
                    }
                    logger.info(f"✅ 查询成功，共 {product_count} 条记录")
                    
                    # 格式化商品信息
                    formatted_products = []
                    for product in products:
                        formatted_product = {
                            "product_id": product.get("product_id"),
                            "product_status": product.get("product_status"),
                            "product_status_str": get_product_status_text(product.get("product_status")),
                            "title": product.get("title", ""),
                            "price": product.get("price", 0),
                            "price_str": f"¥{product.get('price', 0) / 100:.2f}",
                            "stock": product.get("stock", 0),
                            "sold": product.get("sold", 0),
                            "original_price": product.get("original_price"),
                            "express_fee": product.get("express_fee"),
                        }
                        formatted_products.append(formatted_product)
                    
                    return {
                        "success": True,
                        "data": formatted_products,
                        "pagination": pagination,
                        "message": f"查询成功，共 {product_count} 条记录",
                        "query_time": f"{elapsed:.2f}s"
                    }
                else:
                    error_msg = data.get('msg', 'Unknown error')
                    logger.error(f"❌ API 返回错误：code={data.get('code')}, msg={error_msg}")
                    raise HTTPException(status_code=400, detail=f"API 错误：{error_msg}")
            else:
                logger.error(f"❌ HTTP 错误：{response.status_code} - {response.text[:200]}")
                raise HTTPException(status_code=response.status_code, detail=f"HTTP 错误：{response.status_code}")
    except httpx.TimeoutException as e:
        logger.error(f"⏰ 请求超时：{e}", exc_info=True)
        raise HTTPException(status_code=504, detail=f"请求超时：{str(e)}")
    except httpx.RequestError as e:
        logger.error(f"❌ 请求失败：{e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"请求失败：{str(e)}")



@app.post("/api/products/create")
async def create_product(payload: Dict[str, Any]):
    """
    创建商品 - 结构化参数校验后调用上游接口
    POST https://open.goofish.pro/api/open/product/create
    """
    logger.info("🆕 创建商品请求")

    try:
        validate_create_payload(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    api_result, elapsed = await call_open_api(
        path="/api/open/product/create",
        body=payload,
        action_name="创建商品",
    )

    return {
        "success": True,
        "data": api_result.get("data"),
        "raw": api_result,
        "message": api_result.get("msg", "OK"),
        "query_time": f"{elapsed:.2f}s",
    }


@app.post("/api/products/publish")
async def publish_product(payload: Dict[str, Any]):
    """
    上架商品 - 结构化参数校验后调用上游接口
    POST https://open.goofish.pro/api/open/product/publish

    注：文档说明该接口为异步处理，最终结果需依赖回调通知。
    """
    logger.info("🚀 上架商品请求")

    try:
        validate_publish_payload(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    api_result, elapsed = await call_open_api(
        path="/api/open/product/publish",
        body=payload,
        action_name="上架商品",
    )

    return {
        "success": True,
        "data": api_result.get("data"),
        "raw": api_result,
        "message": api_result.get("msg", "OK"),
        "query_time": f"{elapsed:.2f}s",
        "is_async": True,
    }


@app.post("/api/products/callback/receive")
async def receive_product_callback(payload: Dict[str, Any]):
    """
    商品回调通知接收
    回调字段：seller_id/product_id/product_status/publish_status/item_biz_type/user_name/item_id/task_type/task_time/task_result/err_code/err_msg
    """
    logger.info("📨 收到商品回调通知")

    try:
        validate_callback_payload(payload)
        callback_record = {
            "received_at": datetime.now().isoformat(),
            **{field: payload.get(field) for field in CALLBACK_REQUIRED_FIELDS},
            "raw": payload,
        }
        append_callback_record(callback_record)
        return {"result": "success", "msg": "接收成功"}
    except ValueError as e:
        logger.warning(f"⚠️ 回调字段校验失败：{e}")
        return JSONResponse(status_code=200, content={"result": "fail", "msg": str(e)})
    except Exception as e:
        logger.error(f"❌ 回调处理失败：{e}", exc_info=True)
        return JSONResponse(status_code=200, content={"result": "fail", "msg": "接收失败"})


@app.get("/api/products/callback/records")
async def list_product_callback_records(limit: int = Query(50, ge=1, le=200)):
    records = read_callback_records(limit)
    return {
        "success": True,
        "data": records,
        "count": len(records),
    }


def get_product_status_text(status: int) -> str:
    """获取商品状态文本"""
    status_map = {
        -1: "已删除",
        21: "待发布",
        22: "销售中",
        23: "已售罄",
        31: "手动下架",
        33: "售出下架",
        36: "自动下架",
    }
    return status_map.get(status, f"未知 ({status})")

@app.get("/api/logs")
async def get_logs(lines: int = 100):
    try:
        if not LOG_FILE.exists():
            return {"logs": [], "message": "日志文件不存在"}
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:]
        return {"logs": [line.strip() for line in recent_lines], "total_lines": len(all_lines), "returned_lines": len(recent_lines), "log_file": str(LOG_FILE)}
    except Exception as e:
        logger.error(f"❌ 读取日志失败：{e}")
        raise HTTPException(status_code=500, detail=f"读取日志失败：{str(e)}")

@app.get("/api/status")
async def get_status():
    return {"service": "goofish-backend", "version": "1.0.0", "project_root": str(PROJECT_ROOT), "log_file": str(LOG_FILE), "config_file": str(CONFIG_FILE), "config_exists": CONFIG_FILE.exists(), "timestamp": datetime.now().isoformat()}

# ── 启动/关闭事件 ──
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 FastAPI 应用启动")
    logger.info(f"🌐 API Base: {API_BASE}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 FastAPI 应用关闭")
    logger.info("=" * 60)

# ── 主程序 ──
if __name__ == "__main__":
    logger.info("🎯 直接运行模式启动")
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT, log_level="info")
