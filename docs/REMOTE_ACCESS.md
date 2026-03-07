# 🌐 Goofish 远程访问指南

## 📋 当前配置

| 服务 | 端口 | 监听地址 | 状态 |
|------|------|---------|------|
| 后端 API | 8001 | `0.0.0.0` (所有网卡) | ✅ |
| 前端页面 | 8002 | `0.0.0.0` (所有网卡) | ✅ |

---

## 🔗 访问地址

### 本机访问
```
http://localhost:8002
http://127.0.0.1:8002
```

### 局域网远程访问
```
http://192.168.100.6:8002
```

**当前服务器 IP:** `192.168.100.6`

---

## 🔧 远程访问配置

### 1. 前端配置 (vite.config.js)

```javascript
export default defineConfig({
  server: {
    port: 8002,
    host: '0.0.0.0',  // ✅ 允许远程访问
    strictPort: false
  }
})
```

### 2. 后端配置 (main.py)

```python
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)  # ✅ 监听所有网卡
```

### 3. 防火墙配置

**如果启用了防火墙，需要开放端口：**

#### Ubuntu/Debian (UFW)
```bash
sudo ufw allow 8001/tcp
sudo ufw allow 8002/tcp
sudo ufw reload
```

#### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --permanent --add-port=8002/tcp
sudo firewall-cmd --reload
```

---

## 🧪 测试远程访问

### 在其他电脑上测试

**从另一台电脑访问：**
```bash
# 测试后端
curl http://192.168.100.6:8001/health

# 测试前端
curl http://192.168.100.6:8002/

# 或使用浏览器访问
# http://192.168.100.6:8002
```

### 预期结果

```json
// 后端健康检查
{
  "status": "ok",
  "service": "goofish-backend",
  "timestamp": "2026-03-07T15:21:44.018201"
}
```

---

## 🛑 常见问题排查

### 问题 1: 远程无法访问

**检查服务是否运行：**
```bash
# 检查后端
ps aux | grep "main.py" | grep -v grep
netstat -tlnp | grep 8001

# 检查前端
ps aux | grep "vite" | grep -v grep
netstat -tlnp | grep 8002
```

**检查监听地址：**
```bash
# 应该显示 0.0.0.0:8001 和 0.0.0.0:8002
netstat -tlnp | grep -E "8001|8002"
```

如果显示 `127.0.0.1:8002`，说明只监听本地，需要修改配置。

### 问题 2: 防火墙阻止

**检查防火墙状态：**
```bash
# Ubuntu/Debian
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --list-all
```

**临时关闭防火墙测试（不推荐生产环境）：**
```bash
# Ubuntu/Debian
sudo ufw disable

# CentOS/RHEL
sudo systemctl stop firewalld
```

### 问题 3: 路由器/交换机 ACL

如果以上都正常但仍无法访问，可能是网络设备有访问控制：

1. 检查路由器 ACL 规则
2. 检查交换机端口隔离
3. 确认 IP 地址在同一网段

---

## 📱 移动端访问

在手机上也可以访问：
```
http://192.168.100.6:8002
```

确保手机和服务器在同一 WiFi 网络下。

---

## 🔐 安全建议

### 1. 限制访问 IP（可选）

如果只允许特定 IP 访问，可以在防火墙中配置：

```bash
# 只允许特定 IP 访问
sudo ufw allow from 192.168.100.100 to any port 8001,8002
sudo ufw deny 8001,8002
```

### 2. 使用 HTTPS（推荐生产环境）

通过 Nginx 反向代理配置 HTTPS：

```nginx
server {
    listen 443 ssl;
    server_name goofish.local;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8002;
    }
    
    location /api/ {
        proxy_pass http://localhost:8001;
    }
}
```

### 3. 添加认证（后续版本）

目前系统无认证机制，建议在内网使用。如需外网访问，建议添加：
- Basic Auth
- JWT Token 认证
- OAuth2 登录

---

## 📊 网络信息

**查看服务器 IP 地址：**
```bash
# 所有 IP 地址
hostname -I

# 或
ip addr show | grep inet
```

**查看网络连接：**
```bash
# 查看谁在访问
netstat -anp | grep -E "8001|8002" | grep ESTABLISHED
```

---

**更新时间:** 2026-03-07 15:22  
**服务器 IP:** 192.168.100.6  
**访问端口:** 8001 (API), 8002 (Web)
