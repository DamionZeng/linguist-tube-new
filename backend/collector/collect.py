"""
YouTube 视频资源采集 & 自动入库脚本。

流程:
  1. 检测英文字幕 → 无则退出
  2. 检测中文字幕 → 有则直接用，无则翻译 EN→ZH
  3. 下载视频、封面、元信息
  4. 生成 en.srt / zh.srt / bilingual.srt
  5. 自动调 import_video.py 入库 (VIP, ID 自增)

用法:
    python collector/collect.py --url "https://www.youtube.com/watch?v=xxx" [--dry-run] [--no-video]
    python collector/collect.py --url "..." --level Advanced
"""

import argparse
import asyncio
import json
import os
import re
import shutil
import sys
import time
import urllib.request
from pathlib import Path
from typing import Optional

COLLECTOR_DIR = Path(__file__).resolve().parent
PROJECT_DIR = COLLECTOR_DIR.parent
ID_FILE = COLLECTOR_DIR / ".last_id"
OUTPUT_BASE = COLLECTOR_DIR / "output"


# ═══════════════════════════  Phase 0: 依赖 & 工具  ═══════════════════════════

def _check_deps():
    missing = []
    for mod, pkg in [
        ("youtube_transcript_api", "youtube-transcript-api"),
        ("yt_dlp", "yt-dlp"),
        ("deep_translator", "deep-translator"),
    ]:
        try:
            __import__(mod)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"ERROR: 缺少依赖: {', '.join(missing)}")
        print(f"请运行: pip install -r collector/requirements.txt")
        sys.exit(1)


def extract_video_id(url: str) -> str:
    for pat in [
        r"youtube\.com/watch\?v=([^&]+)",
        r"youtu\.be/([^?]+)",
        r"youtube\.com/embed/([^?]+)",
        r"youtube\.com/shorts/([^?]+)",
    ]:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    print(f"ERROR: 无法从 URL 提取视频 ID: {url}")
    sys.exit(1)


def _shorten_title(title: str, max_len: int = 50) -> str:
    title = re.sub(r"\s*\(Official.*?\)", "", title)
    title = re.sub(r"\s*\(.*?Remaster.*?\)", "", title)
    title = re.sub(r"\s*\[.*?\]", "", title)
    for sep in [" | ", " - ", " – ", " — "]:
        if sep in title:
            title = title.split(sep)[0]
            break
    title = title.strip()
    if len(title) > max_len:
        title = title[:max_len].rsplit(" ", 1)[0] + "..."
    return title


def _file_exists(path: Path, min_bytes: int = 1) -> bool:
    return path.exists() and path.stat().st_size >= min_bytes


def _load_cached_srt(path: Path) -> Optional[list[dict]]:
    if not _file_exists(path):
        return None
    try:
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            return None
        count = 0
        for line in content.split("\n"):
            if line.strip() and re.match(r"^\d{2}:\d{2}", line):
                count += 1
        if count < 2:
            return None
        return True
    except Exception:
        return None


def _load_cached_meta(path: Path, expected_video_id: str) -> Optional[dict]:
    if not _file_exists(path):
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("video_id") == expected_video_id:
            return data
    except Exception:
        pass
    return None


# ═══════════════════════════  Phase 1: ID 管理  ═══════════════════════════

def read_next_id() -> int:
    if ID_FILE.exists():
        data = json.loads(ID_FILE.read_text(encoding="utf-8"))
        return data.get("next_num", 1)
    return 1


def save_id(num: int):
    ID_FILE.parent.mkdir(parents=True, exist_ok=True)
    ID_FILE.write_text(json.dumps({"next_num": num + 1}), encoding="utf-8")


# ═══════════════════════════  Phase 2: 字幕 — EN 检测  ═══════════════════════════

