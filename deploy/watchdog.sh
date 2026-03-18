#!/usr/bin/env bash
# Goofish 服务自动守护脚本

set -uo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${DEPLOY_DIR}/.." && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"
WATCHDOG_LOG="${LOG_DIR}/watchdog.log"
LOCK_FILE="${PROJECT_DIR}/.watchdog.lock"

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$file"
    set +a
  fi
}

load_env_file "${PROJECT_DIR}/.env"
load_env_file "${PROJECT_DIR}/backend/.env"
load_env_file "${PROJECT_DIR}/frontend/.env"

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-${VITE_DEV_SERVER_PORT:-8002}}"
CHECK_INTERVAL="${CHECK_INTERVAL:-10}"
HEALTH_RETRY="${HEALTH_RETRY:-2}"
RESTART_COOLDOWN="${RESTART_COOLDOWN:-3}"

mkdir -p "$LOG_DIR"

log_msg() {
  local line
  line="$(date '+%Y-%m-%d %H:%M:%S') $*"
  echo "$line" | tee -a "$WATCHDOG_LOG" >/dev/null
}

kill_pids_on_port() {
  local port="$1"
  local pids
  pids=$(ss -lntp 2>/dev/null | grep -E ":${port}[[:space:]]" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)
  if [ -z "$pids" ]; then
    return 0
  fi

  kill $pids 2>/dev/null || true
  sleep 1

  local remain
  remain=$(ss -lntp 2>/dev/null | grep -E ":${port}[[:space:]]" | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u || true)
  if [ -n "$remain" ]; then
    kill -9 $remain 2>/dev/null || true
  fi
}

backend_ok() {
  curl -fsS --max-time 3 "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1
}

frontend_ok() {
  curl -fsS --max-time 3 "http://127.0.0.1:${FRONTEND_PORT}/" >/dev/null 2>&1
}

check_with_retry() {
  local fn_name="$1"
  local retry_times="$2"
  local sleep_seconds="$3"

  for ((i = 1; i <= retry_times; i++)); do
    if "$fn_name"; then
      return 0
    fi
    sleep "$sleep_seconds"
  done
  return 1
}

restart_backend() {
  log_msg "❌ 后端健康检查失败，尝试重启..."
  pkill -f "$PROJECT_DIR/backend/main.py" 2>/dev/null || true
  kill_pids_on_port "$BACKEND_PORT"

  nohup env PYTHONUNBUFFERED=1 BACKEND_PORT="$BACKEND_PORT" python3 "$PROJECT_DIR/backend/main.py" >> "$BACKEND_LOG" 2>&1 &

  if check_with_retry backend_ok 8 1; then
    log_msg "✅ 后端服务已恢复"
  else
    log_msg "❌ 后端重启后仍异常"
  fi
}

restart_frontend() {
  log_msg "❌ 前端健康检查失败，尝试重启..."
  pkill -f "vite.*(--port[= ]${FRONTEND_PORT})" 2>/dev/null || true
  kill_pids_on_port "$FRONTEND_PORT"

  if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    log_msg "⚠️ 前端 node_modules 缺失，执行依赖安装"
    if [ -f "$PROJECT_DIR/frontend/package-lock.json" ]; then
      (cd "$PROJECT_DIR/frontend" && npm ci >> "$FRONTEND_LOG" 2>&1)
    else
      (cd "$PROJECT_DIR/frontend" && npm install >> "$FRONTEND_LOG" 2>&1)
    fi
  fi

  (
    cd "$PROJECT_DIR/frontend"
    rm -rf "$PROJECT_DIR/frontend/node_modules/.vite"
    nohup env FRONTEND_PORT="$FRONTEND_PORT" VITE_DEV_SERVER_PORT="$FRONTEND_PORT" npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" --strictPort --force >> "$FRONTEND_LOG" 2>&1 &
  )

  if check_with_retry frontend_ok 10 1; then
    log_msg "✅ 前端服务已恢复"
  else
    log_msg "❌ 前端重启后仍异常"
  fi
}

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "⚠️  已有 watchdog 在运行，退出本次启动" >&2
    exit 1
  fi
else
  echo "⚠️  未检测到 flock，无法避免重复 watchdog 实例" >&2
fi

log_msg "🛡️ Goofish 服务守护进程启动"
log_msg "   项目目录：$PROJECT_DIR"
log_msg "   检查间隔：${CHECK_INTERVAL} 秒"
log_msg "   后端端口：$BACKEND_PORT"
log_msg "   前端端口：$FRONTEND_PORT"

while true; do
  if ! check_with_retry backend_ok "$HEALTH_RETRY" 1; then
    restart_backend
    sleep "$RESTART_COOLDOWN"
  fi

  if ! check_with_retry frontend_ok "$HEALTH_RETRY" 1; then
    restart_frontend
    sleep "$RESTART_COOLDOWN"
  fi

  sleep "$CHECK_INTERVAL"
done
