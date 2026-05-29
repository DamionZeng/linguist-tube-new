# LinguistTube 后端接口 PRD（产品需求文档）

> **文档版本**: v1.0
> **创建日期**: 2026-05-30
> **技术栈**: Python 3.7+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Neon PostgreSQL
> **编码规范**: 严格遵循 `backend/AGENT.md`

---

## 目录

1. [项目背景与目标](#1-项目背景与目标)
2. [技术架构](#2-技术架构)
3. [数据库设计](#3-数据库设计)
4. [接口规范（API Specification）](#4-接口规范api-specification)
5. [开发阶段划分](#5-开发阶段划分)
6. [目录结构](#6-目录结构)

---

## 1. 项目背景与目标

### 1.1 项目简介
LinguistTube 是一个基于 YouTube 视频的英语学习平台，前端已使用 React + TypeScript 完成开发，目前所有数据来源于前端 Mock 数据及 localStorage。本次后端开发的目标是实现从 Mock 到真实后端的无缝切换。

### 1.2 核心约束（红色铁律）
1. **零前端结构改动**：不修改任何页面、组件、路由文件
2. **极简前端 API 修改**：仅替换 `src/api/` 目录内文件的内部实现（`setTimeout + resolve(MOCK_DATA)` → `fetch/axios` 真实请求），不改函数名、不改入参、不改文件名
3. **严格后端接口限制**：100% 基于前端既有接口定义实现，不自行设计额外接口

### 1.3 前端 API 清单汇总
| 模块 | 函数名 | 文件 | 当前实现 | 目标 |
|------|--------|------|----------|------|
| Auth | `loginApi(username, password)` | `src/api/auth.ts` | Mock 验证 | 真实 JWT 登录 |
| Explore | `fetchExploreData()` | `src/api/general.ts` | Mock 数据 | 数据库查询 |
| Library | `fetchLibraryData()` | `src/api/general.ts` | Mock 数据 | 用户维度查询 |
| History | `fetchHistoryData()` | `src/api/general.ts` | Mock 数据 | 用户观看历史 |
| Vocabulary | `fetchVocabularyData()` | `src/api/general.ts` | Mock 数据 | 用户词汇本（VIP） |
| Vocabulary | `fetchWordDetails(word)` | `src/api/general.ts` | Mock 查找 | 词条详查 |
| Favorites | `fetchFavoritesData()` | `src/api/general.ts` | Mock 数据 | 用户收藏 |
| Favorites | `addFavoriteSentence(sentence)` | `src/api/general.ts` | Mock 追加 | 写入数据库 |
| Favorites | `addVocabularyWord(wordDetails)` | `src/api/general.ts` | Mock 追加 | 写入数据库 |
| Video | `fetchTranscripts(id?)` | `src/api/index.ts` | Mock 数据 | 数据库查询 |
| Video | `fetchVideoInfo(id?)` | `src/api/index.ts` | Mock 数据 | 数据库查询 |
| Video | `toggleFavoriteTranscript(id)` | `src/api/index.ts` | Mock 切换 | 数据库更新 |
| CheckIn | localStorage | `src/utils/storage.ts` | 本地存储 | 后端持久化 |
| FavVideo | localStorage | `src/utils/storage.ts` | 本地存储 | 后端持久化 |

---

## 2. 技术架构

### 2.1 技术选型
| 组件 | 选型 | 说明 |
|------|------|------|
| Web 框架 | FastAPI | 异步高性能，原生 OpenAPI 支持 |
| 数据校验 | Pydantic v2 | 严格类型校验，与前端 TS 接口对齐 |
| ORM | SQLAlchemy 2.0 | 异步模式，自动建表 |
| 数据库 | Neon PostgreSQL | Serverless PostgreSQL，免运维 |
| 数据库驱动 | asyncpg | SQLAlchemy 异步 PostgreSQL 驱动 |
| 认证 | python-jose + passlib | JWT Token 认证 |
| 配置 | python-dotenv | .env 环境变量管理 |
| 迁移 | SQLAlchemy `create_all` | 开发阶段自动建表/更新 |

### 2.2 架构分层
```
main.py              → 应用入口：CORS、全局异常、路由注册
routers/             → 路由层：按业务模块划分（auth, explore, library, history, vocabulary, favorites, video）
schemas/             → Pydantic 模型层：请求体/响应体校验，字段对齐前端 TS 驼峰命名
services/            → 业务逻辑层：核心业务处理与数据加工
models/              → SQLAlchemy ORM 模型层
core/                → 核心配置：数据库连接、JWT、环境变量
```

### 2.3 统一响应格式
```json
{
  "code": 200,
  "data": { ... },
  "message": "success"
}
```
错误时 `code` 为非 200，`message` 为错误描述。

---

## 3. 数据库设计

### 3.1 ER 图（文字版）
```
users ──1:N── watch_history ──N:1── videos
users ──1:N── vocabulary
users ──1:N── favorite_sentences
users ──1:N── favorite_videos ──N:1── videos
users ──1:N── check_ins
videos ──1:N── transcripts
videos ──1:N── carousel_items
```

### 3.2 数据表详细设计

#### 3.2.1 `users` — 用户表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希密码 |
| role | VARCHAR(10) | NOT NULL, DEFAULT 'user' | 角色：user / vip |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

#### 3.2.2 `videos` — 视频表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 视频 ID（v1, yt-xxx） |
| title | VARCHAR(255) | NOT NULL | 标题 |
| duration | VARCHAR(20) | | 时长 |
| level | VARCHAR(20) | | 难度等级 |
| thumb | TEXT | | 缩略图 URL |
| tag | VARCHAR(50) | | 标签 |
| is_vip_only | BOOLEAN | DEFAULT FALSE | 是否 VIP 专属 |
| video_url | TEXT | | 视频播放 URL |
| sort_order | INTEGER | DEFAULT 0 | 排序 |

#### 3.2.3 `categories` — 分类表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 分类名 |

#### 3.2.4 `carousel_items` — 轮播图表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 轮播项 ID |
| title | VARCHAR(255) | NOT NULL | 标题 |
| subtitle | VARCHAR(255) | | 副标题 |
| desc | TEXT | | 描述 |
| image | TEXT | | 图片 URL |
| tag | VARCHAR(50) | | 标签 |
| video_id | VARCHAR(50) | FK → videos.id | 关联视频 |
| sort_order | INTEGER | DEFAULT 0 | 排序 |

#### 3.2.5 `transcripts` — 字幕表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 字幕 ID |
| video_id | VARCHAR(50) | FK → videos.id, NOT NULL | 所属视频 |
| start_time | VARCHAR(10) | NOT NULL | 开始时间 |
| end_time | VARCHAR(10) | NOT NULL | 结束时间 |
| en_text | TEXT | NOT NULL | 英文文本 |
| zh_text | TEXT | NOT NULL | 中文文本 |
| highlights_json | TEXT | | 高亮词 JSON |
| sort_order | INTEGER | DEFAULT 0 | 排序 |

#### 3.2.6 `watch_history` — 观看历史表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户 ID |
| video_id | VARCHAR(50) | FK → videos.id, NOT NULL | 视频 ID |
| progress | INTEGER | DEFAULT 0 | 进度百分比 |
| last_watched | VARCHAR(50) | | 最后观看时间描述 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### 3.2.7 `vocabulary` — 词汇本表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 词汇 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户 ID |
| word | VARCHAR(100) | NOT NULL | 单词 |
| phonetic | VARCHAR(100) | | 音标 |
| pos | VARCHAR(20) | | 词性 |
| mean | TEXT | | 英文释义 |
| trans | TEXT | | 中文翻译 |
| example | TEXT | | 例句 |
| example_trans | TEXT | | 例句翻译 |
| added_at | VARCHAR(50) | | 添加时间描述 |

#### 3.2.8 `favorite_sentences` — 收藏句子表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 句子 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户 ID |
| en_text | TEXT | NOT NULL | 英文句子 |
| zh_text | TEXT | NOT NULL | 中文句子 |
| video_title | VARCHAR(255) | | 来源视频标题 |
| time | VARCHAR(10) | | 时间戳 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

#### 3.2.9 `favorite_videos` — 收藏视频表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户 ID |
| video_id | VARCHAR(50) | FK → videos.id, NOT NULL | 视频 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| UNIQUE(user_id, video_id) | | | 唯一约束 |

#### 3.2.10 `check_ins` — 打卡表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| user_id | INTEGER | FK → users.id, NOT NULL | 用户 ID |
| check_in_date | VARCHAR(10) | NOT NULL | 打卡日期 (YYYY-MM-DD) |
| UNIQUE(user_id, check_in_date) | | | 每日唯一 |

### 3.3 初始种子数据
需要在数据库中预置 Mock 数据对应的记录，确保前端切换到真实接口后数据无缝衔接：
- **用户**: damion/123456 (role: user), root/123456 (role: vip)
- **分类**: All, Business, Daily Life, Travel, IELTS, Slang
- **轮播**: 3 条 carousel 数据
- **视频**: 4 条 explore 视频 + mockVideoInfo
- **字幕**: 5 条 transcript 数据（关联到 v1）
- **词汇**: 4 条 vocab 数据（关联到 root 用户）
- **历史**: 2 条 history 数据（关联到 damion 用户）
- **收藏句子**: 2 条 favorite sentences（关联到 damion 用户）

---

## 4. 接口规范（API Specification）

### 4.1 认证模块

#### `POST /api/auth/login`
- **描述**: 用户登录
- **Request Body**:
  ```json
  { "username": "damion", "password": "123456" }
  ```
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "username": "damion",
      "role": "user",
      "token": "eyJhbGciOi..."
    },
    "message": "success"
  }
  ```
- **Response** (401):
  ```json
  { "code": 401, "data": null, "message": "Invalid username or password" }
  ```

> **前端对齐**: `loginApi(username, password): Promise<User>` — 返回的 data 结构需完全对齐 `User` 接口（含 token 扩展字段，前端忽略即可），返回 Promise reject 对应 401。

---

### 4.2 探索模块

#### `GET /api/explore`
- **描述**: 获取探索页数据（分类、视频列表、轮播）
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "categories": ["All", "Business", "Daily Life", "Travel", "IELTS", "Slang"],
      "videos": [
        {
          "id": "v1",
          "title": "Mastering British Phrasal Verbs",
          "duration": "12:45",
          "level": "Intermediate",
          "thumb": "https://...",
          "tag": "British English",
          "isVipOnly": false
        }
      ],
      "carousel": [
        {
          "id": "v1",
          "title": "商场购物与试衣",
          "subtitle": "Shopping & Fitting",
          "desc": "Learn essential vocabulary...",
          "image": "https://...",
          "tag": "Up Next"
        }
      ]
    },
    "message": "success"
  }
  ```

> **前端对齐**: `fetchExploreData(): Promise<{categories, videos, carousel}>`

---

### 4.3 图书馆模块（需要认证）

#### `GET /api/library`
- **描述**: 获取个人图书馆数据
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "vocab": [ ... ],
      "history": [ ... ],
      "stats": { "streak": 12, "words": 348, "sentences": 56, "hours": 24.5 }
    },
    "message": "success"
  }
  ```

> **前端对齐**: `fetchLibraryData(): Promise<{vocab, history, stats}>`

---

### 4.4 历史模块（需要认证）

#### `GET /api/history`
- **描述**: 获取用户观看历史
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": "v1",
        "title": "Mastering British Phrasal Verbs",
        "duration": "12:45",
        "level": "Intermediate",
        "thumb": "https://...",
        "tag": "British English",
        "progress": 85,
        "lastWatched": "2 hours ago"
      }
    ],
    "message": "success"
  }
  ```

> **前端对齐**: `fetchHistoryData(): Promise<any[]>`

---

### 4.5 词汇模块（需要认证 + VIP）

#### `GET /api/vocabulary`
- **描述**: 获取用户词汇本
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": "w1",
        "word": "get by",
        "phonetic": "/get baɪ/",
        "pos": "phrasal verb",
        "mean": "To manage or survive with limited resources.",
        "trans": "勉强生存，维持",
        "added": "2 days ago",
        "example": "\"I can get by on just 5 hours of sleep.\"",
        "exampleTrans": "我只睡5个小时也能勉强应付。"
      }
    ],
    "message": "success"
  }
  ```

#### `GET /api/vocabulary/{word}`
- **描述**: 查询单词详情
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "word": "because",
      "phonetic": "/bɪˈkɒz/",
      "trans": "conj. 因为",
      "pos": "conj.",
      "mean": "因为",
      "example": "\"We are back home, because we wanted to freshen up a bit,\"",
      "exampleTrans": "我们回家了，因为我们想稍微梳洗打扮一下",
      "isSaved": true
    },
    "message": "success"
  }
  ```

