"""
视频解析服务模块。

核心流程 (支持断点续传):
  Step 1: 解析 YouTube 视频 ID
  Step 2: WhisperX 转写音频 (词级字幕)
  Step 3: 翻译 EN→ZH
  Step 4: 获取视频元信息
  Step 5: AI 生成元数据
  Step 6: 构建字幕条目
  Step 7: 处理视频和缩略图 URL (下载到 R2 或使用 YouTube 地址)
  Step 8: 入库

每个步骤完成后会缓存结果到 step_data，失败重试时跳过已完成步骤。
"""

import asyncio
import json
import logging
from typing import Optional

from sqlalchemy import select, func

from ai_generator import generate_video_metadata
from config import get_settings
from database import _get_async_session, init_db
from models import Video, Transcript
from youtube_parser import (
    extract_video_id,
    fetch_word_level_transcript,
    synthesize_segments_from_word_level,
    translate_en_to_zh,
    fetch_meta,
    download_thumbnail,
    download_video,
    normalize_segments,
    clean_text,
    build_transcript_entries,
    fmt_duration,
)

logger = logging.getLogger(__name__)

# 步骤编号常量
STEP_EXTRACT_ID = 1
STEP_WHISPERX = 2
STEP_TRANSLATE = 3
STEP_FETCH_META = 4
STEP_AI_META = 5
STEP_BUILD_ENTRIES = 6
STEP_MEDIA = 7
STEP_INSERT_DB = 8

TOTAL_STEPS = 8


async def _update_progress(task_id: Optional[str], progress: str, step: int = 0, step_data: Optional[dict] = None):
    """更新任务进度和步骤数据"""
    if not task_id:
        return
    try:
        from worker import update_task_progress
        await update_task_progress(task_id, progress, step, step_data)
    except Exception as e:
        logger.warning(f"更新进度失败: {e}")


