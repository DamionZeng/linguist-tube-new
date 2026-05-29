"""
导入视频到 LinguistTube 的 CLI 脚本。

用法:
    # 拼接式 SRT（整个文件前半 EN、后半 ZH，时间戳完全对应）
    python scripts/import_video.py \
        --video ./my_video.mp4 \
        --srt ./combined.srt \
        --id v5 \
        --title "Toad's Depression" \
        --level Intermediate \
        --tag "Psychology"

    # 分离的英/中字幕文件
    python scripts/import_video.py \
        --video ./my_video.mp4 \
        --en-srt ./subs.en.srt \
        --zh-srt ./subs.zh.srt \
        --id v5 \
        --title "商场购物与试衣" \
        --level Intermediate \
        --tag "Daily Life"

    # 双语字幕（每条字幕的 EN 和 ZH 分行写在同一 SRT 内，脚本自动识别）
    python scripts/import_video.py \
        --video ./my_video.mp4 \
        --srt ./bilingual.srt \
        --id v6 \
        --title "求职面试技巧" \
        --level Advanced \
        --tag "Business" \
        --vip

    # 附带缩略图上传
    python scripts/import_video.py \
        --video ./my_video.mp4 \
        --en-srt ./subs.en.srt \
        --zh-srt ./subs.zh.srt \
        --id v7 \
        --title "咖啡馆点餐" \
        --level Beginner \
        --thumb ./thumbnail.jpg

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
    """解析 SRT 文件，返回 [{start, end, text}, ...]"""
    if not os.path.exists(filepath):
        print(f"ERROR: file not found: {filepath}")
        sys.exit(1)

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        r"(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*\n(.*?)(?=\n\n|\n*$)",
        re.DOTALL,
    )
    matches = pattern.findall(content)

    if not matches:
        print(f"ERROR: no subtitle entries found in {filepath}. Is it valid SRT format?")
        sys.exit(1)

    result = []
    for start_raw, end_raw, text in matches:
        result.append({
            "start": _normalize_time(start_raw),
            "end": _normalize_time(end_raw),
            "text": text.strip(),
        })
    return result


def parse_concat_srt(filepath: str) -> list[dict]:
    """解析拼接式 SRT（前半 EN + 后半 ZH，时间戳重置一次）。

    通过检测时间戳回跳（后半段从 00:00 附近重新开始）来定位分界点，
    将 EN 和 ZH 条目按索引配对。
    """
    entries = parse_srt(filepath)
    if len(entries) < 2:
        return []

    split_idx = _find_timestamp_reset(entries)
    if split_idx == -1:
        return []  # not concat format

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
    """找到时间戳回跳的位置（后半段从 00:00 附近重新开始），返回分界索引。

    判据：后一条的 start_time 明显小于前一条的 end_time（差 > 20 秒视为回跳）。
    """
    for i in range(1, len(entries)):
        prev_end = _time_to_seconds(entries[i - 1]["end"])
        curr_start = _time_to_seconds(entries[i]["start"])
        if prev_end - curr_start > 20:
            # 检查后半段长度是否接近前半段（防止误判短小的回跳）
            first_half = i
            second_half = len(entries) - i
            if abs(first_half - second_half) <= max(first_half, second_half) * 0.3:
                return i
    return -1


def _time_to_seconds(t: str) -> int:
    """MM:SS -> 总秒数"""
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def parse_best_srt(filepath: str) -> list[dict]:
    """自动检测 SRT 格式并解析：先尝试拼接式，再尝试逐条双语式"""
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
            print(f"  WARNING: entry at {entry['start']} has only 1 line, using empty ZH")
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
    """把 HH:MM:SS,mmm 转为 MM:SS 格式（数据库存储用）"""
    parts = re.split(r"[:,.]", raw)
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds = int(parts[2])
    total_seconds = hours * 3600 + minutes * 60 + seconds
    mm = total_seconds // 60
    ss = total_seconds % 60
    return f"{mm:02d}:{ss:02d}"


def upload_to_r2(filepath: str, folder: str, video_id: str, ext_override: str | None = None) -> str | None:
    """上传文件到 R2，返回公开 URL；失败则返回 None"""
    from core.r2 import upload_thumbnail, upload_video_file, upload_file

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


async def insert_video_record(video_id, title, video_url, thumb_url, duration, level, tag, is_vip, sort_order):
    from sqlalchemy import select, func
    from core.database import _get_async_session
    from models.video import Video

    session_factory = _get_async_session()
    async with session_factory() as session:
        existing = await session.execute(select(Video).where(Video.id == video_id))
        if existing.scalar_one_or_none():
            print(f"ERROR: video id '{video_id}' already exists in database")
            sys.exit(1)

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
            transcript = Transcript(
                id=transcript_id,
                video_id=video_id,
                start_time=entry["start"],
                end_time=entry["end"],
                en_text=entry["en"],
                zh_text=entry["zh"],
                highlights_json=json.dumps([]),
                sort_order=i,
            )
            session.add(transcript)
        await session.commit()
    print(f"  {len(entries)} transcript entries inserted")


def fmt_duration(entries: list[dict]) -> str:
    if not entries:
        return "00:00"
    last_end = entries[-1]["end"]
    parts = last_end.split(":")
    total = int(parts[0]) * 60 + int(parts[1])
    mm = total // 60
    ss = total % 60
    return f"{mm:02d}:{ss:02d}"


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
    args = parser.parse_args()

    # --- 1. validate files ---
    for label, path in [
        ("video", args.video),
        ("en-srt", args.en_srt),
        ("zh-srt", args.zh_srt),
        ("srt", args.srt),
        ("thumb", args.thumb),
    ]:
        if path and not os.path.exists(path):
            print(f"ERROR: {label} file not found: {path}")
            sys.exit(1)

    if not args.srt and not args.en_srt:
        print("ERROR: must provide either --srt or --en-srt (and optionally --zh-srt)")
        sys.exit(1)

    # --- 2. parse subtitles ---
    if args.srt:
        print(f"Parsing SRT: {args.srt}")
        entries = parse_best_srt(args.srt)
    else:
        print(f"Parsing EN SRT: {args.en_srt}")
        en_entries = parse_srt(args.en_srt)
        if args.zh_srt:
            print(f"Parsing ZH SRT: {args.zh_srt}")
            zh_entries = parse_srt(args.zh_srt)
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

    # --- 3. upload to R2 ---
    if args.no_upload:
        video_url = args.video
        thumb_url = args.thumb or ""
        print("Skipping R2 upload (--no-upload)")
    else:
        print(f"Uploading video to R2: {args.video}")
        video_url = upload_to_r2(args.video, "videos", args.id)
        if video_url is None:
            print("ERROR: video upload failed")
            sys.exit(1)
        print(f"  Video URL: {video_url}")

        thumb_url = ""
        if args.thumb:
            print(f"Uploading thumbnail to R2: {args.thumb}")
            thumb_url = upload_to_r2(args.thumb, "thumbnails", args.id) or ""
            if thumb_url:
                print(f"  Thumbnail URL: {thumb_url}")
            else:
                print("  Thumbnail upload failed, continuing without it")

    # --- 4. insert into database ---
    duration = fmt_duration(entries)
    print(f"\nInserting into database...")
    print(f"  Duration: {duration} (from last subtitle timestamp)")

    await insert_video_record(
        video_id=args.id,
        title=args.title,
        video_url=video_url,
        thumb_url=thumb_url,
        duration=duration,
        level=args.level,
        tag=args.tag,
        is_vip=args.vip,
        sort_order=args.sort,
    )

    await insert_transcripts(args.id, entries)

    # --- 5. summary ---
    print(f"\n{'='*60}")
    print(f"Import complete!")
    print(f"  Video ID: {args.id}")
    print(f"  Title:    {args.title}")
    print(f"  Duration: {duration}")
    print(f"  Entries:  {len(entries)}")
    print(f"  VIP:      {'Yes' if args.vip else 'No'}")
    if video_url:
        print(f"  R2 URL:   {video_url}")
    if thumb_url:
        print(f"  Thumb:    {thumb_url}")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())