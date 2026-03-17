#!/bin/bash
# Goofish 服务自动守护脚本
# 每 10 秒检查一次，服务挂掉自动重启

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-8002}"
CHECK_INTERVAL="${CHECK_INTERVAL:-10}"

mkdir -p "$LOG_DIR"

echo "🛡️  Goofish 服务守护进程启动"
echo "   项目目录：$PROJECT_DIR"
echo "   检查间隔：${CHECK_INTERVAL} 秒"
echo "   后端端口：$BACKEND_PORT"
echo "   前端端口：$FRONTEND_PORT"
echo ""

backend_ok() {
  curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" > /dev/null 2>&1
}

frontend_ok() {
  curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/" > /dev/null 2>&1
}

while true; do
  # 检查后端
  if ! backend_ok; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 后端健康检查失败，尝试重启..." >> "$BACKEND_LOG"
    pkill -f "$PROJECT_DIR/backend/main.py" 2>/dev/null || true
    BACKEND_PORT="$BACKEND_PORT" nohup python3 "$PROJECT_DIR/backend/main.py" >> "$BACKEND_LOG" 2>&1 &
    sleep 2
    if backend_ok; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ 后端服务已恢复" >> "$BACKEND_LOG"
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 后端重启后仍异常" >> "$BACKEND_LOG"
    fi
  fi

  # 检查前端
  if ! frontend_ok; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 前端健康检查失败，尝试重启..." >> "$FRONTEND_LOG"
    pkill -f "vite.*--port ${FRONTEND_PORT}" 2>/dev/null || true
    (cd "$PROJECT_DIR/frontend" && FRONTEND_PORT="$FRONTEND_PORT" nohup npm run dev >> "$FRONTEND_LOG" 2>&1 &)
    sleep 3
    if frontend_ok; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ 前端服务已恢复" >> "$FRONTEND_LOG"
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ 前端重启后仍异常" >> "$FRONTEND_LOG"
    fi
  fi

  sleep "$CHECK_INTERVAL"
done
