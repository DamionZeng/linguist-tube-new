"""
导入视频到 LinguistTube 的模块。

支持两种使用方式:
  1. 直接引用: from collector.import_video import import_video; await import_video(...)
  2. CLI: python -m collector.import_video --video ... --srt ... --id v5 ...

--srt 支持两种格式，脚本自动检测:
  格式A - 拼接式: 前半部分全部 EN 条目，后半部分全部 ZH 条目，时间戳对应
  格式B - 双语式: 每条内 EN 第一行、ZH 第二行
"""

import argparse
import asyncio
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def parse_srt(filepath: str) -> list[dict]:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"SRT file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        r"(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*\n(.*?)(?=\n\n|\n*$)",
        re.DOTALL,
    )
    matches = pattern.findall(content)

    if not matches:
        raise ValueError(f"No subtitle entries found in {filepath}")

    result = []
    for start_raw, end_raw, text in matches:
        result.append({
            "start": _normalize_time(start_raw),
            "end": _normalize_time(end_raw),
            "text": text.strip(),
        })
    return result


def parse_concat_srt(filepath: str) -> list[dict]:
    entries = parse_srt(filepath)
    if len(entries) < 2:
        return []

    split_idx = _find_timestamp_reset(entries)
    if split_idx == -1:
        return []

    en_half = entries[:split_idx]
    zh_half = entries[split_idx:]
    count = min(len(en_half), len(zh_half))
    if len(en_half) != len(zh_half):
        print(f"  WARNING: EN half has {len(en_half)} entries, ZH half has {len(zh_half)}. "
              f"Matching first {count} entries.")

    result = []
    for i in range(count):
        result.append({
            "start": en_half[i]["start"],
            "end": en_half[i]["end"],
            "en": en_half[i]["text"],
            "zh": zh_half[i]["text"],
        })
    return result


def _find_timestamp_reset(entries: list[dict]) -> int:
    for i in range(1, len(entries)):
        prev_end = _time_to_seconds(entries[i - 1]["end"])
        curr_start = _time_to_seconds(entries[i]["start"])
        if prev_end - curr_start > 20:
            first_half = i
            second_half = len(entries) - i
            if abs(first_half - second_half) <= max(first_half, second_half) * 0.3:
                return i
    return -1


def _time_to_seconds(t: str) -> int:
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def parse_best_srt(filepath: str) -> list[dict]:
    result = parse_concat_srt(filepath)
    if result:
        print(f"  Detected format: concatenated (EN half + ZH half)")
        return result

    print(f"  Detected format: per-entry bilingual")
    entries = parse_srt(filepath)
    result = []
    for entry in entries:
        lines = [l.strip() for l in entry["text"].split("\n") if l.strip()]
        if len(lines) < 2:
            en_text = lines[0] if lines else ""
            zh_text = ""
        else:
            en_text = lines[0]
            zh_text = lines[1]
        result.append({
            "start": entry["start"],
            "end": entry["end"],
            "en": en_text,
            "zh": zh_text,
        })
    return result


def _normalize_time(raw: str) -> str:
    parts = re.split(r"[:,.]", raw)
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = int(parts[2])
    total_seconds = hours * 3600 + minutes * 60 + seconds
    mm = total_seconds // 60
    ss = total_seconds % 60
    return f"{mm:02d}:{ss:02d}"


def upload_to_r2(filepath: str, folder: str, video_id: str, ext_override: str | None = None) -> str | None:
    from core.r2 import upload_thumbnail, upload_video_file, upload_file, check_r2_connection

    file_size = os.path.getsize(filepath)
    print(f"  文件大小: {file_size / (1024*1024):.1f} MB")

    if not check_r2_connection():
        print("ERROR: R2 连接失败，请检查网络和配置")
        return None

    ext = ext_override or os.path.splitext(filepath)[1].lstrip(".").lower()
    with open(filepath, "rb") as f:
        content = f.read()

    ct_map = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png", "webp": "image/webp",
        "mp4": "video/mp4", "webm": "video/webm",
    }
    content_type = ct_map.get(ext, "application/octet-stream")

    try:
        if folder == "thumbnails":
            return upload_thumbnail(video_id, content, content_type, ext)
        elif folder == "videos":
            return upload_video_file(video_id, content, content_type, ext)
        else:
            return upload_file(folder, content, content_type, ext)
    except Exception as e:
        print(f"WARNING: R2 upload failed for {filepath}: {e}")
        return None


