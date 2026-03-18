#!/bin/bash
# Goofish 闲鱼管理系统 - 启动脚本
# 支持端口范围 8000-8010

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
CONFIG_DIR="$PROJECT_DIR/config"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# 端口配置（支持 8000-8010）
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-8002}"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ 缺少依赖命令：$cmd"
    exit 1
  fi
}

validate_port() {
  local name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "❌ ${name} 非法：$value"
    exit 1
  fi
  if [ "$value" -lt 1 ] || [ "$value" -gt 65535 ]; then
    echo "❌ ${name} 超出范围：$value"
    exit 1
  fi
}

wait_http_ready() {
  local name="$1"
  local url="$2"
  local retries="$3"
  local interval="$4"

  for ((i = 1; i <= retries; i++)); do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      echo "   ✅ ${name} 健康检查通过 (${i}/${retries})"
      return 0
    fi
    sleep "$interval"
  done

  return 1
}

kill_pids_on_port() {
  local port="$1"
  local pids
  pids=$(ss -lntp 2>/dev/null | grep -E ":${port}[[:space:]]" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)
  if [ -z "$pids" ]; then
    return 0
  fi

  echo "   清理端口 ${port} 残留进程: $pids"
  kill $pids 2>/dev/null || true
  sleep 1

  local remain
  remain=$(ss -lntp 2>/dev/null | grep -E ":${port}[[:space:]]" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)
  if [ -n "$remain" ]; then
    echo "   强制清理端口 ${port} 残留进程: $remain"
    kill -9 $remain 2>/dev/null || true
  fi
}

require_cmd python3
require_cmd npm
require_cmd curl
require_cmd ss

validate_port "BACKEND_PORT" "$BACKEND_PORT"
validate_port "FRONTEND_PORT" "$FRONTEND_PORT"

echo "🐟 Goofish 闲鱼管理系统"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 创建目录
mkdir -p "$LOG_DIR" "$CONFIG_DIR"
echo "📁 项目目录：$PROJECT_DIR"
echo "📁 日志目录：$LOG_DIR"
echo "📁 配置目录：$CONFIG_DIR"
echo "🔌 后端端口：$BACKEND_PORT"
echo "🔌 前端端口：$FRONTEND_PORT"

# 停止旧进程
echo "🛑 检查旧进程..."
pkill -f "$PROJECT_DIR/backend/main.py" 2>/dev/null || true
pkill -f "vite.*(--port[= ]${FRONTEND_PORT})" 2>/dev/null || true

# 兜底：按端口清理残留监听进程
kill_pids_on_port "$BACKEND_PORT"
kill_pids_on_port "$FRONTEND_PORT"

# 启动后端
echo "📦 启动后端服务 (端口 $BACKEND_PORT)..."
nohup env PYTHONUNBUFFERED=1 BACKEND_PORT="$BACKEND_PORT" python3 "$PROJECT_DIR/backend/main.py" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"

if ! wait_http_ready "后端" "http://127.0.0.1:${BACKEND_PORT}/health" 20 1; then
  echo "   ❌ 后端启动失败，查看日志："
  tail -20 "$BACKEND_LOG" || true
  exit 1
fi

# 启动前端
echo "🎨 启动前端服务 (端口 $FRONTEND_PORT)..."
cd "$PROJECT_DIR/frontend"

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "   📦 检测到 node_modules 缺失，安装依赖..."
  if [ -f "package-lock.json" ]; then
    npm ci
  else
    npm install
  fi
fi

# 清理 Vite 预构建缓存，避免 Outdated Optimize Dep
rm -rf "$PROJECT_DIR/frontend/node_modules/.vite"

nohup env FRONTEND_PORT="$FRONTEND_PORT" npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" --strictPort --force > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

if ! wait_http_ready "前端" "http://127.0.0.1:${FRONTEND_PORT}/" 45 1; then
  echo "   ⚠️  前端未在预期时间内通过健康检查，请查看日志："
  tail -20 "$FRONTEND_LOG" || true
fi

# 最终状态
echo ""
echo "=== 服务状态 ==="
if curl -fsS --max-time 3 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
  echo "✅ 后端：http://localhost:${BACKEND_PORT} (PID: $BACKEND_PID)"
else
  echo "❌ 后端：启动失败"
fi

if curl -fsS --max-time 3 "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1; then
  echo "✅ 前端：http://localhost:${FRONTEND_PORT} (PID: $FRONTEND_PID)"
else
  echo "⚠️  前端：可能仍在启动，或端口冲突"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 访问地址：http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
echo ""
echo "📁 项目文件:"
echo "   配置文件：$CONFIG_DIR/app_config.json"
echo "   后端日志：$BACKEND_LOG"
echo "   前端日志：$FRONTEND_LOG"
echo ""
echo "📋 查看日志:"
echo "   tail -f $BACKEND_LOG"
echo "   tail -f $FRONTEND_LOG"
echo ""
echo "🛑 停止服务:"
echo "   pkill -f '$PROJECT_DIR/backend/main.py'"
echo "   pkill -f 'vite.*(--port[= ]$FRONTEND_PORT)'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
