# Freqtrade UI - 专业级交易监控与管理平台

一个基于现代技术栈构建的专业级 Freqtrade 监控与管理平台，融合苹果设计语言，提供安全、高效的交易策略管理与执行环境。

## 🎯 项目概述

本项目在 Freqtrade UI v1.0 监控版基础上，增加了可选的、安全隔离的主动交易控制功能，旨在成为一个完整的策略管理与执行指挥中心。

### 核心特性

- 🔐 **企业级安全**: 多层权限控制、双因素认证、审计日志
- 🎨 **现代化界面**: 融合苹果设计语言的直观用户体验
- ⚡ **高性能架构**: 异步处理、智能缓存、实时监控
- 🛡️ **风险管控**: 细粒度权限、交易限制、实时风控
- 📊 **全面监控**: 性能指标、系统健康、业务监控
- 🔧 **灵活配置**: 环境隔离、功能开关、动态配置

## 🏗️ 架构设计

### 技术栈

**后端**
- FastAPI + Python 3.9+
- PostgreSQL + Redis
- SQLAlchemy ORM
- Pydantic 数据验证
- JWT 认证

**前端**
- React 18 + TypeScript
- Tailwind CSS
- Zustand 状态管理
- React Query 数据获取
- Framer Motion 动画

**基础设施**
- Docker 容器化
- Nginx 反向代理
- Prometheus + Grafana 监控
- ELK 日志分析

### 架构原则

1. **安全第一**: 所有操作都经过严格的权限验证和审计
2. **配置驱动**: 通过配置文件和环境变量灵活控制功能
3. **实时为核心**: 提供实时数据更新和即时反馈
4. **体验至上**: 注重用户体验和界面美观度

## 📁 项目结构

```
WEB-UI/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/               # 核心配置
│   │   ├── domain/             # 领域模型 (DDD)
│   │   │   ├── entities/       # 实体
│   │   │   └── services/       # 领域服务
│   │   ├── infrastructure/     # 基础设施
│   │   ├── models/             # 数据模型
│   │   ├── schemas/            # API 模式
│   │   └── services/           # 应用服务
│   ├── tests/                  # 测试
│   │   ├── contract/           # 契约测试
│   │   └── security/           # 安全测试
│   ├── alembic/                # 数据库迁移
│   └── requirements.txt        # 依赖管理
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/         # 组件
│   │   ├── pages/              # 页面
│   │   ├── services/           # 服务
│   │   ├── stores/             # 状态管理
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 工具函数
│   ├── public/                 # 静态资源
│   └── package.json            # 依赖管理
├── config/                     # 配置文件
│   ├── development.yaml        # 开发环境
│   ├── testing.yaml            # 测试环境
│   └── production.yaml         # 生产环境
├── docker/                     # Docker 配置
├── docs/                       # 文档
└── scripts/                    # 脚本
```

## 🚀 快速开始

### 环境要求

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (可选)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yufulove/freqtrade-monitor.git
cd freqtrade-monitor
```

2. **后端设置**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **数据库设置**
```bash
# 创建数据库
createdb freqtrade_ui_dev

# 运行迁移
alembic upgrade head
```

4. **前端设置**
```bash
cd frontend
npm install
```

5. **启动服务**
```bash
# 后端 (终端1)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端 (终端2)
cd frontend
npm start
```

### Docker 部署

```bash
# 开发环境
docker-compose up -d
```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```bash
# 基本配置
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key

# 数据库
DATABASE_HOST=localhost
DATABASE_NAME=freqtrade_ui_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PASSWORD=

# 功能开关
FEATURE_TRADING_ENABLED=false
FEATURE_TWO_FACTOR_AUTH=false
```

## 🔐 权限系统

### 权限级别

1. **ADMIN**: 系统管理员，拥有所有权限
2. **TRADER**: 交易员，可执行交易操作
3. **VIEWER**: 观察者，只能查看数据
4. **READONLY**: 只读用户，最小权限

### 权限控制

- **操作权限**: 控制用户可执行的具体操作
- **交易限制**: 限制交易金额、频率、交易对
- **速率限制**: 控制API请求频率

## 📊 监控与告警

### 系统监控

- **Prometheus**: 指标收集
- **Grafana**: 可视化仪表盘
- **AlertManager**: 告警管理

### 业务监控

- **交易监控**: 实时交易状态、盈亏统计
- **策略监控**: 策略性能、风险指标
- **系统监控**: 服务健康、资源使用

## 🛡️ 安全措施

### 认证与授权

- **JWT Token**: 无状态认证
- **双因素认证**: TOTP 支持
- **权限控制**: 基于角色的访问控制

### 数据安全

- **数据加密**: 敏感数据加密存储
- **传输安全**: HTTPS/TLS 1.3
- **审计日志**: 完整的操作记录

### 网络安全

- **防火墙**: 端口访问控制
- **WAF**: Web 应用防火墙
- **DDoS 防护**: 流量限制和过滤

## 🔄 CI/CD 流程

### 开发流程

1. **功能开发**: 在 feature 分支开发
2. **代码审查**: Pull Request 审查
3. **自动测试**: 单元测试、集成测试
4. **部署测试**: 测试环境验证
5. **生产部署**: 生产环境发布

### 自动化部署

- **GitHub Actions**: CI/CD 流水线
- **Docker**: 容器化部署
- **Kubernetes**: 容器编排（可选）

## 📝 API 文档

### 接口规范

- **RESTful API**: 标准 REST 接口
- **OpenAPI 3.0**: 接口文档规范
- **Swagger UI**: 在线接口文档

### 认证方式

```bash
# Bearer Token 认证
Authorization: Bearer <jwt_token>

# API Key 认证（部分接口）
X-API-Key: <api_key>
```

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 查看防火墙设置

2. **Redis 连接失败**
   - 检查 Redis 服务状态
   - 验证连接配置
   - 检查网络连通性

3. **前端无法访问后端**
   - 检查 CORS 配置
   - 验证 API 地址
   - 查看网络代理设置

### 日志查看

```bash
# 查看容器日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看系统日志
sudo journalctl -u docker
sudo journalctl -f
```

## 📞 技术支持

如有技术问题，请通过以下方式联系：

- **GitHub Issues**: 提交 Bug 报告或功能请求
- **文档**: 查看详细技术文档
- **社区**: 参与技术讨论

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**注意**: 本系统涉及金融交易，请在充分了解风险的前提下使用，开发团队不承担任何交易损失责任。