async def insert_video_record(
    video_id, title, video_url, thumb_url, duration, level, tag,
    is_vip, sort_order, youtube_video_id=None, description=None, category=None,
):
    from sqlalchemy import select, func
    from core.database import _get_async_session
    from models.video import Video

    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(select(Video).where(Video.id == video_id))
        if existing.scalar_one_or_none():
            raise ValueError(f"Video id '{video_id}' already exists in database")

        if sort_order is None:
            max_order = await session.execute(select(func.max(Video.sort_order)))
            max_val = max_order.scalar() or 0
            sort_order = max_val + 1

        video = Video(
            id=video_id,
            title=title,
            video_url=video_url,
            thumb=thumb_url,
            duration=duration,
            level=level,
            tag=tag,
            is_vip_only=is_vip,
            sort_order=sort_order,
            video_id=youtube_video_id,
            description=description,
            category=category,
        )
        session.add(video)
        await session.commit()
        print(f"  Video record created: {video_id} - {title}")


async def insert_transcripts(video_id: str, entries: list[dict]):
    from core.database import _get_async_session
    from models.video import Transcript

    session_factory = _get_async_session()
    async with session_factory() as session:
        for i, entry in enumerate(entries, 1):
            transcript_id = f"t{video_id}_{i}"
            words_data = entry.get("words", {})
            transcript = Transcript(
                id=transcript_id,
                video_id=video_id,
                start_time=entry["start"],
                end_time=entry["end"],
                en_text=entry["en"],
                zh_text=entry["zh"],
                highlights_json=json.dumps([]),
                words_json=json.dumps(words_data, ensure_ascii=False) if words_data else None,
                sort_order=i,
            )
            session.add(transcript)
        await session.commit()
    print(f"  {len(entries)} transcript entries inserted")


def _load_words_json(path: str | None) -> list[dict] | None:
    if not path or not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else None
    except (json.JSONDecodeError, IOError):
        return None


def fmt_duration(entries: list[dict]) -> str:
    if not entries:
        return "00:00"
    last_end = entries[-1]["end"]
    parts = last_end.split(":")
    total = int(parts[0]) * 60 + int(parts[1])
    mm = total // 60
    ss = total % 60
    return f"{mm:02d}:{ss:02d}"