#### `POST /api/vocabulary`
- **描述**: 添加单词到词汇本
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "word": "because",
    "phonetic": "/bɪˈkɒz/",
    "trans": "conj. 因为",
    "pos": "conj.",
    "mean": "因为",
    "example": "\"We are back home, because we wanted to freshen up a bit,\"",
    "exampleTrans": "我们回家了，因为我们想稍微梳洗打扮一下"
  }
  ```
- **Response** (200):
  ```json
  { "code": 200, "data": true, "message": "success" }
  ```

> **前端对齐**: `fetchVocabularyData()`, `fetchWordDetails(word)`, `addVocabularyWord(wordDetails)`

---

### 4.6 收藏模块（需要认证）

#### `GET /api/favorites`
- **描述**: 获取用户收藏数据
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "videos": [ ... ],
      "sentences": [
        {
          "id": "s1",
          "en": "They go on your finger.",
          "zh": "它们戴在你的手指上。",
          "videoTitle": "商场购物与试衣",
          "time": "00:02"
        }
      ]
    },
    "message": "success"
  }
  ```

#### `POST /api/favorites/sentence`
- **描述**: 收藏句子
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "en": "They go on your finger.",
    "zh": "它们戴在你的手指上。",
    "videoTitle": "商场购物与试衣",
    "time": "00:02"
  }
  ```
- **Response** (200):
  ```json
  { "code": 200, "data": true, "message": "success" }
  ```

#### `GET /api/favorites/videos`
- **描述**: 获取收藏视频列表
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "code": 200, "data": [ ... ], "message": "success" }
  ```