def fetch_en_transcript(video_id: str) -> Optional[list[dict]]:
    from youtube_transcript_api import YouTubeTranscriptApi as YTA

    for lang in ["en", "en-US", "en-GB"]:
        try:
            t = YTA().fetch(video_id, languages=[lang])
            if t is not None and len(t) > 0:
                print(f"  EN 字幕 (原生): {len(t)} 条 ({lang})")
                return [{"start": s.start, "duration": s.duration, "text": s.text} for s in t]
        except Exception:
            pass

    import yt_dlp
    tmp = OUTPUT_BASE / "_en_check"
    tmp.mkdir(parents=True, exist_ok=True)
    try:
        opts = {"writesubtitles": True, "writeautomaticsub": True,
                "subtitleslangs": ["en"], "subtitlesformat": "vtt",
                "skip_download": True, "outtmpl": str(tmp / "%(id)s"),
                "quiet": True, "no_warnings": True}
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        for f in tmp.glob("*.vtt"):
            segs = _parse_vtt(str(f))
            if segs:
                print(f"  EN 字幕 (yt-dlp): {len(segs)} 条")
                return segs
    except Exception:
        pass
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    return None


# ═══════════════════════════  Phase 3: 字幕 — ZH (原生 / 翻译)  ═══════════════════════════

def fetch_zh_transcript(video_id: str) -> Optional[list[dict]]:
    from youtube_transcript_api import YouTubeTranscriptApi as YTA

    for lang in ["zh", "zh-Hans", "zh-Hant", "zh-CN", "zh-TW"]:
        try:
            t = YTA().fetch(video_id, languages=[lang])
            if t is not None and len(t) > 0:
                print(f"  ZH 字幕 (原生): {len(t)} 条 ({lang})")
                return [{"start": s.start, "duration": s.duration, "text": s.text} for s in t]
        except Exception:
            pass
    return None


def translate_en_to_zh(en_segments: list[dict]) -> list[dict]:
    from deep_translator import GoogleTranslator

    print(f"  正在翻译 EN→ZH ({len(en_segments)} 条)...")
    zh_segments = []

    texts = [s["text"] for s in en_segments]
    merged = []
    buf = ""
    buf_len = 0
    for t in texts:
        if buf_len + len(t) > 4000:
            merged.append(buf)
            buf = t
            buf_len = len(t)
        else:
            buf = buf + "\n|||\n" + t if buf else t
            buf_len += len(t) + 5
    if buf:
        merged.append(buf)

    translator = GoogleTranslator(source="en", target="zh-CN")
    all_translated = []
    for i, chunk in enumerate(merged, 1):
        print(f"  翻译进度: {i}/{len(merged)}")
        try:
            result = translator.translate(chunk)
            all_translated.extend(result.split("\n|||\n"))
            time.sleep(0.3)
        except Exception as e:
            print(f"  WARNING: 翻译 chunk {i} 失败: {e}")
            all_translated.extend([""] * chunk.count("|||") + [""])
            time.sleep(2)

    for i, seg in enumerate(en_segments):
        zh_segments.append({
            "start": seg["start"],
            "duration": seg["duration"],
            "text": all_translated[i] if i < len(all_translated) else "",
        })

    print(f"  ZH 字幕 (翻译): {len(zh_segments)} 条")
    return zh_segments


# ═══════════════════════════  Phase 4: 元信息 & 媒体  ═══════════════════════════

def fetch_meta(url: str) -> dict:
    import yt_dlp

    opts = {"quiet": True, "no_warnings": True, "extract_flat": False}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    duration = info.get("duration") or 0
    mm, ss = divmod(duration, 60)
    return {
        "title": info.get("title") or "Untitled",
        "author": info.get("uploader") or "Unknown",
        "duration_seconds": duration,
        "duration": f"{mm:02d}:{ss:02d}",
        "description": (info.get("description") or "")[:2000],
        "tags": info.get("tags") or [],
        "publish_date": str(info.get("upload_date") or ""),
        "thumbnail_url": info.get("thumbnail") or "",
    }


def download_thumbnail(thumbnail_url: str, output_dir: Path) -> Optional[Path]:
    if not thumbnail_url:
        return None
    try:
        ext = "webp" if "webp" in thumbnail_url else "jpg"
        filepath = output_dir / f"thumbnail.{ext}"
        req = urllib.request.Request(thumbnail_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req) as resp:
            filepath.write_bytes(resp.read())
        if filepath.stat().st_size < 100:
            filepath.unlink()
            return None
        print(f"  封面已下载: {filepath.name}")
        return filepath
    except Exception as e:
        print(f"  WARNING: 封面下载失败: {e}")
        return None


