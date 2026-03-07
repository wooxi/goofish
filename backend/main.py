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

LOG_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

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
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import httpx
import time
import hashlib
import json
import uvicorn

# ── FastAPI 应用 ──
app = FastAPI(title="Goofish 闲鱼管理 API", version="1.0.0")

logger.info("=" * 60)
logger.info("🐟 Goofish Backend 启动中...")
logger.info(f"📂 项目根目录：{PROJECT_ROOT}")
logger.info(f"📝 日志文件：{LOG_FILE}")
logger.info(f"📄 配置文件：{CONFIG_FILE}")
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
            json.dump(config.model_dump(), f, indent=2, ensure_ascii=False)
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

# ── 全局异常处理 ──
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ 未捕获的异常：{exc}", exc_info=True)
    raise HTTPException(status_code=500, detail=f"服务器内部错误：{str(exc)}")

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
    appsecret: str = Field(..., min_length=1)
    seller_id: Optional[int] = Field(default=None)

@app.post("/api/config")
async def save_config(req: ConfigUpdateRequest):
    global config
    logger.info(f"💾 保存配置请求 - appid={req.appid}")
    try:
        config = AppConfig(appid=req.appid, appsecret=req.appsecret, seller_id=req.seller_id)
        success = save_config_to_file(config)
        if success:
            logger.info(f"✅ 配置保存成功 - appid={config.appid}")
            return {"success": True, "message": "配置已保存", "appid": config.appid, "seller_id": config.seller_id, "config_path": str(CONFIG_FILE)}
        else:
            logger.warning("⚠️ 配置已更新到内存，但文件保存失败")
            return {"success": True, "message": "配置已保存（内存）", "warning": "文件保存失败"}
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
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
