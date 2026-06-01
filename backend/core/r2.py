import uuid

import boto3
from botocore.config import Config as BotoConfig

from core.config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_VIDEO_SIZE = 500 * 1024 * 1024
MULTIPART_THRESHOLD = 5 * 1024 * 1024
MULTIPART_PART_SIZE = 5 * 1024 * 1024

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
            config=BotoConfig(
                signature_version="s3v4",
                connect_timeout=10,
                read_timeout=120,
                retries={"max_attempts": 3, "mode": "adaptive"},
            ),
        )
    return _s3_client


def _public_url() -> str:
    return get_settings().r2_public_url.rstrip("/")


def _bucket() -> str:
    return get_settings().r2_bucket_name


def check_r2_connection() -> bool:
    try:
        client = _get_client()
        client.head_bucket(Bucket=_bucket())
        return True
    except Exception as e:
        print(f"  R2 连接检测失败: {e}")
        return False


def _upload_with_multipart(key: str, data: bytes, content_type: str) -> None:
    client = _get_client()
    bucket = _bucket()
    total_size = len(data)
    part_count = (total_size + MULTIPART_PART_SIZE - 1) // MULTIPART_PART_SIZE

    print(f"  分片上传: {total_size / (1024*1024):.1f} MB, {part_count} 片")

    mpu = client.create_multipart_upload(Bucket=bucket, Key=key, ContentType=content_type)
    upload_id = mpu["UploadId"]
    parts = []

    try:
        for i in range(part_count):
            start = i * MULTIPART_PART_SIZE
            end = min(start + MULTIPART_PART_SIZE, total_size)
            part_data = data[start:end]

            resp = client.upload_part(
                Bucket=bucket,
                Key=key,
                PartNumber=i + 1,
                UploadId=upload_id,
                Body=part_data,
            )
            parts.append({"PartNumber": i + 1, "ETag": resp["ETag"]})
            done = min((i + 1) * MULTIPART_PART_SIZE, total_size)
            print(f"    片 {i+1}/{part_count} 完成 ({done / (1024*1024):.1f}/{total_size / (1024*1024):.1f} MB)")

        client.complete_multipart_upload(
            Bucket=bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={"Parts": parts},
        )
        print(f"  分片上传完成")
    except Exception as e:
        try:
            client.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
        except Exception:
            pass
        raise e


def _do_upload(key: str, data: bytes, content_type: str) -> None:
    if len(data) >= MULTIPART_THRESHOLD:
        _upload_with_multipart(key, data, content_type)
    else:
        _get_client().put_object(
            Bucket=_bucket(),
            Key=key,
            Body=data,
            ContentType=content_type,
        )


def upload_thumbnail(video_id: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"thumbnails/{video_id}.{ext}"
    _do_upload(key, file_bytes, content_type)
    return f"{_public_url()}/{key}"


def upload_video_file(video_id: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"videos/{video_id}.{ext}"
    _do_upload(key, file_bytes, content_type)
    return f"{_public_url()}/{key}"


def upload_file(folder: str, file_bytes: bytes, content_type: str, ext: str) -> str:
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"
    _do_upload(key, file_bytes, content_type)
    return f"{_public_url()}/{key}"


def delete_file(url: str) -> None:
    prefix = f"{_public_url()}/"
    if not url.startswith(prefix):
        return
    key = url[len(prefix):]
    _get_client().delete_object(Bucket=_bucket(), Key=key)


def file_exists_in_r2(key: str) -> str | None:
    try:
        _get_client().head_object(Bucket=_bucket(), Key=key)
        return f"{_public_url()}/{key}"
    except Exception:
        return None


def get_public_url(key: str) -> str:
    return f"{_public_url()}/{key}"


UPLOAD_CONTENT_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png", "webp": "image/webp",
    "mp4": "video/mp4", "webm": "video/webm",
}


def upload_by_key(key: str, data: bytes, ext: str) -> str:
    content_type = UPLOAD_CONTENT_TYPES.get(ext, "application/octet-stream")
    _do_upload(key, data, content_type)
    return f"{_public_url()}/{key}"
