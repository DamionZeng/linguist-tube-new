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

    # 任务超时时间 (分钟)，Worker 自身定时检查
    task_timeout_minutes: int = 30
    # 最大并发处理任务数，默认 1（内存资源有限时顺序处理）
    max_concurrent_tasks: int = 1
    # Worker 心跳间隔 (秒)
    heartbeat_interval: int = 15

    # yt-dlp HTTP 代理
    # 格式: http://host:port 或 socks5://host:port
    yt_proxy: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