async def parse_and_import(
    youtube_url: str,
    download: bool = False,
    quality: Optional[str] = None,
    task_id: Optional[str] = None,
    resume_step: int = 0,
    cached_data: Optional[dict] = None,
) -> dict:
    """
    解析 YouTube 视频并入库，支持断点续传。

    Args:
        youtube_url: YouTube 视频 URL
        download: 是否下载视频到 R2
        quality: 视频画质
        task_id: 任务 ID
        resume_step: 从哪个步骤开始 (0=从头开始)
        cached_data: 之前缓存的步骤数据
    """
    cache = cached_data or {}

    # ── Step 1: 提取视频 ID ──
    if resume_step < STEP_EXTRACT_ID:
        await _update_progress(task_id, "提取视频 ID...", STEP_EXTRACT_ID)
    video_id = cache.get("video_id") or extract_video_id(youtube_url)
    cache["video_id"] = video_id
    logger.info(f"YouTube Video ID: {video_id}")

    # ── Step 2: WhisperX 转写 ──
    en_words_segments = cache.get("en_words_segments")
    en_segments = cache.get("en_segments")
    if resume_step < STEP_WHISPERX or not en_words_segments:
        await _update_progress(task_id, "WhisperX 转写音频中 (可能需要几分钟)...", STEP_WHISPERX, cache)
        en_words_segments = await asyncio.to_thread(fetch_word_level_transcript, video_id, "en")
        if not en_words_segments:
            raise ValueError("该视频没有英文字幕，无法继续")
        en_segments = synthesize_segments_from_word_level(en_words_segments, "en")
        cache["en_words_segments"] = en_words_segments
        cache["en_segments"] = en_segments
        logger.info(f"EN 字幕: {len(en_segments)} 条")
    else:
        logger.info(f"跳过 Step 2 (已缓存): EN 字幕 {len(en_segments)} 条")

    # ── Step 3: 翻译 EN→ZH ──
    zh_segments = cache.get("zh_segments")
    if resume_step < STEP_TRANSLATE or not zh_segments:
        await _update_progress(task_id, f"翻译字幕 EN→ZH ({len(en_segments)} 条)...", STEP_TRANSLATE, cache)
        zh_segments = await asyncio.to_thread(translate_en_to_zh, en_segments)
        cache["zh_segments"] = zh_segments
        logger.info(f"ZH 字幕: {len(zh_segments)} 条")
    else:
        logger.info(f"跳过 Step 3 (已缓存): ZH 字幕 {len(zh_segments)} 条")

    # ── Step 4: 获取视频元信息 ──
    meta = cache.get("meta")
    if resume_step < STEP_FETCH_META or not meta:
        await _update_progress(task_id, "获取视频元信息...", STEP_FETCH_META, cache)
        meta = await asyncio.to_thread(fetch_meta, youtube_url)
        cache["meta"] = meta
        logger.info(f"标题: {meta['title']}, 时长: {meta['duration']}")
    else:
        logger.info(f"跳过 Step 4 (已缓存): {meta['title']}")

    # ── Step 5: AI 生成元数据 ──
    ai_meta = cache.get("ai_meta")
    if resume_step < STEP_AI_META or not ai_meta:
        await _update_progress(task_id, "AI 生成元数据 (名称/标签/分类/等级/描述)...", STEP_AI_META, cache)
        subtitle_text = " ".join(clean_text(s["text"]) for s in en_segments[:100])
        ai_meta = await generate_video_metadata(
            title=meta["title"],
            description=meta.get("description", ""),
            subtitle_text=subtitle_text,
        )
        cache["ai_meta"] = ai_meta
        logger.info(f"AI 元数据: {ai_meta}")
    else:
        logger.info(f"跳过 Step 5 (已缓存): {ai_meta.get('title_en')}")

    # ── Step 6: 构建字幕条目 ──
    entries = cache.get("entries")
    duration = cache.get("duration")
    if resume_step < STEP_BUILD_ENTRIES or not entries:
        await _update_progress(task_id, "构建字幕条目...", STEP_BUILD_ENTRIES, cache)
        en_normalized = normalize_segments(en_segments)
        zh_normalized = normalize_segments(zh_segments)
        entries = build_transcript_entries(en_normalized, zh_normalized, en_words_segments)
        duration = fmt_duration(entries)
        cache["entries"] = entries
        cache["duration"] = duration
    else:
        logger.info(f"跳过 Step 6 (已缓存): {len(entries)} 条字幕")

    # ── Step 7: 处理视频和缩略图 ──
    video_url = cache.get("video_url")
    thumb_url = cache.get("thumb_url")
    is_platform = cache.get("is_platform", download)  # R2 成功上传才为 True
    if resume_step < STEP_MEDIA or not video_url:
        if download:
            r2_success = False
            await _update_progress(task_id, "下载缩略图...", STEP_MEDIA, cache)
            try:
                thumb_data = await asyncio.to_thread(download_thumbnail, meta["thumbnail_url"])
                if thumb_data:
                    thumb_bytes, thumb_ext = thumb_data
                    thumb_url = await asyncio.to_thread(
                        _upload_to_r2, f"thumbnails/ext_{video_id}.{thumb_ext}", thumb_bytes, thumb_ext
                    )
            except Exception as e:
                logger.warning(f"缩略图下载/上传失败: {e}")

            await _update_progress(task_id, "下载视频文件 (可能需要较长时间)...", STEP_MEDIA, cache)
            try:
                video_data = await asyncio.to_thread(download_video, youtube_url, quality)
                if video_data:
                    video_bytes, video_ext = video_data
                    await _update_progress(task_id, "上传视频到 R2...", STEP_MEDIA, cache)
                    video_url = await asyncio.to_thread(
                        _upload_to_r2, f"videos/ext_{video_id}.{video_ext}", video_bytes, video_ext
                    )
                    r2_success = True
            except Exception as e:
                logger.warning(f"视频下载/上传失败: {e}")

            # 下载失败时降级使用 YouTube 原始 URL，资源类型也改为外部资源
            if not video_url:
                logger.warning(f"视频 R2 下载失败，降级使用 YouTube URL，资源类型改为外部资源")
                video_url = youtube_url
            is_platform = r2_success
        else:
            video_url = youtube_url
            thumb_url = meta.get("thumbnail_url", "")
            is_platform = False

        cache["video_url"] = video_url
        cache["thumb_url"] = thumb_url
        cache["is_platform"] = is_platform
    else:
        logger.info(f"跳过 Step 7 (已缓存): video_url={video_url[:50]}...")

    # ── Step 8: 入库 ──
    await _update_progress(task_id, "写入数据库...", STEP_INSERT_DB, cache)
    db_video_id = f"ext_{video_id}"
    result = await _insert_to_db(
        video_id=db_video_id,
        title_en=ai_meta["title_en"],
        title_zh=ai_meta["title_zh"],
        video_url=video_url,
        thumb_url=thumb_url,
        duration=duration,
        level=ai_meta["level"],
        tags=ai_meta["tags"],
        category=ai_meta["category"],
        description_en=ai_meta["description_en"],
        description_zh=ai_meta["description_zh"],
        youtube_video_id=video_id,
        entries=entries,
        source_type="platform" if is_platform else "external",
    )

    await _update_progress(task_id, "完成", TOTAL_STEPS, cache)
    return result


