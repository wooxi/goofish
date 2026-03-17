#!/usr/bin/env python3
"""
Goofish 闲鱼管理后端 - FastAPI
端口：8001

严格按照接口文档实现：https://open.goofish.pro
签名规则：sign = md5("appKey,bodyMd5,timestamp,appSecret")
"""
import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# ── 路径配置 ──
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
CONFIG_FILE = PROJECT_ROOT / "config" / "app_config.json"
CALLBACK_FILE = PROJECT_ROOT / "data" / "product_callback_records.jsonl"
LOCAL_TASK_FILE = PROJECT_ROOT / "data" / "product_local_task_records.jsonl"
TEMPLATE_FILE = PROJECT_ROOT / "data" / "product_templates.json"

LOG_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
CALLBACK_FILE.parent.mkdir(parents=True, exist_ok=True)
LOCAL_TASK_FILE.parent.mkdir(parents=True, exist_ok=True)
TEMPLATE_FILE.parent.mkdir(parents=True, exist_ok=True)

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
from typing import Optional, List, Dict, Any, Callable
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


async def call_open_api_get(
    path: str,
    query: Optional[Dict[str, Any]] = None,
    action_name: str = "OpenAPI GET 调用",
):
    """调用闲管家 OpenAPI GET 接口并处理公共错误。"""
    ensure_api_configured()

    body_string = "{}"
    params = build_signed_params(body_string)

    if query:
        for key, value in query.items():
            if value is None:
                continue
            params[key] = value

    logger.info(f"🌐 {action_name} URL: {API_BASE}{path}")
    logger.debug(f"📝 {action_name} Query 参数：{params}")

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{API_BASE}{path}",
                params=params,
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

BATCH_PUBLISH_TASK_KEEP = 200
BATCH_DOWNSHELF_TASK_KEEP = 200
BATCH_DELETE_TASK_KEEP = 200
batch_publish_tasks: Dict[str, Dict[str, Any]] = {}
batch_publish_task_order: List[str] = []
batch_downshelf_tasks: Dict[str, Dict[str, Any]] = {}
batch_downshelf_task_order: List[str] = []
batch_delete_tasks: Dict[str, Dict[str, Any]] = {}
batch_delete_task_order: List[str] = []


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


def validate_downshelf_payload(payload: Dict[str, Any]) -> None:
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

    if "notify_url" in payload and payload.get("notify_url") is not None:
        _ensure_str(payload.get("notify_url"), "notify_url", min_len=1)


def validate_delete_payload(payload: Dict[str, Any]) -> None:
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


TASK_STATUS_TEXT = {
    "queued": "等待处理",
    "running": "进行中",
    "finished": "成功",
    "partial_failed": "部分失败",
    "failed": "失败",
}

TASK_TYPE_TEXT = {
    "batch_publish": "批量上架",
    "batch_downshelf": "批量下架",
    "batch_delete": "批量删除",
}


def get_task_status_text(status: str) -> str:
    return TASK_STATUS_TEXT.get(status, status or "未知")


def get_task_type_text(task_type: str) -> str:
    return TASK_TYPE_TEXT.get(task_type, task_type or "未知任务")


def build_local_task_record(task: Dict[str, Any]) -> Dict[str, Any]:
    task_id = str(task.get("task_id") or "").strip()
    status = str(task.get("status") or "queued")
    summary = task.get("summary") if isinstance(task.get("summary"), dict) else {}

    total = int(summary.get("total") or 0)
    success = int(summary.get("success") or 0)
    failed = int(summary.get("failed") or 0)
    processed = int(summary.get("processed") or (success + failed))

    updated_at = task.get("updated_at") or task.get("finished_at") or task.get("started_at") or task.get("created_at")
    product_ids = task.get("product_ids") if isinstance(task.get("product_ids"), list) else []

    return {
        "task_id": task_id,
        "task_type": task.get("task_type") or "batch_publish",
        "task_type_text": get_task_type_text(str(task.get("task_type") or "batch_publish")),
        "status": status,
        "status_text": get_task_status_text(status),
        "created_at": task.get("created_at"),
        "started_at": task.get("started_at"),
        "finished_at": task.get("finished_at"),
        "updated_at": updated_at,
        "operator_user_name": task.get("operator_user_name"),
        "source": task.get("source") or "unknown",
        "summary": {
            "total": total,
            "success": success,
            "failed": failed,
            "processed": processed,
        },
        "product_ids": product_ids[:20],
        "message": task.get("message") or "",
    }


