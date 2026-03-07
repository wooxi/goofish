#!/bin/bash
# Goofish 闲鱼管理系统 - 启动脚本
# 更新：日志和配置都放在项目目录下

set -e

PROJECT_DIR="/openclaw-data/goofish"
LOG_DIR="$PROJECT_DIR/logs"
CONFIG_DIR="$PROJECT_DIR/config"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

echo "🐟 Goofish 闲鱼管理系统"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 创建目录
mkdir -p "$LOG_DIR" "$CONFIG_DIR"
echo "📁 项目目录：$PROJECT_DIR"
echo "📁 日志目录：$LOG_DIR"
echo "📁 配置目录：$CONFIG_DIR"

# 停止旧进程
echo "🛑 检查旧进程..."
pkill -f "goofish/backend/main.py" 2>/dev/null || true
pkill -f "vite.*8002" 2>/dev/null || true
sleep 1

# 启动后端
echo "📦 启动后端服务 (端口 8001)..."
cd "$PROJECT_DIR/backend"
nohup python3 main.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID"
sleep 3

# 检查后端
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "   ✅ 后端启动成功"
else
    echo "   ❌ 后端启动失败，查看日志："
    tail -20 "$BACKEND_LOG"
    exit 1
fi

# 启动前端
echo "🎨 启动前端服务 (端口 8002)..."
cd "$PROJECT_DIR/frontend"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "   📦 首次运行，安装依赖..."
    npm install
fi

nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"
sleep 5

# 检查前端
if curl -s http://localhost:8002/ > /dev/null 2>&1; then
    echo "   ✅ 前端启动成功"
else
    echo "   ⚠️  前端可能还在启动中，稍后检查..."
    sleep 3
fi

# 最终状态
echo ""
echo "=== 服务状态 ==="
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ 后端：http://localhost:8001 (PID: $BACKEND_PID)"
else
    echo "❌ 后端：启动失败"
fi

if curl -s http://localhost:8002/ > /dev/null; then
    echo "✅ 前端：http://localhost:8002 (PID: $FRONTEND_PID)"
else
    echo "⚠️  前端：可能还在启动中"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 访问地址：http://$(hostname -I | awk '{print $1}'):8002"
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
echo "   pkill -f 'goofish/backend/main.py'"
echo "   pkill -f 'vite.*8002'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
