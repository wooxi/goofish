#!/bin/bash
# Goofish 服务自动守护脚本
# 每 10 秒检查一次，服务挂掉自动重启

LOG_DIR="/openclaw-data/goofish/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

echo "🛡️  Goofish 服务守护进程启动"
echo "   检查间隔：10 秒"
echo "   日志目录：$LOG_DIR"
echo ""

while true; do
    # 检查后端
    if ! pgrep -f "goofish/backend/main.py" > /dev/null; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 后端服务已停止，重启中..." >> "$BACKEND_LOG"
        cd /openclaw-data/goofish/backend && nohup python3 main.py >> "$BACKEND_LOG" 2>&1 &
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ 后端服务已重启" >> "$BACKEND_LOG"
    fi
    
    # 检查前端
    if ! pgrep -f "vite.*8002" > /dev/null; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 前端服务已停止，重启中..." >> "$FRONTEND_LOG"
        cd /openclaw-data/goofish/frontend && nohup npm run dev >> "$FRONTEND_LOG" 2>&1 &
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ 前端服务已重启" >> "$FRONTEND_LOG"
    fi
    
    sleep 10
done