def append_local_task_record(record: Dict[str, Any]) -> None:
    with open(LOCAL_TASK_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_local_task_records(limit: int = 100) -> List[Dict[str, Any]]:
    if not LOCAL_TASK_FILE.exists():
        return []

    try:
        with open(LOCAL_TASK_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        logger.error(f"❌ 读取本地任务记录失败：{e}", exc_info=True)
        return []

    records: List[Dict[str, Any]] = []
    task_seen = set()

    for line in reversed(lines):
        if len(records) >= limit:
            break

        line = line.strip()
        if not line:
            continue

        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue

        task_id = str(record.get("task_id") or "").strip()
        if not task_id or task_id in task_seen:
            continue

        task_seen.add(task_id)
        records.append(record)

    return records


def remember_task(task: Dict[str, Any], task_store: Dict[str, Dict[str, Any]], task_order: List[str], keep_limit: int) -> None:
    task_id = str(task.get("task_id") or "").strip()
    if not task_id:
        return

    task_store[task_id] = task
    task_order.append(task_id)

    while len(task_order) > keep_limit:
        stale_task_id = task_order.pop(0)
        task_store.pop(stale_task_id, None)


def snapshot_and_persist_task(task: Dict[str, Any]) -> Dict[str, Any]:
    task["updated_at"] = datetime.now().isoformat()
    record = build_local_task_record(task)
    append_local_task_record(record)
    return record


def collect_local_task_records(limit: int = 50) -> List[Dict[str, Any]]:
    records_by_task: Dict[str, Dict[str, Any]] = {}

    for task in list(batch_publish_tasks.values()) + list(batch_downshelf_tasks.values()) + list(batch_delete_tasks.values()):
        record = build_local_task_record(task)
        task_id = record.get("task_id")
        if task_id:
            records_by_task[task_id] = record

    for record in read_local_task_records(limit=max(limit * 5, 200)):
        task_id = str(record.get("task_id") or "").strip()
        if not task_id:
            continue
        if task_id in records_by_task:
            continue
        records_by_task[task_id] = record

    records = list(records_by_task.values())
    records.sort(key=lambda item: item.get("updated_at") or item.get("created_at") or "", reverse=True)
    return records[:limit]


def load_templates() -> List[Dict[str, Any]]:
    if not TEMPLATE_FILE.exists():
        return []

    try:
        with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception as e:
        logger.error(f"❌ 读取模板文件失败：{e}", exc_info=True)
        return []


def save_templates(templates: List[Dict[str, Any]]) -> None:
    with open(TEMPLATE_FILE, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=2)


def normalize_template_data(template_data: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(template_data, dict):
        raise ValueError("template_data 必须是对象")

    normalized = {
        "item_biz_type": template_data.get("item_biz_type"),
        "sp_biz_type": template_data.get("sp_biz_type"),
        "channel_cat_id": template_data.get("channel_cat_id"),
        "price": template_data.get("price"),
        "express_fee": template_data.get("express_fee"),
        "stock": template_data.get("stock"),
    }

    publish_shop = template_data.get("publish_shop")
    if publish_shop is not None:
        if not isinstance(publish_shop, dict):
            raise ValueError("template_data.publish_shop 必须是对象")

        images = publish_shop.get("images")
        if images is None:
            normalized_images: List[str] = []
        elif isinstance(images, list):
            normalized_images = [str(img).strip() for img in images if str(img).strip()]
        else:
            raise ValueError("template_data.publish_shop.images 必须是数组")

        normalized["publish_shop"] = {
            "user_name": publish_shop.get("user_name"),
            "province": publish_shop.get("province"),
            "city": publish_shop.get("city"),
            "district": publish_shop.get("district"),
            "title": publish_shop.get("title"),
            "content": publish_shop.get("content"),
            "images": normalized_images,
        }

    for key in list(normalized.keys()):
        value = normalized[key]
        if value is None:
            normalized.pop(key)

    return normalized

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


ORDER_STATUS_MAP: Dict[int, str] = {
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

ORDER_SORT_FIELD_MAP: Dict[str, str] = {
    "amount": "amount",
    "status": "order_status",
    "created_at": "created_at",
}

ORDER_SORT_ORDER_SET = {"asc", "desc"}
ORDER_FETCH_PAGE_SIZE = 100
ORDER_FETCH_MAX_PAGES = 100


def _parse_order_timestamp(value: Any) -> float:
    if value in (None, ""):
        return 0.0

    try:
        if isinstance(value, (int, float)):
            timestamp = float(value)
            return timestamp / 1000 if timestamp > 1e12 else timestamp

        value_str = str(value).strip()
        if value_str.isdigit():
            timestamp = float(value_str)
            return timestamp / 1000 if timestamp > 1e12 else timestamp

        dt = datetime.fromisoformat(value_str.replace("Z", "+00:00"))
        return dt.timestamp()
    except Exception:
        return 0.0


def _normalize_order_status_value(value: Any) -> Optional[Any]:
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return str(value)


def _parse_order_amount_cent(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        return int(value)

    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    return None


def _resolve_order_status(order: Dict[str, Any]) -> Any:
    raw_status = order.get("order_status", order.get("status"))
    normalized = _normalize_order_status_value(raw_status)

    if not isinstance(normalized, int):
        return raw_status

    # 上游 order_status=21/22 语义在不同订单类型下并不稳定，
    # 结合关键时间字段推导更接近业务真实阶段的展示状态。
    pay_time = _parse_order_timestamp(order.get("pay_time"))
    consign_time = _parse_order_timestamp(order.get("consign_time"))
    confirm_time = _parse_order_timestamp(order.get("confirm_time"))

    if normalized in (21, 22):
        if confirm_time > 0:
            return 3   # 已完成
        if consign_time > 0:
            return 23  # 已发货
        if pay_time > 0:
            return 22  # 已付款

    return normalized


def get_order_status_text(status: Any) -> str:
    normalized = _normalize_order_status_value(status)
    if normalized is None:
        return "未知"

    if isinstance(normalized, int):
        return ORDER_STATUS_MAP.get(normalized, f"状态({normalized})")

    return str(normalized)


def _extract_order_list_result(result_data: Any) -> Dict[str, Any]:
    orders: List[Dict[str, Any]] = []
    page_no = None
    page_size = None
    count = None

    if isinstance(result_data, dict):
        for key in ("list", "order_list", "orders", "records"):
            candidate = result_data.get(key)
            if isinstance(candidate, list):
                orders = candidate
                break
        page_no = result_data.get("page_no")
        page_size = result_data.get("page_size")
        count = result_data.get("count")
    elif isinstance(result_data, list):
        orders = result_data

    return {
        "orders": orders,
        "page_no": page_no,
        "page_size": page_size,
        "count": count,
    }


def _format_orders(raw_orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    formatted_orders: List[Dict[str, Any]] = []

    for order in raw_orders:
        if not isinstance(order, dict):
            continue

        amount_value = order.get("amount")
        if amount_value is None:
            amount_value = order.get("pay_amount")
        if amount_value is None:
            amount_value = order.get("total_amount")

        parsed_amount = _parse_order_amount_cent(amount_value)
        amount_int = parsed_amount if parsed_amount is not None else 0
        amount_str = f"¥{amount_int / 100:.2f}" if parsed_amount is not None else "-"

        raw_order_status = order.get("order_status", order.get("status"))
        order_status = _resolve_order_status(order)
        created_at = order.get("created_at", order.get("create_time", order.get("order_time")))
        goods = order.get("goods") if isinstance(order.get("goods"), dict) else {}

        formatted_orders.append(
            {
                "order_id": order.get("order_id") or order.get("order_no") or order.get("biz_order_id") or order.get("id"),
                "product_id": order.get("product_id") or goods.get("product_id") or order.get("item_id") or goods.get("item_id"),
                "title": order.get("title") or order.get("product_title") or order.get("item_title") or goods.get("title") or "-",
                "amount": amount_int,
                "amount_str": amount_str,
                "order_status": order_status,
                "order_status_raw": raw_order_status,
                "order_status_text": get_order_status_text(order_status),
                "buyer_name": order.get("buyer_name") or order.get("buyer_nick") or order.get("buyer_id") or "-",
                "seller_name": order.get("seller_name") or order.get("seller_nick") or order.get("user_name") or "-",
                "created_at": created_at,
                "created_at_text": format_order_time(created_at),
                "raw": order,
            }
        )

    return formatted_orders


def _build_order_status_options(formatted_orders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    preferred_order = [1, 2, 3, 4, 5, 6, 21, 22, 23, 24, 31, 0]
    known_status: Dict[int, str] = {}
    other_status: Dict[str, str] = {}

    for item in formatted_orders:
        normalized = _normalize_order_status_value(item.get("order_status"))
        if normalized is None:
            continue

        label = item.get("order_status_text") or get_order_status_text(normalized)
        if isinstance(normalized, int):
            known_status[normalized] = str(label)
        else:
            other_status[str(normalized)] = str(label)

    options: List[Dict[str, Any]] = []
    added_known = set()

    for code in preferred_order:
        if code in known_status:
            options.append({"value": code, "label": known_status[code]})
            added_known.add(code)

    for code in sorted(known_status.keys()):
        if code in added_known:
            continue
        options.append({"value": code, "label": known_status[code]})

    for key in sorted(other_status.keys()):
        options.append({"value": key, "label": other_status[key]})

    if options:
        return options

    for code in preferred_order:
        if code in ORDER_STATUS_MAP:
            options.append({"value": code, "label": ORDER_STATUS_MAP[code]})

    if options:
        return options

    return [{"value": 0, "label": "待付款"}]


def _get_order_sort_value(item: Dict[str, Any], sort_by: str) -> Any:
    if sort_by == "amount":
        return _to_int(item.get("amount"), 0)

    if sort_by == "status":
        normalized = _normalize_order_status_value(item.get("order_status"))
        if isinstance(normalized, int):
            return normalized
        return 999999

    if sort_by == "created_at":
        return _parse_order_timestamp(item.get("created_at"))

    return 0


def _sort_orders(orders: List[Dict[str, Any]], sort_by: str, sort_order: str) -> List[Dict[str, Any]]:
    reverse = sort_order == "desc"
    return sorted(orders, key=lambda item: _get_order_sort_value(item, sort_by), reverse=reverse)


@app.get("/api/orders")
async def get_orders(
    page_no: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_status: Optional[str] = Query(default=None, description="订单状态筛选"),
    sort_by: Optional[str] = Query(default=None, description="排序字段：amount/status/created_at"),
    sort_order: str = Query(default="desc", description="排序方向：asc/desc"),
):
    """查询订单列表（支持状态筛选 + 排序）"""
    logger.info(
        f"🧾 查询订单列表 - appid={config.appid}, page_no={page_no}, page_size={page_size}, "
        f"order_status={order_status}, sort_by={sort_by}, sort_order={sort_order}"
    )

    normalized_order_status = _normalize_order_status_value(order_status)
    normalized_sort_by = (sort_by or "").strip().lower() or None
    normalized_sort_order = (sort_order or "desc").strip().lower() or "desc"

    if normalized_sort_by and normalized_sort_by not in ORDER_SORT_FIELD_MAP:
        raise HTTPException(status_code=400, detail="sort_by 仅支持：amount、status、created_at")

    if normalized_sort_order not in ORDER_SORT_ORDER_SET:
        raise HTTPException(status_code=400, detail="sort_order 仅支持：asc、desc")

    use_local_filter_sort = normalized_order_status is not None or normalized_sort_by is not None

    # 默认模式：透传上游分页
    if not use_local_filter_sort:
        payload = {
            "page_no": page_no,
            "page_size": page_size,
        }

        api_result, elapsed = await call_open_api(
            path="/api/open/order/list",
            body=payload,
            action_name="查询订单列表",
        )

        extracted = _extract_order_list_result(api_result.get("data", {}))
        raw_orders = extracted["orders"]
        upstream_page_no = extracted["page_no"]
        upstream_page_size = extracted["page_size"]
        total_count_raw = extracted["count"]

        formatted_orders = _format_orders(raw_orders)
        total_count = _safe_positive_int(total_count_raw, len(formatted_orders))
        resolved_page_no = _safe_positive_int(upstream_page_no, page_no)
        resolved_page_size = _safe_positive_int(upstream_page_size, page_size)

        return {
            "success": True,
            "data": formatted_orders,
            "pagination": {
                "count": total_count,
                "page_no": resolved_page_no,
                "page_size": resolved_page_size,
                "upstream_page_no": upstream_page_no,
                "upstream_page_size": upstream_page_size,
                "local_filter_sort": False,
            },
            "message": f"查询成功，本页 {len(formatted_orders)} 条，总计 {total_count} 条",
            "query_time": f"{elapsed:.2f}s",
            "upstream_endpoint": "/api/open/order/list",
            "status_options": _build_order_status_options(formatted_orders),
            "applied_filters": {
                "order_status": normalized_order_status,
                "sort_by": normalized_sort_by,
                "sort_order": normalized_sort_order,
            },
        }

    # 增强模式：拉取多页后本地筛选/排序，再分页返回
    all_orders: List[Dict[str, Any]] = []
    total_elapsed = 0.0
    upstream_total_count = 0

    for upstream_page_no in range(1, ORDER_FETCH_MAX_PAGES + 1):
        payload = {
            "page_no": upstream_page_no,
            "page_size": ORDER_FETCH_PAGE_SIZE,
        }

        api_result, elapsed = await call_open_api(
            path="/api/open/order/list",
            body=payload,
            action_name="查询订单列表（筛选/排序模式）",
        )
        total_elapsed += elapsed

        extracted = _extract_order_list_result(api_result.get("data", {}))
        page_orders = extracted["orders"]
        result_count = _safe_positive_int(extracted["count"], 0)
        if result_count > 0:
            upstream_total_count = result_count

        if not page_orders:
            break

        all_orders.extend(page_orders)

        if len(page_orders) < ORDER_FETCH_PAGE_SIZE:
            break

        if upstream_total_count > 0 and len(all_orders) >= upstream_total_count:
            break

    formatted_orders = _format_orders(all_orders)
    status_options = _build_order_status_options(formatted_orders)

    if normalized_order_status is not None:
        formatted_orders = [
            item
            for item in formatted_orders
            if _normalize_order_status_value(item.get("order_status")) == normalized_order_status
        ]

    if normalized_sort_by:
        formatted_orders = _sort_orders(formatted_orders, normalized_sort_by, normalized_sort_order)

    total_count = len(formatted_orders)
    start = (page_no - 1) * page_size
    end = start + page_size
    paged_orders = formatted_orders[start:end] if start < total_count else []

    return {
        "success": True,
        "data": paged_orders,
        "pagination": {
            "count": total_count,
            "page_no": page_no,
            "page_size": page_size,
            "upstream_total_count": upstream_total_count,
            "local_filter_sort": True,
        },
        "message": f"查询成功，本页 {len(paged_orders)} 条，总计 {total_count} 条",
        "query_time": f"{total_elapsed:.2f}s",
        "upstream_endpoint": "/api/open/order/list",
        "status_options": status_options,
        "applied_filters": {
            "order_status": normalized_order_status,
            "sort_by": normalized_sort_by,
            "sort_order": normalized_sort_order,
        },
    }


ORDER_DETAIL_QUERY_CANDIDATES = [
    {"method": "get", "path": "/api/open/order/detail", "field": "order_id"},
    {"method": "get", "path": "/api/open/order/detail", "field": "order_no"},
    {"method": "post", "path": "/api/open/order/detail", "field": "order_id"},
    {"method": "post", "path": "/api/open/order/detail", "field": "order_no"},
    {"method": "get", "path": "/api/open/order/get", "field": "order_id"},
    {"method": "post", "path": "/api/open/order/get", "field": "order_id"},
]


def _stringify_order_identity(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return text


def _collect_order_identity_values(order: Dict[str, Any]) -> List[str]:
    values = [
        order.get("order_id"),
        order.get("order_no"),
        order.get("biz_order_id"),
        order.get("id"),
    ]
    normalized: List[str] = []
    for value in values:
        text = _stringify_order_identity(value)
        if text and text not in normalized:
            normalized.append(text)
    return normalized


def _extract_order_detail_result(result_data: Any) -> Dict[str, Any]:
    if isinstance(result_data, list):
        for item in result_data:
            if isinstance(item, dict):
                return item
        return {}

    if not isinstance(result_data, dict):
        return {}

    for key in ("detail", "order", "order_info", "info"):
        candidate = result_data.get(key)
        if isinstance(candidate, dict):
            return candidate

    nested = result_data.get("data")
    if isinstance(nested, dict):
        return nested

    return result_data


def _format_cent_amount_text(value: Any) -> str:
    cent = _parse_order_amount_cent(value)
    if cent is None:
        return "-"
    return f"¥{cent / 100:.2f}"


def _parse_order_quantity(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _extract_order_goods_items(detail: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_candidates: List[Dict[str, Any]] = []

    for key in ("goods_items", "goods_list", "item_list", "order_items", "products", "product_list", "items"):
        value = detail.get(key)
        if isinstance(value, list):
            raw_candidates.extend([item for item in value if isinstance(item, dict)])
        elif isinstance(value, dict):
            raw_candidates.append(value)

    goods = detail.get("goods")
    if isinstance(goods, dict):
        raw_candidates.append(goods)
    elif isinstance(goods, list):
        raw_candidates.extend([item for item in goods if isinstance(item, dict)])

    if not raw_candidates:
        title = detail.get("title") or detail.get("product_title") or detail.get("item_title")
        if title:
            raw_candidates.append(
                {
                    "title": title,
                    "quantity": detail.get("quantity") or detail.get("num") or 1,
                    "unit_price": detail.get("unit_price") or detail.get("price"),
                    "image": detail.get("image") or detail.get("pic_url") or detail.get("image_url"),
                    "product_id": detail.get("product_id") or detail.get("item_id"),
                }
            )

    normalized_items: List[Dict[str, Any]] = []
    for item in raw_candidates:
        quantity = _parse_order_quantity(
            item.get("quantity", item.get("num", item.get("count", item.get("item_num"))))
        )
        if quantity is None or quantity <= 0:
            quantity = 1

        unit_price_raw = (
            item.get("unit_price")
            or item.get("price")
            or item.get("item_price")
            or item.get("sku_price")
        )
        unit_price = _parse_order_amount_cent(unit_price_raw)
        unit_price_text = _format_cent_amount_text(unit_price_raw)

        total_price_raw = item.get("total_price") or item.get("amount")
        if total_price_raw in (None, "") and unit_price is not None:
            total_price_raw = unit_price * quantity

        normalized_items.append(
            {
                "title": item.get("title") or item.get("product_title") or item.get("item_title") or "-",
                "quantity": quantity,
                "unit_price": unit_price,
                "unit_price_str": unit_price_text,
                "total_price": _parse_order_amount_cent(total_price_raw),
                "total_price_str": _format_cent_amount_text(total_price_raw),
                "image": item.get("image")
                or item.get("image_url")
                or item.get("pic_url")
                or item.get("main_image"),
                "product_id": item.get("product_id") or item.get("item_id") or detail.get("product_id"),
                "sku": item.get("sku") or item.get("sku_name") or item.get("spec") or "",
                "raw": item,
            }
        )

    return normalized_items


def _extract_order_logistics_items(detail: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_items: List[Dict[str, Any]] = []

    for key in ("logistics_items", "logistics_list", "logistics", "express", "shipping", "delivery"):
        value = detail.get(key)
        if isinstance(value, list):
            raw_items.extend([item for item in value if isinstance(item, dict)])
        elif isinstance(value, dict):
            nested_list = value.get("list") if isinstance(value.get("list"), list) else None
            if nested_list:
                raw_items.extend([item for item in nested_list if isinstance(item, dict)])
            else:
                raw_items.append(value)

    if not raw_items:
        logistics_no = detail.get("logistics_no") or detail.get("tracking_no") or detail.get("waybill_no")
        company = detail.get("logistics_company") or detail.get("express_company") or detail.get("company")
        if logistics_no or company:
            raw_items.append(
                {
                    "logistics_no": logistics_no,
                    "company": company,
                    "status": detail.get("logistics_status") or detail.get("shipping_status"),
                    "receiver": detail.get("receiver_name"),
                    "receiver_phone": detail.get("receiver_phone"),
                    "address": detail.get("receiver_address") or detail.get("address"),
                }
            )

    normalized: List[Dict[str, Any]] = []
    for item in raw_items:
        logistics_no = (
            item.get("logistics_no")
            or item.get("tracking_no")
            or item.get("waybill_no")
            or item.get("mail_no")
            or ""
        )
        company = item.get("company") or item.get("logistics_company") or item.get("express_company") or ""
        status = item.get("status") or item.get("logistics_status") or item.get("shipping_status") or ""
        receiver = item.get("receiver") or item.get("receiver_name") or ""
        receiver_phone = item.get("receiver_phone") or item.get("phone") or ""
        address = item.get("address") or item.get("receiver_address") or ""

        normalized.append(
            {
                "logistics_no": _stringify_order_identity(logistics_no) or "-",
                "company": _stringify_order_identity(company) or "-",
                "status": _stringify_order_identity(status) or "-",
                "receiver": _stringify_order_identity(receiver) or "-",
                "receiver_phone": _stringify_order_identity(receiver_phone) or "-",
                "address": _stringify_order_identity(address) or "-",
                "raw": item,
            }
        )

    return normalized


def _format_order_detail(detail: Dict[str, Any], order_identifier: str) -> Dict[str, Any]:
    base = _format_orders([detail])
    base_order = base[0] if base else {}

    order_id = (
        base_order.get("order_id")
        or detail.get("order_id")
        or detail.get("order_no")
        or detail.get("biz_order_id")
        or order_identifier
    )
    order_no = detail.get("order_no") or detail.get("order_id") or order_id

    amount_value = detail.get("amount")
    if amount_value is None:
        amount_value = detail.get("pay_amount")
    if amount_value is None:
        amount_value = detail.get("total_amount")

    amount_int = _parse_order_amount_cent(amount_value)

    created_at = detail.get("created_at") or detail.get("create_time") or detail.get("order_time")
    pay_time = detail.get("pay_time") or detail.get("pay_at") or detail.get("payment_time")

    buyer_name = (
        detail.get("buyer_name")
        or detail.get("buyer_nick")
        or detail.get("buyer_id")
        or base_order.get("buyer_name")
        or "-"
    )
    seller_name = (
        detail.get("seller_name")
        or detail.get("seller_nick")
        or detail.get("user_name")
        or detail.get("seller_id")
        or base_order.get("seller_name")
        or "-"
    )

    order_status = _resolve_order_status(detail)
    order_status_text = detail.get("order_status_text") or get_order_status_text(order_status)

    goods_items = _extract_order_goods_items(detail)
    logistics_items = _extract_order_logistics_items(detail)

    return {
        "order_id": order_id,
        "order_no": order_no,
        "order_status": order_status,
        "order_status_text": order_status_text,
        "buyer_name": buyer_name,
        "buyer_id": detail.get("buyer_id") or detail.get("buyer_open_id") or "",
        "seller_name": seller_name,
        "seller_id": detail.get("seller_id") or "",
        "amount": amount_int,
        "amount_str": _format_cent_amount_text(amount_value),
        "created_at": created_at,
        "created_at_text": format_order_time(created_at),
        "pay_time": pay_time,
        "pay_time_text": format_order_time(pay_time),
        "consign_time": detail.get("consign_time"),
        "consign_time_text": format_order_time(detail.get("consign_time")),
        "confirm_time": detail.get("confirm_time"),
        "confirm_time_text": format_order_time(detail.get("confirm_time")),
        "title": detail.get("title") or detail.get("product_title") or detail.get("item_title") or base_order.get("title") or "-",
        "product_id": detail.get("product_id") or detail.get("item_id") or base_order.get("product_id"),
        "goods_items": goods_items,
        "logistics_items": logistics_items,
    }


async def _find_order_detail_from_list(order_identifier: str) -> Dict[str, Any]:
    total_elapsed = 0.0
    matched_order: Optional[Dict[str, Any]] = None

    for upstream_page_no in range(1, ORDER_FETCH_MAX_PAGES + 1):
        payload = {
            "page_no": upstream_page_no,
            "page_size": ORDER_FETCH_PAGE_SIZE,
        }

        api_result, elapsed = await call_open_api(
            path="/api/open/order/list",
            body=payload,
            action_name="查询订单详情（列表回退）",
        )
        total_elapsed += elapsed

        extracted = _extract_order_list_result(api_result.get("data", {}))
        page_orders = extracted["orders"]

        if not page_orders:
            break

        for order in page_orders:
            if not isinstance(order, dict):
                continue
            identities = _collect_order_identity_values(order)
            if order_identifier in identities:
                matched_order = order
                break

        if matched_order is not None:
            break

        if len(page_orders) < ORDER_FETCH_PAGE_SIZE:
            break

    return {
        "order": matched_order,
        "elapsed": total_elapsed,
    }


@app.get("/api/orders/{order_id}")
async def get_order_detail(order_id: str):
    """查询订单详情。优先走上游 detail 接口；失败时降级从订单列表中回退。"""
    order_identifier = _stringify_order_identity(order_id)
    if not order_identifier:
        raise HTTPException(status_code=400, detail="order_id 不能为空")

    logger.info(f"🔎 查询订单详情 - order_id={order_identifier}")

    detail_data: Optional[Dict[str, Any]] = None
    detail_source = "upstream"
    fallback_used = False
    total_elapsed = 0.0
    upstream_errors: List[str] = []

    for candidate in ORDER_DETAIL_QUERY_CANDIDATES:
        method = candidate["method"]
        path = candidate["path"]
        field = candidate["field"]

        try:
            if method == "get":
                api_result, elapsed = await call_open_api_get(
                    path=path,
                    query={field: order_identifier},
                    action_name=f"查询订单详情（GET {field}）",
                )
            else:
                api_result, elapsed = await call_open_api(
                    path=path,
                    body={field: order_identifier},
                    action_name=f"查询订单详情（POST {field}）",
                )

            total_elapsed += elapsed
            extracted = _extract_order_detail_result(api_result.get("data", {}))
            if extracted:
                detail_data = extracted
                break

            upstream_errors.append(f"{method.upper()} {path}({field}) 返回空数据")
        except HTTPException as exc:
            upstream_errors.append(f"{method.upper()} {path}({field}) 失败：{exc.detail}")

    if detail_data is None:
        fallback_result = await _find_order_detail_from_list(order_identifier)
        total_elapsed += float(fallback_result.get("elapsed") or 0.0)
        fallback_order = fallback_result.get("order")

        if isinstance(fallback_order, dict):
            detail_data = fallback_order
            detail_source = "list_fallback"
            fallback_used = True

    if detail_data is None:
        if upstream_errors:
            logger.warning(f"⚠️ 订单详情查询失败 - order_id={order_identifier}, errors={upstream_errors[:2]}")
        raise HTTPException(status_code=404, detail=f"未找到订单详情：{order_identifier}")

    formatted_detail = _format_order_detail(detail_data, order_identifier)

    response_payload: Dict[str, Any] = {
        "success": True,
        "data": formatted_detail,
        "raw": detail_data,
        "message": "订单详情查询成功" if not fallback_used else "订单详情查询成功（已使用列表回退）",
        "query_time": f"{total_elapsed:.2f}s",
        "detail_source": detail_source,
        "fallback_used": fallback_used,
    }

    if fallback_used:
        response_payload["warning"] = "上游订单详情接口暂不可用，当前结果来自订单列表回退，字段可能不完整。"
    if upstream_errors:
        response_payload["upstream_errors"] = upstream_errors[:3]

    return response_payload


PRODUCT_STATUS_MAP: Dict[int, str] = {
    -1: "已删除",
    21: "仓库中",
    22: "销售中",
    23: "已售罄",
    31: "已下架",
    33: "售出下架",
    36: "自动下架",
}

PRODUCT_SORT_FIELD_MAP: Dict[str, str] = {
    "price": "price",
    "stock": "stock",
    "sold": "sold",
    "status": "product_status",
}

PRODUCT_SORT_ORDER_SET = {"asc", "desc"}
PRODUCT_FETCH_PAGE_SIZE = 100
PRODUCT_FETCH_MAX_PAGES = 100


def _safe_positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _extract_product_list_result(result_data: Any) -> Dict[str, Any]:
    products: List[Dict[str, Any]] = []
    page_no = None
    page_size = None
    count = None

    if isinstance(result_data, dict):
        candidate = result_data.get("list", [])
        if isinstance(candidate, list):
            products = candidate
        page_no = result_data.get("page_no")
        page_size = result_data.get("page_size")
        count = result_data.get("count")
    elif isinstance(result_data, list):
        products = result_data

    return {
        "products": products,
        "page_no": page_no,
        "page_size": page_size,
        "count": count,
    }


def _format_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    formatted_products: List[Dict[str, Any]] = []
    for product in products:
        if not isinstance(product, dict):
            continue

        price_int = _to_int(product.get("price"), 0)
        stock_int = _to_int(product.get("stock"), 0)
        sold_int = _to_int(product.get("sold"), 0)
        status_int = _to_int(product.get("product_status"), 0)

        formatted_products.append(
            {
                "product_id": product.get("product_id"),
                "product_status": status_int,
                "product_status_str": get_product_status_text(status_int),
                "title": product.get("title", ""),
                "price": price_int,
                "price_str": f"¥{price_int / 100:.2f}",
                "stock": stock_int,
                "sold": sold_int,
                "original_price": product.get("original_price"),
                "express_fee": product.get("express_fee"),
            }
        )
    return formatted_products


def _extract_product_detail_result(result_data: Any) -> Dict[str, Any]:
    if not isinstance(result_data, dict):
        return {}

    for key in ("detail", "product", "item"):
        candidate = result_data.get(key)
        if isinstance(candidate, dict):
            return candidate

    nested_data = result_data.get("data")
    if isinstance(nested_data, dict):
        return nested_data

    return result_data


def _format_product_detail(detail: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(detail, dict):
        return {}

    formatted = dict(detail)

    raw_status = detail.get("product_status")
    status_int = _to_int(raw_status, 0)
    if raw_status is not None and raw_status != "":
        formatted["product_status"] = status_int
        formatted["product_status_str"] = detail.get("product_status_str") or get_product_status_text(status_int)

    raw_price = detail.get("price")
    if raw_price is not None and raw_price != "":
        price_int = _to_int(raw_price, 0)
        formatted["price"] = price_int
        formatted["price_str"] = detail.get("price_str") or f"¥{price_int / 100:.2f}"

    raw_original_price = detail.get("original_price")
    if raw_original_price is not None and raw_original_price != "":
        original_price_int = _to_int(raw_original_price, 0)
        formatted["original_price"] = original_price_int
        formatted["original_price_str"] = detail.get("original_price_str") or f"¥{original_price_int / 100:.2f}"

    raw_express_fee = detail.get("express_fee")
    if raw_express_fee is not None and raw_express_fee != "":
        express_fee_int = _to_int(raw_express_fee, 0)
        formatted["express_fee"] = express_fee_int
        formatted["express_fee_str"] = detail.get("express_fee_str") or f"¥{express_fee_int / 100:.2f}"

    raw_stock = detail.get("stock")
    if raw_stock is not None and raw_stock != "":
        formatted["stock"] = _to_int(raw_stock, 0)

    raw_sold = detail.get("sold")
    if raw_sold is not None and raw_sold != "":
        formatted["sold"] = _to_int(raw_sold, 0)

    return formatted


def _get_product_status_options() -> List[Dict[str, Any]]:
    preferred_order = [22, 21, 31, 23, 33, 36, -1]
    options: List[Dict[str, Any]] = []
    added = set()

    for code in preferred_order:
        if code in PRODUCT_STATUS_MAP:
            options.append({"value": code, "label": PRODUCT_STATUS_MAP[code]})
            added.add(code)

    for code in sorted(PRODUCT_STATUS_MAP.keys()):
        if code in added:
            continue
        options.append({"value": code, "label": PRODUCT_STATUS_MAP[code]})

    return options


def _sort_products(products: List[Dict[str, Any]], sort_by: str, sort_order: str) -> List[Dict[str, Any]]:
    sort_field = PRODUCT_SORT_FIELD_MAP[sort_by]
    reverse = sort_order == "desc"
    return sorted(products, key=lambda item: _to_int(item.get(sort_field), 0), reverse=reverse)


@app.get("/api/products")
async def get_products(
    page_no: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_status: Optional[int] = Query(default=None, description="商品状态筛选"),
    sort_by: Optional[str] = Query(default=None, description="排序字段：price/stock/sold/status"),
    sort_order: str = Query(default="desc", description="排序方向：asc/desc"),
):
    """
    查询商品列表（支持销售状态筛选 + 排序）
    """
    logger.info(
        f"📦 查询商品列表 - appid={config.appid}, page_no={page_no}, page_size={page_size}, "
        f"product_status={product_status}, sort_by={sort_by}, sort_order={sort_order}"
    )

    if not config.appid or not config.appsecret:
        logger.warning("⚠️ 未配置 appid 或 appsecret")
        raise HTTPException(status_code=400, detail="请先配置 appid 和 appsecret")

    normalized_sort_by = (sort_by or "").strip().lower() or None
    normalized_sort_order = (sort_order or "desc").strip().lower() or "desc"

    if normalized_sort_by and normalized_sort_by not in PRODUCT_SORT_FIELD_MAP:
        raise HTTPException(status_code=400, detail="sort_by 仅支持：price、stock、sold、status")

    if normalized_sort_order not in PRODUCT_SORT_ORDER_SET:
        raise HTTPException(status_code=400, detail="sort_order 仅支持：asc、desc")

    use_local_filter_sort = product_status is not None or normalized_sort_by is not None

    # 默认模式：单页透传上游分页
    if not use_local_filter_sort:
        body_payload = {
            "page_no": page_no,
            "page_size": page_size,
        }

        api_result, elapsed = await call_open_api(
            path="/api/open/product/list",
            body=body_payload,
            action_name="查询商品列表",
        )

        extracted = _extract_product_list_result(api_result.get("data", {}))
        upstream_products = extracted["products"]
        upstream_page_no = extracted["page_no"]
        upstream_page_size = extracted["page_size"]
        total_count_raw = extracted["count"]

        total_count = _safe_positive_int(total_count_raw, len(upstream_products))
        resolved_page_no = _safe_positive_int(upstream_page_no, page_no)
        resolved_page_size = _safe_positive_int(upstream_page_size, page_size)

        pagination = {
            "count": total_count,
            "page_no": resolved_page_no,
            "page_size": resolved_page_size,
            "upstream_page_no": upstream_page_no,
            "upstream_page_size": upstream_page_size,
            "local_filter_sort": False,
        }

        formatted_products = _format_products(upstream_products)
        logger.info(f"✅ 查询成功，返回 {len(formatted_products)} 条（总数 {total_count}）")

        return {
            "success": True,
            "data": formatted_products,
            "pagination": pagination,
            "message": f"查询成功，本页 {len(formatted_products)} 条，总计 {total_count} 条",
            "query_time": f"{elapsed:.2f}s",
            "status_options": _get_product_status_options(),
            "applied_filters": {
                "product_status": product_status,
                "sort_by": normalized_sort_by,
                "sort_order": normalized_sort_order,
            },
        }

    # 增强模式：拉取多页后在本地执行筛选和排序，再分页返回
    all_products: List[Dict[str, Any]] = []
    total_elapsed = 0.0
    upstream_total_count = 0

    for upstream_page_no in range(1, PRODUCT_FETCH_MAX_PAGES + 1):
        body_payload = {
            "page_no": upstream_page_no,
            "page_size": PRODUCT_FETCH_PAGE_SIZE,
        }
        api_result, elapsed = await call_open_api(
            path="/api/open/product/list",
            body=body_payload,
            action_name="查询商品列表（筛选/排序模式）",
        )
        total_elapsed += elapsed

        extracted = _extract_product_list_result(api_result.get("data", {}))
        page_products = extracted["products"]
        result_count = _safe_positive_int(extracted["count"], 0)
        if result_count > 0:
            upstream_total_count = result_count

        if not page_products:
            break

        all_products.extend(page_products)

        if len(page_products) < PRODUCT_FETCH_PAGE_SIZE:
            break

        if upstream_total_count > 0 and len(all_products) >= upstream_total_count:
            break

    formatted_products = _format_products(all_products)

    if product_status is not None:
        formatted_products = [
            item for item in formatted_products if _to_int(item.get("product_status"), 0) == product_status
        ]

    if normalized_sort_by:
        formatted_products = _sort_products(formatted_products, normalized_sort_by, normalized_sort_order)

    total_count = len(formatted_products)
    start = (page_no - 1) * page_size
    end = start + page_size
    paged_products = formatted_products[start:end] if start < total_count else []

    logger.info(
        f"✅ 查询成功（本地筛选排序），源数据 {len(all_products)} 条，筛选后 {total_count} 条，"
        f"返回第 {page_no} 页 {len(paged_products)} 条"
    )

    return {
        "success": True,
        "data": paged_products,
        "pagination": {
            "count": total_count,
            "page_no": page_no,
            "page_size": page_size,
            "upstream_total_count": upstream_total_count,
            "local_filter_sort": True,
        },
        "message": f"查询成功，本页 {len(paged_products)} 条，总计 {total_count} 条",
        "query_time": f"{total_elapsed:.2f}s",
        "status_options": _get_product_status_options(),
        "applied_filters": {
            "product_status": product_status,
            "sort_by": normalized_sort_by,
            "sort_order": normalized_sort_order,
        },
    }


@app.get("/api/products/{product_id}")
async def get_product_detail(product_id: int):
    """查询商品详情。"""
    if product_id <= 0:
        raise HTTPException(status_code=400, detail="product_id 必须大于 0")

    logger.info(f"🔎 查询商品详情 - product_id={product_id}")

    try:
        api_result, elapsed = await call_open_api_get(
            path="/api/open/product/detail",
            query={"product_id": product_id},
            action_name="查询商品详情",
        )
    except HTTPException as exc:
        if exc.status_code != 404:
            raise

        logger.warning("⚠️ 商品详情 GET 接口不可用，回退为 POST 调用")
        api_result, elapsed = await call_open_api(
            path="/api/open/product/detail",
            body={"product_id": product_id},
            action_name="查询商品详情（POST 回退）",
        )

    raw_data = api_result.get("data", {})
    detail = _extract_product_detail_result(raw_data)
    formatted_detail = _format_product_detail(detail)

    if not formatted_detail:
        formatted_detail = {"product_id": product_id}

    logger.info(f"✅ 商品详情查询成功 - product_id={product_id}")

    return {
        "success": True,
        "data": formatted_detail,
        "raw": raw_data,
        "message": "商品详情查询成功",
        "query_time": f"{elapsed:.2f}s",
    }


async def execute_publish_action(payload: Dict[str, Any], action_name: str = "上架商品") -> Dict[str, Any]:
    validate_publish_payload(payload)
    api_result, elapsed = await call_open_api(
        path="/api/open/product/publish",
        body=payload,
        action_name=action_name,
    )

    return {
        "data": api_result.get("data"),
        "raw": api_result,
        "message": api_result.get("msg", "OK"),
        "query_time": f"{elapsed:.2f}s",
        "is_async": True,
    }


async def execute_downshelf_action(payload: Dict[str, Any], action_name: str = "下架商品") -> Dict[str, Any]:
    validate_downshelf_payload(payload)
    api_result, elapsed = await call_open_api(
        path="/api/open/product/downShelf",
        body=payload,
        action_name=action_name,
    )

    return {
        "data": api_result.get("data"),
        "raw": api_result,
        "message": api_result.get("msg", "OK"),
        "query_time": f"{elapsed:.2f}s",
        "is_async": True,
    }


async def execute_delete_action(payload: Dict[str, Any], action_name: str = "删除商品") -> Dict[str, Any]:
    validate_delete_payload(payload)
    api_result, elapsed = await call_open_api(
        path="/api/open/product/delete",
        body=payload,
        action_name=action_name,
    )

    return {
        "data": api_result.get("data"),
        "raw": api_result,
        "message": api_result.get("msg", "OK"),
        "query_time": f"{elapsed:.2f}s",
        "is_async": True,
    }


def normalize_batch_publish_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    product_ids = payload.get("product_ids")
    user_name = payload.get("user_name")
    notify_url = payload.get("notify_url")
    specify_publish_time = payload.get("specify_publish_time")

    if not isinstance(product_ids, list) or len(product_ids) == 0:
        raise HTTPException(status_code=400, detail="product_ids 必须是非空数组")
    if len(product_ids) > 100:
        raise HTTPException(status_code=400, detail="单次批量上架最多支持 100 条")
    if not isinstance(user_name, str) or not user_name.strip():
        raise HTTPException(status_code=400, detail="user_name 为必填字符串")

    normalized_ids: List[int] = []
    seen_ids = set()
    for idx, product_id in enumerate(product_ids):
        try:
            normalized_id = _ensure_int(product_id, f"product_ids[{idx}]")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if normalized_id <= 0:
            raise HTTPException(status_code=400, detail=f"product_ids[{idx}] 必须大于 0")

        if normalized_id in seen_ids:
            continue
        seen_ids.add(normalized_id)
        normalized_ids.append(normalized_id)

    source = payload.get("source")

    return {
        "product_ids": normalized_ids,
        "user_name": user_name.strip(),
        "notify_url": notify_url.strip() if isinstance(notify_url, str) and notify_url.strip() else None,
        "specify_publish_time": specify_publish_time.strip() if isinstance(specify_publish_time, str) and specify_publish_time.strip() else None,
        "source": source.strip() if isinstance(source, str) and source.strip() else "products_page",
    }


def normalize_batch_downshelf_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    product_ids = payload.get("product_ids")
    user_name = payload.get("user_name")
    notify_url = payload.get("notify_url")
    source = payload.get("source")

    if not isinstance(product_ids, list) or len(product_ids) == 0:
        raise HTTPException(status_code=400, detail="product_ids 必须是非空数组")
    if len(product_ids) > 100:
        raise HTTPException(status_code=400, detail="单次批量下架最多支持 100 条")
    if not isinstance(user_name, str) or not user_name.strip():
        raise HTTPException(status_code=400, detail="user_name 为必填字符串")

    normalized_ids: List[int] = []
    seen_ids = set()
    for idx, product_id in enumerate(product_ids):
        try:
            normalized_id = _ensure_int(product_id, f"product_ids[{idx}]")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if normalized_id <= 0:
            raise HTTPException(status_code=400, detail=f"product_ids[{idx}] 必须大于 0")

        if normalized_id in seen_ids:
            continue
        seen_ids.add(normalized_id)
        normalized_ids.append(normalized_id)

    return {
        "product_ids": normalized_ids,
        "user_name": user_name.strip(),
        "notify_url": notify_url.strip() if isinstance(notify_url, str) and notify_url.strip() else None,
        "source": source.strip() if isinstance(source, str) and source.strip() else "products_page",
    }


def normalize_batch_delete_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    product_ids = payload.get("product_ids")
    user_name = payload.get("user_name")
    notify_url = payload.get("notify_url")
    source = payload.get("source")

    if not isinstance(product_ids, list) or len(product_ids) == 0:
        raise HTTPException(status_code=400, detail="product_ids 必须是非空数组")
    if len(product_ids) > 100:
        raise HTTPException(status_code=400, detail="单次批量删除最多支持 100 条")
    if not isinstance(user_name, str) or not user_name.strip():
        raise HTTPException(status_code=400, detail="user_name 为必填字符串")

    normalized_ids: List[int] = []
    seen_ids = set()
    for idx, product_id in enumerate(product_ids):
        try:
            normalized_id = _ensure_int(product_id, f"product_ids[{idx}]")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if normalized_id <= 0:
            raise HTTPException(status_code=400, detail=f"product_ids[{idx}] 必须大于 0")

        if normalized_id in seen_ids:
            continue
        seen_ids.add(normalized_id)
        normalized_ids.append(normalized_id)

    return {
        "product_ids": normalized_ids,
        "user_name": user_name.strip(),
        "notify_url": notify_url.strip() if isinstance(notify_url, str) and notify_url.strip() else None,
        "source": source.strip() if isinstance(source, str) and source.strip() else "products_page",
    }


async def execute_batch_publish_sequence(
    normalized_payload: Dict[str, Any],
    progress_hook: Optional[Callable[[int, int, Dict[str, Any]], None]] = None,
) -> Dict[str, Any]:
    product_ids: List[int] = normalized_payload["product_ids"]
    user_name: str = normalized_payload["user_name"]
    notify_url: Optional[str] = normalized_payload.get("notify_url")
    specify_publish_time: Optional[str] = normalized_payload.get("specify_publish_time")

    results: List[Dict[str, Any]] = []
    success_count = 0

    for product_id in product_ids:
        single_payload: Dict[str, Any] = {
            "product_id": product_id,
            "user_name": [user_name],
        }
        if notify_url:
            single_payload["notify_url"] = notify_url
        if specify_publish_time:
            single_payload["specify_publish_time"] = specify_publish_time

        try:
            single_result = await execute_publish_action(single_payload, action_name=f"批量上架[{product_id}]")
            results.append(
                {
                    "product_id": product_id,
                    "success": True,
                    "message": single_result.get("message", "OK"),
                    "query_time": single_result.get("query_time"),
                    "data": single_result.get("data"),
                }
            )
            success_count += 1
        except ValueError as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )
        except HTTPException as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": e.detail,
                }
            )
        except Exception as e:
            logger.error(f"❌ 批量上架单条失败 product_id={product_id}: {e}", exc_info=True)
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )

        if progress_hook:
            progress_hook(success_count, len(results), results[-1])

    failed_count = len(results) - success_count
    return {
        "summary": {
            "total": len(results),
            "success": success_count,
            "failed": failed_count,
            "processed": len(results),
        },
        "results": results,
        "message": f"批量上架执行完成：成功 {success_count} 条，失败 {failed_count} 条",
    }


async def execute_batch_downshelf_sequence(
    normalized_payload: Dict[str, Any],
    progress_hook: Optional[Callable[[int, int, Dict[str, Any]], None]] = None,
) -> Dict[str, Any]:
    product_ids: List[int] = normalized_payload["product_ids"]
    user_name: str = normalized_payload["user_name"]
    notify_url: Optional[str] = normalized_payload.get("notify_url")

    results: List[Dict[str, Any]] = []
    success_count = 0

    for product_id in product_ids:
        single_payload: Dict[str, Any] = {
            "product_id": product_id,
            "user_name": [user_name],
        }
        if notify_url:
            single_payload["notify_url"] = notify_url

        try:
            single_result = await execute_downshelf_action(single_payload, action_name=f"批量下架[{product_id}]")
            results.append(
                {
                    "product_id": product_id,
                    "success": True,
                    "message": single_result.get("message", "OK"),
                    "query_time": single_result.get("query_time"),
                    "data": single_result.get("data"),
                }
            )
            success_count += 1
        except ValueError as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )
        except HTTPException as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": e.detail,
                }
            )
        except Exception as e:
            logger.error(f"❌ 批量下架单条失败 product_id={product_id}: {e}", exc_info=True)
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )

        if progress_hook:
            progress_hook(success_count, len(results), results[-1])

    failed_count = len(results) - success_count
    return {
        "summary": {
            "total": len(results),
            "success": success_count,
            "failed": failed_count,
            "processed": len(results),
        },
        "results": results,
        "message": f"批量下架执行完成：成功 {success_count} 条，失败 {failed_count} 条",
    }


async def execute_batch_delete_sequence(
    normalized_payload: Dict[str, Any],
    progress_hook: Optional[Callable[[int, int, Dict[str, Any]], None]] = None,
) -> Dict[str, Any]:
    product_ids: List[int] = normalized_payload["product_ids"]
    user_name: str = normalized_payload["user_name"]
    notify_url: Optional[str] = normalized_payload.get("notify_url")

    results: List[Dict[str, Any]] = []
    success_count = 0

    for product_id in product_ids:
        single_payload: Dict[str, Any] = {
            "product_id": product_id,
            "user_name": [user_name],
        }
        if notify_url:
            single_payload["notify_url"] = notify_url

        try:
            single_result = await execute_delete_action(single_payload, action_name=f"批量删除[{product_id}]")
            results.append(
                {
                    "product_id": product_id,
                    "success": True,
                    "message": single_result.get("message", "OK"),
                    "query_time": single_result.get("query_time"),
                    "data": single_result.get("data"),
                }
            )
            success_count += 1
        except ValueError as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )
        except HTTPException as e:
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": e.detail,
                }
            )
        except Exception as e:
            logger.error(f"❌ 批量删除单条失败 product_id={product_id}: {e}", exc_info=True)
            results.append(
                {
                    "product_id": product_id,
                    "success": False,
                    "error": str(e),
                }
            )

        if progress_hook:
            progress_hook(success_count, len(results), results[-1])

    failed_count = len(results) - success_count
    return {
        "summary": {
            "total": len(results),
            "success": success_count,
            "failed": failed_count,
            "processed": len(results),
        },
        "results": results,
        "message": f"批量删除执行完成：成功 {success_count} 条，失败 {failed_count} 条",
    }


def remember_batch_publish_task(task: Dict[str, Any]) -> None:
    remember_task(task, batch_publish_tasks, batch_publish_task_order, BATCH_PUBLISH_TASK_KEEP)


def remember_batch_downshelf_task(task: Dict[str, Any]) -> None:
    remember_task(task, batch_downshelf_tasks, batch_downshelf_task_order, BATCH_DOWNSHELF_TASK_KEEP)


def remember_batch_delete_task(task: Dict[str, Any]) -> None:
    remember_task(task, batch_delete_tasks, batch_delete_task_order, BATCH_DELETE_TASK_KEEP)


async def run_batch_publish_task(task_id: str, normalized_payload: Dict[str, Any]) -> None:
    task = batch_publish_tasks.get(task_id)
    if not task:
        return

    task["status"] = "running"
    task["started_at"] = datetime.now().isoformat()
    task["message"] = "任务处理中：正在逐条提交上架"
    snapshot_and_persist_task(task)

    def on_progress(success_count: int, processed_count: int, latest_result: Dict[str, Any]) -> None:
        total = int(task.get("summary", {}).get("total") or 0)
        failed_count = max(processed_count - success_count, 0)
        task["summary"] = {
            "total": total,
            "success": success_count,
            "failed": failed_count,
            "processed": processed_count,
        }
        task["latest_result"] = latest_result
        task["message"] = f"任务处理中：已处理 {processed_count}/{total}"
        snapshot_and_persist_task(task)

    try:
        sequence_result = await execute_batch_publish_sequence(normalized_payload, progress_hook=on_progress)
        summary = sequence_result["summary"]
        task["status"] = "finished" if summary.get("failed", 0) == 0 else "partial_failed"
        task["summary"] = summary
        task["results"] = sequence_result["results"]
        task["message"] = sequence_result["message"]
    except Exception as e:
        logger.error(f"❌ 后台批量上架任务失败 task_id={task_id}: {e}", exc_info=True)
        task["status"] = "failed"
        task["message"] = f"任务执行失败：{str(e)}"
    finally:
        task["finished_at"] = datetime.now().isoformat()
        snapshot_and_persist_task(task)


async def run_batch_downshelf_task(task_id: str, normalized_payload: Dict[str, Any]) -> None:
    task = batch_downshelf_tasks.get(task_id)
    if not task:
        return

    task["status"] = "running"
    task["started_at"] = datetime.now().isoformat()
    task["message"] = "任务处理中：正在逐条提交下架"
    snapshot_and_persist_task(task)

    def on_progress(success_count: int, processed_count: int, latest_result: Dict[str, Any]) -> None:
        total = int(task.get("summary", {}).get("total") or 0)
        failed_count = max(processed_count - success_count, 0)
        task["summary"] = {
            "total": total,
            "success": success_count,
            "failed": failed_count,
            "processed": processed_count,
        }
        task["latest_result"] = latest_result
        task["message"] = f"任务处理中：已处理 {processed_count}/{total}"
        snapshot_and_persist_task(task)

    try:
        sequence_result = await execute_batch_downshelf_sequence(normalized_payload, progress_hook=on_progress)
        summary = sequence_result["summary"]
        task["status"] = "finished" if summary.get("failed", 0) == 0 else "partial_failed"
        task["summary"] = summary
        task["results"] = sequence_result["results"]
        task["message"] = sequence_result["message"]
    except Exception as e:
        logger.error(f"❌ 后台批量下架任务失败 task_id={task_id}: {e}", exc_info=True)
        task["status"] = "failed"
        task["message"] = f"任务执行失败：{str(e)}"
    finally:
        task["finished_at"] = datetime.now().isoformat()
        snapshot_and_persist_task(task)


async def run_batch_delete_task(task_id: str, normalized_payload: Dict[str, Any]) -> None:
    task = batch_delete_tasks.get(task_id)
    if not task:
        return

    task["status"] = "running"
    task["started_at"] = datetime.now().isoformat()
    task["message"] = "任务处理中：正在逐条提交删除"
    snapshot_and_persist_task(task)

    def on_progress(success_count: int, processed_count: int, latest_result: Dict[str, Any]) -> None:
        total = int(task.get("summary", {}).get("total") or 0)
        failed_count = max(processed_count - success_count, 0)
        task["summary"] = {
            "total": total,
            "success": success_count,
            "failed": failed_count,
            "processed": processed_count,
        }
        task["latest_result"] = latest_result
        task["message"] = f"任务处理中：已处理 {processed_count}/{total}"
        snapshot_and_persist_task(task)

    try:
        sequence_result = await execute_batch_delete_sequence(normalized_payload, progress_hook=on_progress)
        summary = sequence_result["summary"]
        task["status"] = "finished" if summary.get("failed", 0) == 0 else "partial_failed"
        task["summary"] = summary
        task["results"] = sequence_result["results"]
        task["message"] = sequence_result["message"]
    except Exception as e:
        logger.error(f"❌ 后台批量删除任务失败 task_id={task_id}: {e}", exc_info=True)
        task["status"] = "failed"
        task["message"] = f"任务执行失败：{str(e)}"
    finally:
        task["finished_at"] = datetime.now().isoformat()
        snapshot_and_persist_task(task)


@app.post("/api/products/publish/batch/task")
async def create_batch_publish_task(payload: Dict[str, Any]):
    """
    创建批量上架后台任务：立即返回 task_id，由后台逐条提交上架。
    """
    logger.info("🧵 创建批量上架后台任务")

    normalized_payload = normalize_batch_publish_payload(payload)

    task_id = f"bpt_{uuid.uuid4().hex[:12]}"
    total = len(normalized_payload["product_ids"])

    task = {
        "task_id": task_id,
        "task_type": "batch_publish",
        "operator_user_name": normalized_payload["user_name"],
        "product_ids": normalized_payload["product_ids"],
        "source": normalized_payload.get("source") or "products_page",
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "started_at": None,
        "finished_at": None,
        "summary": {
            "total": total,
            "success": 0,
            "failed": 0,
            "processed": 0,
        },
        "results": [],
        "message": "任务已创建，等待后台处理",
    }

    remember_batch_publish_task(task)
    snapshot_and_persist_task(task)
    asyncio.create_task(run_batch_publish_task(task_id, normalized_payload))

    return {
        "success": True,
        "task_id": task_id,
        "status": task["status"],
        "summary": task["summary"],
        "message": "批量上架任务已创建，系统正在后台逐个提交。可到“处理结果”查看任务进度。",
    }


@app.get("/api/products/publish/batch/task/{task_id}")
async def get_batch_publish_task(task_id: str):
    task = batch_publish_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    return {
        "success": True,
        **task,
    }


@app.post("/api/products/downshelf/batch/task")
async def create_batch_downshelf_task(payload: Dict[str, Any]):
    """
    创建批量下架后台任务：立即返回 task_id，由后台逐条提交下架。
    """
    logger.info("🧵 创建批量下架后台任务")

    normalized_payload = normalize_batch_downshelf_payload(payload)

    task_id = f"bdt_{uuid.uuid4().hex[:12]}"
    total = len(normalized_payload["product_ids"])

    task = {
        "task_id": task_id,
        "task_type": "batch_downshelf",
        "operator_user_name": normalized_payload["user_name"],
        "product_ids": normalized_payload["product_ids"],
        "source": normalized_payload.get("source") or "products_page",
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "started_at": None,
        "finished_at": None,
        "summary": {
            "total": total,
            "success": 0,
            "failed": 0,
            "processed": 0,
        },
        "results": [],
        "message": "任务已创建，等待后台处理",
    }

    remember_batch_downshelf_task(task)
    snapshot_and_persist_task(task)
    asyncio.create_task(run_batch_downshelf_task(task_id, normalized_payload))

    return {
        "success": True,
        "task_id": task_id,
        "status": task["status"],
        "summary": task["summary"],
        "message": "批量下架任务已创建，系统正在后台逐个提交。可到“处理结果”查看任务进度。",
    }


@app.get("/api/products/downshelf/batch/task/{task_id}")
async def get_batch_downshelf_task(task_id: str):
    task = batch_downshelf_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    return {
        "success": True,
        **task,
    }


@app.post("/api/products/delete/batch/task")
async def create_batch_delete_task(payload: Dict[str, Any]):
    """
    创建批量删除后台任务：立即返回 task_id，由后台逐条提交删除。
    """
    logger.info("🧵 创建批量删除后台任务")

    normalized_payload = normalize_batch_delete_payload(payload)

    task_id = f"bdel_{uuid.uuid4().hex[:12]}"
    total = len(normalized_payload["product_ids"])

    task = {
        "task_id": task_id,
        "task_type": "batch_delete",
        "operator_user_name": normalized_payload["user_name"],
        "product_ids": normalized_payload["product_ids"],
        "source": normalized_payload.get("source") or "products_page",
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "started_at": None,
        "finished_at": None,
        "summary": {
            "total": total,
            "success": 0,
            "failed": 0,
            "processed": 0,
        },
        "results": [],
        "message": "任务已创建，等待后台处理",
    }

    remember_batch_delete_task(task)
    snapshot_and_persist_task(task)
    asyncio.create_task(run_batch_delete_task(task_id, normalized_payload))

    return {
        "success": True,
        "task_id": task_id,
        "status": task["status"],
        "summary": task["summary"],
        "message": "批量删除任务已创建，系统正在后台逐个提交。可到“处理结果”查看任务进度。",
    }


@app.get("/api/products/delete/batch/task/{task_id}")
async def get_batch_delete_task(task_id: str):
    task = batch_delete_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    return {
        "success": True,
        **task,
    }


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
        result = await execute_publish_action(payload, action_name="上架商品")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        **result,
    }


