# Vercel 部署保护规则

本项目部署在 Vercel 上，前后端一体化部署。所有代码修改必须遵守以下规则，确保 Vercel 部署不受影响：

## 1. 后端代码（backend/）

### 1.1 数据库连接
- **Vercel 环境必须使用 NullPool**：`os.environ.get("VERCEL") == "1"` 时使用 `NullPool`，不传 `pool_pre_ping`、`pool_recycle`、`pool_timeout` 等连接池参数
- **本地环境使用连接池**：`pool_pre_ping=True`、`pool_recycle=300`、`pool_size=5`、`max_overflow=10`
- **connect_args 只用 `ssl: require`**：不要添加 `command_timeout` 等 asyncpg 特有参数，可能不兼容
- **get_db 使用简单的 async with + yield**：不要在 yield 外加 try/except/finally，避免与上下文管理器冲突导致双重 close

### 1.2 入口文件（api/index.py）
- 必须通过 `sys.path.insert(0, backend_dir)` 将 backend/ 加入 Python 路径
- 只导出 `from main import app`

### 1.3 依赖（requirements.txt）
- 所有后端 import 的第三方包必须在根目录 `requirements.txt` 中声明
- 新增依赖时必须同步更新 requirements.txt

### 1.4 环境变量
- 后端所有必需的环境变量（database_url、jwt_secret_key 等）必须在 Vercel 项目设置中配置
- 不要在代码中硬编码任何密钥或连接字符串

### 1.5 lifespan 管理
- `dispose_engine()` 调用必须包裹在 `try/except` 中，Vercel Serverless 函数销毁时可能无法正常执行清理

## 2. Vercel 配置（vercel.json）

- `functions` 配置：`api/index.py` 的 `includeFiles` 必须为字符串 `"backend/**/*.py"`（不是数组）
- `rewrites` 配置：`/api/:path*` → `/api/index`，`/(.*)` → `/index.html`
- **不要添加 `builds` 配置**：会导致 Vercel 忽略 Project Settings 中的构建配置
- **不要在 functions 中指定 `runtime`**：让 Vercel 自动识别 Python 运行时

## 3. 前端代码（src/）

- API 基础路径使用 `import.meta.env.VITE_API_BASE_URL`，不要硬编码 `localhost:8000`
- 生产环境 `VITE_API_BASE_URL` 应为空或相对路径 `/api`，由 vercel.json rewrites 转发

## 4. 修改前必查清单

每次修改后端代码时，必须检查：
- [ ] 新增的 import 是否在 requirements.txt 中有对应依赖？
- [ ] 数据库相关代码是否区分了 Vercel/本地环境？
- [ ] 是否引入了 Vercel Serverless 不支持的特性（如文件系统写入、长连接、后台任务）？
- [ ] api/index.py 的导入路径是否仍然正确？
- [ ] vercel.json 配置是否被意外修改？
