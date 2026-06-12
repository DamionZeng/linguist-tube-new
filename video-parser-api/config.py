from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = ""
    jwt_expire_minutes: int = 1440
    port: int = 8001

    r2_endpoint_url: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    # AI 模型配置 (兼容 OpenAI API 格式)
    ai_base_url: str = "https://api.deepseek.com/v1"
    ai_api_key: str = ""
    ai_model: str = "deepseek-chat"

    # yt-dlp cookies 文件路径 (Netscape 格式)
    yt_cookies_file: str = ""

    # yt-dlp HTTP 代理 (服务器 IP 被封时使用)
    # 格式: http://user:pass@host:port 或 socks5://host:port
    yt_proxy: str = ""

    # yt-dlp Node.js 可执行文件路径 (yt-dlp 2025+ 生成 PO Token 必须)
    # 留空则自动检测，systemd 服务进程找不到时需手动指定
    yt_node_path: str = ""

    # yt-dlp YouTube player_client 类型，逗号分隔 (服务器环境推荐 ios,web)
    # 可选: ios, web, android, web_creator, tv, mweb
    yt_player_clients: str = "ios,web"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