@app.post("/api/products/downshelf")
async def downshelf_product(payload: Dict[str, Any]):
    """
    下架商品 - 结构化参数校验后调用上游接口
    POST https://open.goofish.pro/api/open/product/downShelf

    注：接口可能异步处理，建议结合“处理结果”页查看最终结果。
    """
    logger.info("📥 下架商品请求")

    try:
        result = await execute_downshelf_action(payload, action_name="下架商品")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        **result,
    }


@app.post("/api/products/delete")
async def delete_product(payload: Dict[str, Any]):
    """
    删除商品 - 结构化参数校验后调用上游接口
    POST https://open.goofish.pro/api/open/product/delete

    注：仅支持删除草稿箱/待发布商品，建议结合“处理结果”页查看最终结果。
    """
    logger.info("🗑️ 删除商品请求")

    try:
        result = await execute_delete_action(payload, action_name="删除商品")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "success": True,
        **result,
    }


@app.post("/api/products/publish/batch")
async def batch_publish_products(payload: Dict[str, Any]):
    """
    批量上架商品：按 product_id 顺序逐条调用现有 publish 逻辑。
    """
    logger.info("📚 批量上架请求")

    normalized_payload = normalize_batch_publish_payload(payload)
    sequence_result = await execute_batch_publish_sequence(normalized_payload)
    return {
        "success": True,
        **sequence_result,
    }