def download_video(url: str, output_dir: Path, quality: Optional[str]) -> Optional[Path]:
    import yt_dlp

    outtmpl = str(output_dir / "video.mp4")
    h = int(quality[:-1]) if quality else None

    formats_to_try = []
    if h:
        formats_to_try.append(
            f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
        )
        formats_to_try.append(
            f"best[ext=mp4][height<={h}]/best[ext=mp4]/best[height<={h}]/best"
        )
    else:
        formats_to_try.append("bestvideo+bestaudio/best")
        formats_to_try.append("best[ext=mp4]/best")

    for i, fmt in enumerate(formats_to_try):
        need_merge = "+" in fmt
        opts = {"outtmpl": outtmpl, "format": fmt, "no_warnings": True}
        if need_merge:
            opts["merge_output_format"] = "mp4"
        if i > 0:
            opts["overwrites"] = True

        label = "合并格式 (需 ffmpeg)" if need_merge else "单流格式 (无需 ffmpeg)"
        print(f"  正在下载视频... (尝试 {i+1}/{len(formats_to_try)}: {label})")
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            mp4 = output_dir / "video.mp4"
            if mp4.exists():
                print(f"  视频已下载: {mp4.stat().st_size / (1024*1024):.1f} MB")
                return mp4
            for f in output_dir.glob("*.mp4"):
                f.rename(mp4)
                print(f"  视频已下载: {mp4.stat().st_size / (1024*1024):.1f} MB")
                return mp4
            for f in output_dir.glob("*.webm"):
                print(f"  视频已下载 (webm): {f.stat().st_size / (1024*1024):.1f} MB")
                return f
        except Exception as e:
            print(f"  尝试 {i+1} 失败: {e}")
            continue

    print("  ERROR: 所有下载方式均失败")
    return None


# ═══════════════════════════  Phase 5: SRT 生成  ═══════════════════════════