async def import_video(
    video_path: str,
    srt_path: str | None = None,
    en_srt_path: str | None = None,
    zh_srt_path: str | None = None,
    en_words_path: str | None = None,
    thumb_path: str | None = None,
    video_id: str = "",
    title: str = "",
    level: str = "Intermediate",
    tag: str = "",
    is_vip: bool = True,
    sort_order: int | None = None,
    no_upload: bool = False,
    youtube_video_id: str | None = None,
    description: str | None = None,
    category: str | None = None,
) -> bool:
    """直接引用的入库函数，collect.py 调用此函数即可。"""

    for label, path in [
        ("video", video_path),
        ("en-srt", en_srt_path),
        ("zh-srt", zh_srt_path),
        ("srt", srt_path),
        ("thumb", thumb_path),
    ]:
        if path and not os.path.exists(path):
            print(f"ERROR: {label} file not found: {path}")
            return False

    if not srt_path and not en_srt_path:
        print("ERROR: must provide either srt_path or en_srt_path")
        return False

    if srt_path:
        print(f"Parsing SRT: {srt_path}")
        entries = parse_best_srt(srt_path)
    else:
        print(f"Parsing EN SRT: {en_srt_path}")
        en_entries = parse_srt(en_srt_path)
        if zh_srt_path:
            print(f"Parsing ZH SRT: {zh_srt_path}")
            zh_entries = parse_srt(zh_srt_path)
            if len(en_entries) != len(zh_entries):
                print(f"WARNING: EN has {len(en_entries)} entries, ZH has {len(zh_entries)}. "
                      f"Matching by index, extras will be truncated.")
            entries = []
            for i in range(min(len(en_entries), len(zh_entries))):
                entries.append({
                    "start": en_entries[i]["start"],
                    "end": en_entries[i]["end"],
                    "en": en_entries[i]["text"],
                    "zh": zh_entries[i]["text"],
                })
        else:
            entries = [{
                "start": e["start"],
                "end": e["end"],
                "en": e["text"],
                "zh": "",
            } for e in en_entries]
    print(f"  Parsed {len(entries)} subtitle entries")

    en_words_list = _load_words_json(en_words_path) if en_words_path else None
    for i, entry in enumerate(entries):
        words_data = {}
        if en_words_list and i < len(en_words_list):
            words_data["en"] = en_words_list[i].get("words", [])
        entry["words"] = words_data

    if no_upload:
        video_url = video_path
        thumb_url = thumb_path or ""
        print("Skipping R2 upload (--no-upload)")
    else:
        print(f"Uploading video to R2: {video_path}")
        try:
            video_url = await asyncio.wait_for(
                asyncio.to_thread(upload_to_r2, video_path, "videos", video_id),
                timeout=600,
            )
        except asyncio.TimeoutError:
            print("ERROR: video upload timed out (600s)")
            return False
        if video_url is None:
            print("ERROR: video upload failed")
            return False
        print(f"  Video URL: {video_url}")

        thumb_url = ""
        if thumb_path:
            print(f"Uploading thumbnail to R2: {thumb_path}")
            try:
                thumb_url = await asyncio.wait_for(
                    asyncio.to_thread(upload_to_r2, thumb_path, "thumbnails", video_id),
                    timeout=60,
                ) or ""
            except asyncio.TimeoutError:
                print("  Thumbnail upload timed out")
                thumb_url = ""
            if thumb_url:
                print(f"  Thumbnail URL: {thumb_url}")
            else:
                print("  Thumbnail upload failed, continuing without it")

    duration = fmt_duration(entries)
    print(f"\nInserting into database...")
    print(f"  Duration: {duration} (from last subtitle timestamp)")

    await insert_video_record(
        video_id=video_id,
        title=title,
        video_url=video_url,
        thumb_url=thumb_url,
        duration=duration,
        level=level,
        tag=tag,
        is_vip=is_vip,
        sort_order=sort_order,
        youtube_video_id=youtube_video_id,
        description=description,
        category=category,
    )

    await insert_transcripts(video_id, entries)

    print(f"\n{'='*60}")
    print(f"Import complete!")
    print(f"  Video ID: {video_id}")
    print(f"  Title:    {title}")
    print(f"  Duration: {duration}")
    print(f"  Entries:  {len(entries)}")
    print(f"  VIP:      {'Yes' if is_vip else 'No'}")
    if youtube_video_id:
        print(f"  YouTube:  {youtube_video_id}")
    if category:
        print(f"  Category: {category}")
    if video_url:
        print(f"  R2 URL:   {video_url}")
    if thumb_url:
        print(f"  Thumb:    {thumb_url}")
    print(f"{'='*60}")
    return True


async def main():
    parser = argparse.ArgumentParser(description="Import a video with subtitles into LinguistTube")
    parser.add_argument("--video", required=True, help="Video file path (mp4/webm)")
    parser.add_argument("--en-srt", help="English SRT subtitle file")
    parser.add_argument("--zh-srt", help="Chinese SRT subtitle file")
    parser.add_argument("--srt", help="Bilingual SRT (EN+ZH in one file)")
    parser.add_argument("--thumb", help="Thumbnail image file (jpg/png/webp)")
    parser.add_argument("--id", required=True, help="Video ID (e.g. v5)")
    parser.add_argument("--title", required=True, help="Video title")
    parser.add_argument("--level", default="Intermediate", help="Difficulty level (default: Intermediate)")
    parser.add_argument("--tag", default="", help="Category tag")
    parser.add_argument("--vip", action="store_true", help="Mark as VIP-only")
    parser.add_argument("--sort", type=int, help="Sort order (auto if not specified)")
    parser.add_argument("--no-upload", action="store_true", help="Skip R2 upload, use local paths as URLs")
    parser.add_argument("--youtube-video-id", help="YouTube video ID (e.g. IrzWCcsHXYU)")
    parser.add_argument("--description", help="Video description")
    parser.add_argument("--category", help="Video category")
    args = parser.parse_args()

    success = await import_video(
        video_path=args.video,
        srt_path=args.srt,
        en_srt_path=args.en_srt,
        zh_srt_path=args.zh_srt,
        thumb_path=args.thumb,
        video_id=args.id,
        title=args.title,
        level=args.level,
        tag=args.tag,
        is_vip=args.vip,
        sort_order=args.sort,
        no_upload=args.no_upload,
        youtube_video_id=args.youtube_video_id,
        description=args.description,
        category=args.category,
    )

    from core.database import dispose_engine
    await dispose_engine()

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