#### `POST /api/favorites/videos/{video_id}/toggle`
- **描述**: 切换视频收藏状态
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "code": 200, "data": true, "message": "success" }
  ```

> **前端对齐**: `fetchFavoritesData()`, `addFavoriteSentence(sentence)`

---

### 4.7 视频学习模块

#### `GET /api/video/{video_id}/info`
- **描述**: 获取视频信息
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": {
      "id": "v1",
      "title": "YouTube Video Example",
      "thumbnail": "https://...",
      "videoUrl": "https://www.youtube.com/watch?v=4E9YkJKiRTc",
      "duration": "00:10",
      "index": 1,
      "total": 5,
      "isVipOnly": false
    },
    "message": "success"
  }
  ```

#### `GET /api/video/{video_id}/transcripts`
- **描述**: 获取视频字幕
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": "1",
        "startTime": "00:00",
        "endTime": "00:05",
        "en": "Testing actual video playback...",
        "zh": "正在使用网络URL测试...",
        "highlights": [{ "word": "network", "color": "text-[#D48166]" }],
        "isFavorite": false
      }
    ],
    "message": "success"
  }
  ```

#### `PUT /api/video/transcript/{transcript_id}/favorite`
- **描述**: 切换字幕收藏状态
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "code": 200, "data": true, "message": "success" }
  ```

