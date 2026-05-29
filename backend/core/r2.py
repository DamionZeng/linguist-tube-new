import uuid

import boto3
from botocore.config import Config as BotoConfig

from core.config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_VIDEO_SIZE = 500 * 1024 * 1024

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client is None:
        settings = get_settings()
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=BotoConfig(signature_version="s3v4"),
        )
    return _s3_client


def _public_url() -> str:
    return get_settings().r2_public_url.rstrip("/")


def _bucket() -> str:
    return get_settings().r2_bucket_name


def upload_thumbnail(video_id: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"thumbnails/{video_id}.{ext}"
    _get_client().put_object(
        Bucket=_bucket(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"{_public_url()}/{key}"


def upload_video_file(video_id: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"videos/{video_id}.{ext}"
    _get_client().put_object(
        Bucket=_bucket(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"{_public_url()}/{key}"


def upload_file(folder: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"
    _get_client().put_object(
        Bucket=_bucket(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"{_public_url()}/{key}"


def delete_file(url: str) -> None:
    prefix = f"{_public_url()}/"
    if not url.startswith(prefix):
        return
    key = url[len(prefix):]
    _get_client().delete_object(Bucket=_bucket(), Key=key)