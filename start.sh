#!/bin/bash
# Goofish 闲鱼管理系统 - 启动脚本
# 支持端口范围 8000-8010

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
CONFIG_DIR="$PROJECT_DIR/config"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# 端口配置（支持 8000-8010）
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-8002}"

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
pkill -f "vite.*--port $FRONTEND_PORT" 2>/dev/null || true

# 兜底：按端口清理残留监听进程
for PORT in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  PIDS=$(ss -lntp 2>/dev/null | grep ":$PORT " | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
  if [ -n "$PIDS" ]; then
    echo "   清理端口 $PORT 残留进程: $PIDS"
    kill $PIDS 2>/dev/null || true
  fi
done
sleep 1

# 启动后端
echo "📦 启动后端服务 (端口 $BACKEND_PORT)..."
export BACKEND_PORT
nohup python3 "$PROJECT_DIR/backend/main.py" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"
sleep 3

# 检查后端
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo "   ✅ 后端启动成功"
else
    echo "   ❌ 后端启动失败，查看日志："
    tail -20 "$BACKEND_LOG"
    exit 1
fi

# 启动前端
echo "🎨 启动前端服务 (端口 $FRONTEND_PORT)..."
cd "$PROJECT_DIR/frontend"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "   📦 首次运行，安装依赖..."
    npm install
fi

export FRONTEND_PORT
nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"
sleep 5

# 检查前端
if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
    echo "   ✅ 前端启动成功"
else
    echo "   ⚠️  前端可能还在启动中，稍后检查..."
    sleep 3
fi

# 最终状态
echo ""
echo "=== 服务状态 ==="
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    echo "✅ 后端：http://localhost:$BACKEND_PORT (PID: $BACKEND_PID)"
else
    echo "❌ 后端：启动失败"
fi

if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null; then
    echo "✅ 前端：http://localhost:$FRONTEND_PORT (PID: $FRONTEND_PID)"
else
    echo "⚠️  前端：可能还在启动中"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 访问地址：http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT"
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
echo "   pkill -f 'vite.*--port $FRONTEND_PORT'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