> **前端对齐**: `fetchTranscripts(id?)`, `fetchVideoInfo(id?)`, `toggleFavoriteTranscript(id)`

---

### 4.8 打卡模块（需要认证）

#### `GET /api/checkin`
- **描述**: 获取打卡记录
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "code": 200,
    "data": ["2026-05-28", "2026-05-29", "2026-05-30"],
    "message": "success"
  }
  ```

#### `POST /api/checkin`
- **描述**: 打卡
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  { "code": 200, "data": true, "message": "success" }
  ```

> **前端对齐**: 对应 `getCheckIns()`, `addCheckIn()` 的 localStorage 操作

---

## 5. 开发阶段划分

### 阶段一：基础设施搭建 🏗️
| # | 任务 | 产出文件 |
|---|------|----------|
| 1.1 | 创建 `.env` 文件及环境变量配置 | `.env`, `core/config.py` |
| 1.2 | 搭建 FastAPI 入口 `main.py`（CORS、异常处理、统一响应） | `main.py` |
| 1.3 | SQLAlchemy 数据库连接与自动建表 | `core/database.py` |
| 1.4 | 创建所有 SQLAlchemy ORM 模型 | `models/*.py` |
| 1.5 | 数据库种子数据插入脚本 | `core/seed.py` |
| 1.6 | Pyproject/Pipfile 依赖管理 | `requirements.txt` |

