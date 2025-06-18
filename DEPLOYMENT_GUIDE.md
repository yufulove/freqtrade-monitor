# 交易策略管理系统 v2.0 部署指南

## 概述

本指南详细说明了交易策略管理系统 v2.0 的生产环境部署流程，包括环境准备、安全配置、部署步骤和运维监控。

## 系统要求

### 硬件要求

#### 最低配置
- **CPU**: 4核心 2.0GHz
- **内存**: 8GB RAM
- **存储**: 100GB SSD
- **网络**: 100Mbps 带宽

#### 推荐配置
- **CPU**: 8核心 3.0GHz
- **内存**: 16GB RAM
- **存储**: 500GB NVMe SSD
- **网络**: 1Gbps 带宽

### 软件要求

- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Node.js**: 18.0+ (开发环境)
- **Python**: 3.9+ (开发环境)

## 环境准备

### 1. 系统更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git htop vim
```

### 2. Docker 安装

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 防火墙配置

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 内部服务端口（仅限内网访问）
sudo ufw allow from 10.0.0.0/8 to any port 3000
sudo ufw allow from 172.16.0.0/12 to any port 8000
sudo ufw allow from 192.168.0.0/16 to any port 5432
```

## 部署步骤

### 1. 代码部署

```bash
# 克隆代码仓库
git clone https://github.com/yufulove/freqtrade-monitor.git /opt/trading-system
cd /opt/trading-system

# 切换到生产分支
git checkout main

# 设置目录权限
sudo chown -R $USER:$USER /opt/trading-system
chmod +x scripts/*.sh
```

### 2. 环境配置

#### 后端环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件：

```bash
# 基本配置
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# 数据库配置
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=freqtrade_monitor
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}:${POSTGRES_PORT}/${POSTGRES_DB}

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your-redis-password

# 安全配置
FREQTRADE_WEBHOOK_SECRET=your-webhook-secret
API_ENCRYPTION_KEY=your-encryption-key

# 功能开关
FEATURE_ACTIVE_CONTROL=false
FEATURE_TWO_FACTOR_AUTH=true
```

#### 前端环境变量

```bash
# 复制环境变量模板
cp frontend/.env.example frontend/.env
```

编辑 `frontend/.env` 文件：

```bash
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws
```

### 3. SSL证书配置

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

#### 手动证书配置

```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 复制证书文件
sudo cp your-cert.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/

# 设置权限
sudo chmod 644 /etc/ssl/certs/your-cert.crt
sudo chmod 600 /etc/ssl/private/your-private.key
```

### 4. 数据库初始化

```bash
# 启动数据库服务
docker-compose up -d db redis

# 等待数据库启动
sleep 30

# 运行数据库迁移
cd backend
docker-compose exec backend alembic upgrade head

# 创建初始管理员用户
docker-compose exec backend python -m app.initial_data
```

### 5. 服务启动

```bash
# 构建并启动所有服务
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 安全配置

### 1. 网络安全

#### Nginx 安全配置

编辑 `nginx/conf.d/default.conf`：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # 限制请求大小
    client_max_body_size 10M;
    
    # 前端代理
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket代理
    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 数据库安全

```bash
# 创建专用数据库用户
docker-compose exec db psql -U postgres -c "CREATE USER app_user WITH PASSWORD 'secure_password';"
docker-compose exec db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE freqtrade_monitor TO app_user;"

# 更新数据库连接配置
# 在 backend/.env 中更新 POSTGRES_USER 和 POSTGRES_PASSWORD
```

### 3. 备份策略

#### 数据库备份

```bash
# 创建备份脚本
cat > /opt/trading-system/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker-compose exec -T db pg_dump -U postgres freqtrade_monitor > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
EOF

# 设置执行权限
chmod +x /opt/trading-system/scripts/backup.sh

# 添加到定时任务
echo "0 2 * * * /opt/trading-system/scripts/backup.sh" | crontab -
```

## 监控配置

### 1. Prometheus 配置

编辑 `observability/prometheus/prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### 2. Grafana 仪表盘

```bash
# 导入预配置的仪表盘
cp observability/grafana/dashboards/* /var/lib/grafana/dashboards/

# 重启Grafana服务
docker-compose restart grafana
```

### 3. 告警配置

创建 `observability/prometheus/alert_rules.yml`：

```yaml
groups:
  - name: trading_system_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
          
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database is not responding"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"
```

## 运维操作

### 1. 服务管理

```bash
# 查看服务状态
docker-compose ps

# 重启特定服务
docker-compose restart backend

# 查看服务日志
docker-compose logs -f backend

# 更新服务
git pull origin main
docker-compose build
docker-compose up -d
```

### 2. 数据库维护

```bash
# 数据库备份
./scripts/backup.sh

# 数据库恢复
gunzip -c /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T db psql -U postgres freqtrade_monitor

# 数据库迁移
docker-compose exec backend alembic upgrade head
```

### 3. 性能优化

```bash
# 清理Docker镜像
docker system prune -a

# 优化数据库
docker-compose exec db psql -U postgres -d freqtrade_monitor -c "VACUUM ANALYZE;"

# 清理Redis缓存
docker-compose exec redis redis-cli FLUSHDB
```

## 故障排除

### 1. 常见问题

#### 服务无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep :8000

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

#### 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec db pg_isready -U postgres

# 检查网络连接
docker-compose exec backend ping db
```

#### 前端无法访问
```bash
# 检查Nginx配置
nginx -t

# 检查SSL证书
openssl x509 -in /etc/ssl/certs/your-cert.crt -text -noout
```

### 2. 日志分析

```bash
# 查看系统日志
sudo journalctl -u docker

# 查看应用日志
docker-compose logs --tail=100 backend

# 查看Nginx访问日志
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

## 安全检查清单

- [ ] 更改所有默认密码
- [ ] 启用SSL/TLS加密
- [ ] 配置防火墙规则
- [ ] 设置定期备份
- [ ] 启用监控告警
- [ ] 更新系统补丁
- [ ] 配置日志轮转
- [ ] 限制管理员访问
- [ ] 启用2FA认证
- [ ] 定期安全审计

## 技术支持

如需技术支持，请联系：
- GitHub Issues: https://github.com/yufulove/freqtrade-monitor/issues
- 文档: 查看项目文档
- 社区: 参与技术讨论

---

**重要提醒**: 生产环境部署前请务必进行充分测试，确保所有安全措施已正确配置。