@app.post("/api/products/downshelf/batch")
async def batch_downshelf_products(payload: Dict[str, Any]):
    """
    批量下架商品：按 product_id 顺序逐条调用现有 downShelf 逻辑。
    """
    logger.info("📚 批量下架请求")

    normalized_payload = normalize_batch_downshelf_payload(payload)
    sequence_result = await execute_batch_downshelf_sequence(normalized_payload)
    return {
        "success": True,
        **sequence_result,
    }


@app.post("/api/products/delete/batch")
async def batch_delete_products(payload: Dict[str, Any]):
    """
    批量删除商品：按 product_id 顺序逐条调用现有 delete 逻辑。
    """
    logger.info("📚 批量删除请求")

    normalized_payload = normalize_batch_delete_payload(payload)
    sequence_result = await execute_batch_delete_sequence(normalized_payload)
    return {
        "success": True,
        **sequence_result,
    }


@app.get("/api/templates")
async def list_templates():
    templates = load_templates()
    templates.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
    return {
        "success": True,
        "data": templates,
        "count": len(templates),
    }


@app.post("/api/templates")
async def create_template(payload: Dict[str, Any]):
    name = payload.get("name")
    description = payload.get("description")
    source = payload.get("source") or "manual"
    template_data = payload.get("template_data")

    if not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=400, detail="name 为必填")
    if len(name.strip()) > 80:
        raise HTTPException(status_code=400, detail="name 长度不能超过 80")
    if description is not None and not isinstance(description, str):
        raise HTTPException(status_code=400, detail="description 必须是字符串")

    try:
        normalized_template_data = normalize_template_data(template_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.now().isoformat()
    template_record = {
        "template_id": f"tpl_{uuid.uuid4().hex[:12]}",
        "name": name.strip(),
        "description": (description or "").strip(),
        "source": str(source),
        "template_data": normalized_template_data,
        "created_at": now,
        "updated_at": now,
    }

    templates = load_templates()
    templates.append(template_record)
    save_templates(templates)

    return {
        "success": True,
        "data": template_record,
        "message": "模板创建成功",
    }


@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str):
    templates = load_templates()
    filtered_templates = [item for item in templates if item.get("template_id") != template_id]

    if len(filtered_templates) == len(templates):
        raise HTTPException(status_code=404, detail="模板不存在")

    save_templates(filtered_templates)
    return {
        "success": True,
        "message": "模板已删除",
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


@app.get("/api/products/task/records")
async def list_product_task_records(limit: int = Query(50, ge=1, le=200)):
    records = collect_local_task_records(limit)
    return {
        "success": True,
        "data": records,
        "count": len(records),
    }


@app.get("/api/products/callback/records")
async def list_product_callback_records(limit: int = Query(50, ge=1, le=200)):
    records = read_callback_records(limit)
    return {
        "success": True,
        "data": records,
        "count": len(records),
    }


def get_product_status_text(status: Any) -> str:
    """获取商品状态文本"""
    try:
        status_int = int(status)
    except (TypeError, ValueError):
        return str(status or "未知")
    return PRODUCT_STATUS_MAP.get(status_int, f"未知 ({status_int})")

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