### 阶段二：认证模块 🔐
| # | 任务 | 产出文件 |
|---|------|----------|
| 2.1 | Pydantic Schema（UserLogin, UserResponse） | `schemas/auth.py` |
| 2.2 | 密码哈希与 JWT 工具函数 | `core/security.py` |
| 2.3 | 登录业务逻辑 | `services/auth_service.py` |
| 2.4 | 登录路由 | `routers/auth.py` |
| 2.5 | 认证依赖注入（get_current_user） | `core/deps.py` |

### 阶段三：探索模块 🌍
| # | 任务 | 产出文件 |
|---|------|----------|
| 3.1 | Pydantic Schema（ExploreResponse） | `schemas/explore.py` |
| 3.2 | 探索页业务逻辑 | `services/explore_service.py` |
| 3.3 | 探索页路由 | `routers/explore.py` |

### 阶段四：视频学习模块 🎬
| # | 任务 | 产出文件 |
|---|------|----------|
| 4.1 | Pydantic Schema（VideoInfo, Transcript） | `schemas/video.py` |
| 4.2 | 视频信息/字幕查询业务逻辑 | `services/video_service.py` |
| 4.3 | 视频路由（含字幕收藏切换） | `routers/video.py` |

### 阶段五：用户中心模块 👤
| # | 任务 | 产出文件 |
|---|------|----------|
| 5.1 | Pydantic Schema（History, Vocab, Library） | `schemas/user.py` |
| 5.2 | 图书馆/历史/词汇/打卡业务逻辑 | `services/user_service.py` |
| 5.3 | 图书馆/历史/词汇/打卡路由 | `routers/user.py` |

### 阶段六：收藏模块 ⭐
| # | 任务 | 产出文件 |
|---|------|----------|
| 6.1 | Pydantic Schema（Favorites） | `schemas/favorites.py` |
| 6.2 | 收藏业务逻辑 | `services/favorites_service.py` |
| 6.3 | 收藏路由 | `routers/favorites.py` |

### 阶段七：前端 API 层改造 🔌
| # | 任务 | 产出文件 |
|---|------|----------|
| 7.1 | 修改 `src/api/auth.ts` 为真实 fetch | `src/api/auth.ts` |
| 7.2 | 修改 `src/api/general.ts` 为真实 fetch | `src/api/general.ts` |
| 7.3 | 修改 `src/api/index.ts` 为真实 fetch | `src/api/index.ts` |
| 7.4 | 修改 `src/utils/storage.ts` 打卡/收藏改用 API | `src/utils/storage.ts` |
| 7.5 | 验证全流程集成测试 | — |

---

## 6. 目录结构

```
backend/
├── .env                          # 环境变量（数据库URL、JWT密钥等）
├── .env.example                  # 环境变量模板
├── requirements.txt              # Python 依赖
├── main.py                       # 应用入口
├── core/
│   ├── __init__.py
│   ├── config.py                 # 配置管理（读取.env）
│   ├── database.py               # SQLAlchemy 引擎 & 会话
│   ├── security.py               # 密码哈希 & JWT
│   ├── deps.py                   # 依赖注入（get_current_user）
│   └── seed.py                   # 数据库种子数据
├── models/
│   ├── __init__.py
│   ├── user.py                   # User ORM
│   ├── video.py                  # Video, Transcript ORM
│   ├── category.py               # Category ORM
│   ├── carousel.py               # CarouselItem ORM
│   ├── watch_history.py          # WatchHistory ORM
│   ├── vocabulary.py             # Vocabulary ORM
│   ├── favorite_sentence.py      # FavoriteSentence ORM
│   ├── favorite_video.py         # FavoriteVideo ORM
│   └── check_in.py               # CheckIn ORM
├── schemas/
│   ├── __init__.py
│   ├── auth.py                   # 认证 Pydantic
│   ├── explore.py                # 探索 Pydantic
│   ├── video.py                  # 视频 Pydantic
│   ├── user.py                   # 用户中心 Pydantic
│   └── favorites.py             # 收藏 Pydantic
├── routers/
│   ├── __init__.py
│   ├── auth.py                   # 认证路由
│   ├── explore.py                # 探索路由
│   ├── video.py                  # 视频路由
│   ├── user.py                   # 用户中心路由
│   └── favorites.py             # 收藏路由
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── explore_service.py
│   ├── video_service.py
│   ├── user_service.py
│   └── favorites_service.py
└── docs/
    └── PRD.md                    # 本文档
```

---

> **下一步**: 请审核以上 PRD 文档，确认接口规范与开发阶段划分无误后，我将按阶段逐步完成开发。
