from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_expire_minutes: int = 10080  # 7 days
    port: int = 8000

    r2_endpoint_url: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""

    siliconflow_api_key: str = ""

    # 任务超时时间 (分钟)，超过此时间仍为 processing 的任务会被标记为失败
    task_timeout_minutes: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()