def _upload_to_r2(key: str, data: bytes, ext: str) -> str:
    from r2 import upload_by_key
    return upload_by_key(key, data, ext)


async def _insert_to_db(
    video_id: str,
    title_en: str,
    title_zh: str,
    video_url: str,
    thumb_url: str,
    duration: str,
    level: str,
    tags: list[str],
    category: str,
    description_en: str,
    description_zh: str,
    youtube_video_id: str,
    entries: list[dict],
    source_type: str = "external",
) -> dict:
    """插入视频和字幕到数据库"""
    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(select(Video).where(Video.id == video_id))
        if existing.scalar_one_or_none():
            video = existing.scalar_one()
            video.title = title_en
            video.title_zh = title_zh
            video.video_url = video_url
            video.thumb = thumb_url
            video.duration = duration
            video.level = level
            video.tag = ",".join(tags)
            video.category = category
            video.description = description_en
            video.description_zh = description_zh
            video.video_id = youtube_video_id
            video.source_type = source_type
            await session.commit()

            from sqlalchemy import delete
            await session.execute(delete(Transcript).where(Transcript.video_id == video_id))

            for i, entry in enumerate(entries, 1):
                transcript_id = f"t{video_id}_{i}"
                transcript = Transcript(
                    id=transcript_id,
                    video_id=video_id,
                    start_time=entry["start"],
                    end_time=entry["end"],
                    en_text=entry["en"],
                    zh_text=entry["zh"],
                    highlights_json="[]",
                    words_json=json.dumps(entry.get("words", {}), ensure_ascii=False) if entry.get("words") else None,
                    sort_order=i,
                )
                session.add(transcript)
            await session.commit()

            return {
                "status": "updated",
                "video_id": video_id,
                "title_en": title_en,
                "title_zh": title_zh,
                "level": level,
                "category": category,
                "tags": tags,
                "transcript_count": len(entries),
            }

        max_order = await session.execute(select(func.max(Video.sort_order)))
        max_val = max_order.scalar() or 0

        video = Video(
            id=video_id,
            title=title_en,
            title_zh=title_zh,
            video_url=video_url,
            thumb=thumb_url,
            duration=duration,
            level=level,
            tag=",".join(tags),
            is_vip_only=True,
            sort_order=max_val + 1,
            video_id=youtube_video_id,
            description=description_en,
            description_zh=description_zh,
            category=category,
            source_type=source_type,
        )
        session.add(video)

        for i, entry in enumerate(entries, 1):
            transcript_id = f"t{video_id}_{i}"
            transcript = Transcript(
                id=transcript_id,
                video_id=video_id,
                start_time=entry["start"],
                end_time=entry["end"],
                en_text=entry["en"],
                zh_text=entry["zh"],
                highlights_json="[]",
                words_json=json.dumps(entry.get("words", {}), ensure_ascii=False) if entry.get("words") else None,
                sort_order=i,
            )
            session.add(transcript)

        await session.commit()

        return {
            "status": "created",
            "video_id": video_id,
            "title_en": title_en,
            "title_zh": title_zh,
            "level": level,
            "category": category,
            "tags": tags,
            "transcript_count": len(entries),
        }