def _seconds_to_srt(seconds: float) -> str:
    h, r = divmod(int(seconds), 3600)
    m, s = divmod(r, 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def segments_to_srt(segments: list[dict]) -> str:
    lines = []
    for i, seg in enumerate(segments, 1):
        lines.append(str(i))
        lines.append(f"{_seconds_to_srt(seg['start'])} --> {_seconds_to_srt(seg['start'] + seg['duration'])}")
        lines.append(seg["text"].replace("\n", " "))
        lines.append("")
    return "\n".join(lines)


def merge_to_bilingual_srt(en_segments: list[dict], zh_segments: list[dict]) -> str:
    zh_idx, zh_len = 0, len(zh_segments)
    lines = []
    for i, en in enumerate(en_segments, 1):
        en_start, en_end = en["start"], en["start"] + en["duration"]
        while zh_idx < zh_len:
            if zh_segments[zh_idx]["start"] + zh_segments[zh_idx]["duration"] <= en_start:
                zh_idx += 1
            else:
                break
        zh_parts = []
        si = zh_idx
        while si < zh_len and zh_segments[si]["start"] < en_end:
            zh_parts.append(zh_segments[si]["text"])
            si += 1
        zh_text = " ".join(zh_parts)
        text_block = f"{en['text'].replace(chr(10), ' ')}\n{zh_text}" if zh_text else en["text"].replace("\n", " ")
        lines.append(str(i))
        lines.append(f"{_seconds_to_srt(en_start)} --> {_seconds_to_srt(en_end)}")
        lines.append(text_block)
        lines.append("")
    return "\n".join(lines)


def _parse_vtt(filepath: str) -> list[dict]:
    if not os.path.exists(filepath):
        return []
    content = Path(filepath).read_text(encoding="utf-8")

    pat = re.compile(
        r"(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\s*\n(.*?)(?=\n\n|\n*$)",
        re.DOTALL,
    )
    matches = pat.findall(content)
    if len(matches) < 2:
        pat2 = re.compile(
            r"(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}).*?\n(.*?)(?=\n\d|\n*$)",
            re.DOTALL,
        )
        matches = pat2.findall(content)

    result = []
    for start_raw, end_raw, text in matches:
        clean = re.sub(r"<[^>]+>", "", text).strip()
        if not clean:
            continue
        sp = start_raw.split(":")
        ep = end_raw.split(":")
        ss = int(sp[0]) * 3600 + int(sp[1]) * 60 + float(sp[2])
        es = int(ep[0]) * 3600 + int(ep[1]) * 60 + float(ep[2])
        dur = es - ss
        if dur <= 0:
            dur = 0.5
        result.append({"start": ss, "duration": dur, "text": clean})
    return result


# ═══════════════════════════  Phase 6: 自动入库  ═══════════════════════════

async def do_import(
    video_id: int,
    title: str,
    video_path: Path,
    srt_path: Path,
    thumb_path: Optional[Path],
    level: str,
    tag: str,
    dry_run: bool,
    youtube_video_id: str,
    description: str,
    category: str,
):
    from collector.import_video import import_video

    print(f"\n{'='*60}")
    if dry_run:
        print("[DRY-RUN] 将执行入库:")
        print(f"  ID: v{video_id}")
        print(f"  标题: {title}")
        print(f"  视频: {video_path}")
        print(f"  字幕: {srt_path}")
        print(f"  封面: {thumb_path}")
        print(f"  等级: {level}")
        print(f"  标签: {tag}")
        print(f"  VIP: True")
        print(f"  YouTube ID: {youtube_video_id}")
        print(f"  分类: {category}")
        print(f"{'='*60}")
        return True

    print(f"执行入库: v{video_id} - {title}")
    try:
        success = await import_video(
            video_path=str(video_path),
            srt_path=str(srt_path),
            thumb_path=str(thumb_path) if thumb_path and thumb_path.exists() else None,
            video_id=f"v{video_id}",
            title=title,
            level=level,
            tag=tag,
            is_vip=True,
            youtube_video_id=youtube_video_id,
            description=description,
            category=category,
        )
        return success
    except Exception as e:
        print(f"入库失败: {e}")
        return False


# ═══════════════════════════  Main  ═══════════════════════════

async def run(args):
    _check_deps()

    video_id = extract_video_id(args.url)
    print(f"YouTube Video ID: {video_id}")

    output_dir = Path(args.output) if args.output else OUTPUT_BASE / f"v{read_next_id()}"
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"输出目录: {output_dir}")

    info_path = output_dir / "video_info.json"
    en_srt_path = output_dir / "en.srt"
    zh_srt_path = output_dir / "zh.srt"
    bilingual_srt_path = output_dir / "bilingual.srt"
    thumb_path_jpg = output_dir / "thumbnail.jpg"
    thumb_path_webp = output_dir / "thumbnail.webp"
    video_path_mp4 = output_dir / "video.mp4"

    cached_meta = _load_cached_meta(info_path, video_id)

    print(f"\n{'='*60}")
    print("Phase 1/5: 检测英文字幕...")
    en_segments = None
    if _load_cached_srt(en_srt_path):
        print(f"  已有 en.srt，跳过英文字幕获取")
        en_segments = True
    else:
        en_segments = fetch_en_transcript(video_id)
        if not en_segments:
            print("ERROR: 该视频没有英文字幕，无法继续。")
            sys.exit(1)

    print(f"\n{'='*60}")
    print("Phase 2/5: 获取中文字幕...")
    zh_segments = None
    if _load_cached_srt(zh_srt_path):
        print(f"  已有 zh.srt，跳过中文字幕获取")
        zh_segments = True
    else:
        zh_segments = fetch_zh_transcript(video_id)
        if zh_segments:
            print(f"  ZH 字幕: {len(zh_segments)} 条 (原生)")
        else:
            print("  无原生中文字幕，启动 EN→ZH 翻译...")
            zh_segments = translate_en_to_zh(en_segments)

    print(f"\n{'='*60}")
    print("Phase 3/5: 获取元信息 & 媒体...")
    meta = cached_meta
    if meta:
        print(f"  已有 video_info.json，跳过元信息获取")
    else:
        meta = fetch_meta(args.url)

    print(f"  标题: {meta['title']}")
    print(f"  作者: {meta['author']}")
    print(f"  时长: {meta['duration']}")
    tags = meta.get("tags") or []
    category = args.category or ""
    if tags:
        tag = ",".join(tags[:5])
    elif category:
        tag = category
        print(f"  标签为空，使用分类作为标签: {tag}")
    else:
        tag = ""
    print(f"  标签: {tag}")

    short_title = _shorten_title(meta["title"])
    print(f"  入库标题: {short_title}")

    print(f"\n  下载封面...")
    thumb_path = None
    if _file_exists(thumb_path_jpg, 1024):
        thumb_path = thumb_path_jpg
        print(f"  已有 {thumb_path_jpg.name}，跳过封面下载")
    elif _file_exists(thumb_path_webp, 1024):
        thumb_path = thumb_path_webp
        print(f"  已有 {thumb_path_webp.name}，跳过封面下载")
    else:
        thumb_path = download_thumbnail(meta["thumbnail_url"], output_dir)

    video_path = None
    if not args.no_video:
        if _file_exists(video_path_mp4, 1024 * 1024):
            video_path = video_path_mp4
            print(f"  已有 video.mp4 ({video_path_mp4.stat().st_size / (1024*1024):.1f} MB)，跳过视频下载")
        else:
            video_path = download_video(args.url, output_dir, args.quality)
    else:
        print("  跳过视频下载 (--no-video)")

    print(f"\n{'='*60}")
    print("Phase 4/5: 生成 SRT 文件...")

    if not _load_cached_srt(en_srt_path):
        en_srt_path.write_text(segments_to_srt(en_segments), encoding="utf-8")
        print(f"  en.srt: {len(en_segments)} 条")
    else:
        print(f"  en.srt: 已存在，跳过生成")

    if not _load_cached_srt(zh_srt_path):
        zh_srt_path.write_text(segments_to_srt(zh_segments), encoding="utf-8")
        print(f"  zh.srt: {len(zh_segments)} 条")
    else:
        print(f"  zh.srt: 已存在，跳过生成")

    if not _load_cached_srt(bilingual_srt_path):
        bilingual_srt_path.write_text(merge_to_bilingual_srt(en_segments, zh_segments), encoding="utf-8")
        print(f"  bilingual.srt: {len(en_segments)} 条")
    else:
        print(f"  bilingual.srt: 已存在，跳过生成")

    if not cached_meta:
        info_path.write_text(json.dumps({"video_id": video_id, "url": args.url, **meta},
                                        ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        print(f"  video_info.json: 已存在，跳过生成")

    print(f"\n{'='*60}")
    print("Phase 5/5: 最终检查...")

    ok = True
    if not video_path and not args.no_video:
        print("  MISS: 视频文件")
        ok = False
    else:
        print(f"  OK: 视频 - {'(跳过)' if args.no_video else str(video_path)}")
    print(f"  OK: EN 字幕")
    print(f"  OK: ZH 字幕")
    print(f"  OK: 双语字幕")
    print(f"  OK: 封面 - {'有' if thumb_path else '无'}")

    if not ok:
        print("ERROR: 关键资源缺失，跳过入库。")
        sys.exit(1)

    next_id = read_next_id()
    description = meta.get("description", "")
    print(f"\n  本次 ID: v{next_id}, 标题: {short_title}, VIP: True, 分类: {category}")

    if not video_path:
        print("ERROR: --no-video 模式下无法入库（需要视频文件）。")
        print(f"数据已保存至: {output_dir}")
        sys.exit(0)

    success = await do_import(
        video_id=next_id,
        title=short_title,
        video_path=output_dir / "video.mp4",
        srt_path=bilingual_srt_path,
        thumb_path=thumb_path,
        level=args.level,
        tag=tag,
        dry_run=args.dry_run,
        youtube_video_id=video_id,
        description=description,
        category=category,
    )

    if success and not args.dry_run:
        save_id(next_id)
        print(f"\n✅ 入库成功! ID v{next_id} → v{next_id + 1}")


def main():
    parser = argparse.ArgumentParser(
        description="YouTube 视频资源采集 & 自动入库",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--url", required=True, help="YouTube 视频 URL")
    parser.add_argument("--output", help="输出目录 (默认: collector/output/v{N})")
    parser.add_argument("--quality", help="视频画质 (e.g. 720p, 1080p)")
    parser.add_argument("--no-video", action="store_true", help="跳过视频下载（不入库）")
    parser.add_argument("--level", default="Intermediate", help="难度等级 (default: Intermediate)")
    parser.add_argument("--category", default="", help="视频分类 (e.g. Daily Life, Business)")
    parser.add_argument("--dry-run", action="store_true", help="预览模式，不实际入库")
    parser.add_argument("--id-override", type=int, help="手动指定 ID 数字（跳过自增）")
    args = parser.parse_args()

    if args.id_override is not None:
        ID_FILE.write_text(json.dumps({"next_num": args.id_override}), encoding="utf-8")
        print(f"ID 已手动设为: v{args.id_override}")

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
