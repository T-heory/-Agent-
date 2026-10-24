# 辰光Agent

FastAPI + Vue 3 的 AI Agent 应用平台。已完成 RBAC 管理后台后端（用户 / 角色 / 权限 + 图形验证码 + JWT 登录）与前端管理后台（登录 / 工作台 / 用户 / 角色 / 权限 / 个人中心，`app/` 目录），RAG / Agent 能力尚未开始。

## 文档导航

| 文档 | 内容 |
|---|---|
| [docs/项目说明书.md](docs/项目说明书.md) | **先读这个**：架构、分层约定、数据库、接口契约、已知缺陷（含文件:行号）、扩展指南、修改红线 |
| [docs/前端需求文档.md](docs/前端需求文档.md) | 前端页面级需求、接口契约、缺陷清单、里程碑 |
| [docs/openapi.json](docs/openapi.json) | OpenAPI 快照（2026-10-24） |

## 快速开始

```bash
# 后端（在仓库根目录执行，.env 是相对路径）
cd docker && docker compose up -d && cd ..
.venv/Scripts/activate
pip install -r requirements.txt      # 注意：当前缺 bcrypt / captcha / pillow / asyncmy / email-validator
alembic upgrade head
uvicorn src.main:app --reload --port 8000
# http://127.0.0.1:8000/health  ·  http://127.0.0.1:8000/docs

# 前端
cd app
npm install
npm run dev        # http://127.0.0.1:5173，/api 已代理到 127.0.0.1:8000
npm run build      # 生产构建（vue-tsc 类型检查 + vite build）
```

首次运行需手工插入管理员账号，见说明书 7.4 节。

## 三条硬约定

1. 统一响应体 `{code, message, data}`；**业务错误也返回 HTTP 200**，判成功只能看 `code === 200`。
2. 分层：`api → service → repository → model`，api 不写 SQL，repository 不写业务判断。
3. 新增模块后必须在 `src/main.py` 的 `ROUTES` 注册，在 `alembic/env.py` 补 model import。
