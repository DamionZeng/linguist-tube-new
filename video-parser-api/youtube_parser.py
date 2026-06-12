"""
YouTube 视频解析模块。

功能:
  1. 提取视频 ID
  2. 获取英文字幕 (词级)
  3. 翻译 EN→ZH
  4. 获取视频元信息
  5. 下载视频/缩略图
  6. 生成 SRT / 双语 SRT
"""

import json
import os
import re
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from typing import Optional

from config import get_settings


def _yt_player_clients() -> list[str]:
    """返回 yt-dlp player_client 列表，支持通过环境变量 YT_PLAYER_CLIENTS 配置"""
    settings = get_settings()
    return [c.strip() for c in settings.yt_player_clients.split(",") if c.strip()]


def _yt_cookies_opts() -> dict:
    """返回 yt-dlp cookies 选项（如果配置了 cookies 文件）"""
    settings = get_settings()
    if settings.yt_cookies_file and os.path.isfile(settings.yt_cookies_file):
        return {"cookiefile": settings.yt_cookies_file}
    return {}


def _yt_base_opts() -> dict:
    """返回 yt-dlp 通用反反爬选项（http headers、代理、延迟等）"""
    settings = get_settings()
    opts = {
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "socket_timeout": 30,
        "retries": 5,
        "fragment_retries": 5,
        "extractor_retries": 5,
        "file_access_retries": 5,
        "sleep_requests": 1.0,
        "sleep_interval": 2.0,
        "max_sleep_interval": 5.0,
    }
    if settings.yt_proxy:
        opts["proxy"] = settings.yt_proxy
    return opts


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
    raise ValueError(f"无法从 URL 提取视频 ID: {url}")


# ═══════════════════════════  字幕解析 (WhisperX)  ═══════════════════════════

def fetch_word_level_transcript(video_id: str, lang: str = "en") -> Optional[list[dict]]:
    """
    使用 WhisperX 进行高精度词级转写。

    流程:
      1. yt-dlp 下载最佳音质音频 → 转 WAV 无损格式
      2. WhisperX 双阶段处理：ASR 转录 → Wav2Vec2 强制对齐
      3. 输出格式与 en.words.json 一致
    """
    import gc

    try:
        import whisperx
        import torch
    except ImportError:
        raise RuntimeError("whisperx 未安装，请执行 pip install whisperx")

    # --- ffmpeg 检查 ---
    ffmpeg_dir = _validate_ffmpeg()
    if not ffmpeg_dir:
        raise RuntimeError("未检测到 ffmpeg，WhisperX 依赖 ffmpeg 解码音频。安装方法: https://ffmpeg.org/download.html")
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = _download_audio_wav(video_id, tmpdir, ffmpeg_dir)
        if not audio_path:
            raise RuntimeError("音频下载失败")

        # --- 硬件检测 ---
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            compute_type = "float16"
            batch_size = 16
            print(f"  WhisperX: 检测到 GPU，使用 CUDA + float16")
        else:
            compute_type = "int8"
            batch_size = 4
            print(f"  WhisperX: CPU 模式，使用 int8 量化加速")

        try:
            # --- Stage 1: 加载音频 ---
            print(f"  WhisperX: 加载音频 {Path(audio_path).name} ...")
            audio = whisperx.load_audio(audio_path)

            # --- Stage 2: ASR 转录 ---
            print(f"  WhisperX: 加载 ASR 模型 (base) ...")
            asr_model = whisperx.load_model(
                "base", device, compute_type=compute_type, language=lang
            )
            print(f"  WhisperX: 开始转录 ...")
            result = asr_model.transcribe(audio, batch_size=batch_size)
            detected_lang = result.get("language", lang)
            print(f"  WhisperX: 转录完成，检测语种: {detected_lang}，{len(result.get('segments', []))} 个片段")

            # --- Stage 3: 强制对齐 (Wav2Vec2) ---
            print(f"  WhisperX: 加载对齐模型 (语种: {detected_lang}) ...")
            align_model, align_metadata = whisperx.load_align_model(
                language_code=detected_lang, device=device
            )
            result_aligned = whisperx.align(
                result["segments"], align_model, align_metadata,
                audio, device, return_char_alignments=False,
            )
            print(f"  WhisperX: 对齐完成")

            # --- 清理 GPU 内存 ---
            del asr_model
            del align_model
            gc.collect()
            if device == "cuda":
                torch.cuda.empty_cache()

            # --- 转换为词级片段格式 ---
            segments = _whisperx_to_word_segments(result_aligned)
            print(f"  WhisperX: 生成 {len(segments)} 个词级片段")
            return segments

        except Exception as e:
            raise RuntimeError(f"WhisperX 转写异常: {e}")
        finally:
            try:
                os.unlink(audio_path)
            except Exception:
                pass


def _locate_ffmpeg() -> Optional[str]:
    """动态查找 ffmpeg 可执行文件，兼容 Windows 和 Linux"""
    import shutil as _shutil

    # 1) 先尝试 PATH（Linux 通常 apt install ffmpeg 后就在 PATH 中）
    ffmpeg_path = _shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path

    # 2) Windows: 搜索常见安装位置
    if sys.platform == "win32":
        search_dirs = [
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"),
            os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links"),
            os.path.expandvars(r"%ProgramFiles%\ffmpeg"),
            os.path.expandvars(r"%ProgramFiles(x86)%\ffmpeg"),
            r"C:\ffmpeg",
        ]
        for base in search_dirs:
            try:
                for root, dirs, files in os.walk(base):
                    for f in files:
                        if f.lower() in ("ffmpeg.exe", "ffprobe.exe"):
                            return os.path.join(root, f)
                    if len(list(os.walk(base))) > 50:
                        break
            except (PermissionError, OSError):
                continue

    # 3) Linux: 搜索常见安装位置
    else:
        linux_paths = [
            "/usr/bin/ffmpeg",
            "/usr/local/bin/ffmpeg",
            "/snap/bin/ffmpeg",
            os.path.expanduser("~/bin/ffmpeg"),
            os.path.expanduser("~/.local/bin/ffmpeg"),
        ]
        for p in linux_paths:
            if os.path.isfile(p) and os.access(p, os.X_OK):
                return p

    return None


def _validate_ffmpeg() -> Optional[str]:
    """检查 ffmpeg 是否可用，返回所在目录路径"""
    import subprocess as _sp

    ffmpeg_path = _locate_ffmpeg()
    if not ffmpeg_path:
        return None
    try:
        _sp.run([ffmpeg_path, "-version"], capture_output=True, timeout=5, check=True)
        return os.path.dirname(ffmpeg_path)
    except Exception:
        return None


def _check_youtube_reachable():
    """诊断网络连通性：测试 YouTube 是否可达"""
    import urllib.request as _ur
    import socket as _sock

    print(f"  === 网络诊断 ===")

    # 1. DNS 解析
    try:
        ip = _sock.gethostbyname("www.youtube.com")
        print(f"  DNS 解析 www.youtube.com -> {ip}")
    except Exception as e:
        print(f"  DNS 解析失败: {e}")

    # 2. 代理状态
    settings = get_settings()
    print(f"  代理配置: {'已设置' if settings.yt_proxy else '未设置'}")
    if settings.yt_proxy:
        print(f"  代理地址: {settings.yt_proxy[:50]}...")

    # 3. HTTP 连通性测试
    for test_url, label in [
        ("https://www.youtube.com", "YouTube 主页"),
        ("https://www.google.com", "Google 主页"),
    ]:
        try:
            req = _ur.Request(test_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
            })
            if settings.yt_proxy:
                proxy_handler = _ur.ProxyHandler({
                    "https": settings.yt_proxy,
                    "http": settings.yt_proxy,
                })
                opener = _ur.build_opener(proxy_handler)
                resp = opener.open(req, timeout=10)
            else:
                resp = _ur.urlopen(req, timeout=10)
            print(f"  {label} 可达 (HTTP {resp.status})")
        except Exception as e:
            print(f"  {label} 不可达: {type(e).__name__}: {e}")

    # 4. yt-dlp 提取测试（轻量级，不下载）
    try:
        import yt_dlp
        print(f"  yt-dlp 版本: {yt_dlp.version.__version__}")
    except Exception:
        pass


def _download_audio_wav(video_id: str, tmpdir: str, ffmpeg_dir: str) -> Optional[str]:
    """用 yt-dlp 下载最高音质音频并转为 WAV"""
    import yt_dlp
    import traceback as _tb

    # --- 诊断: 网络连通性预检 ---
    _check_youtube_reachable()

    output_template = str(Path(tmpdir) / "audio")
    opts = {
        **_yt_base_opts(),
        "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
        "format_sort": ["+size", "+br", "+res", "+fps"],
        "extractor_args": {"youtube": {"player_client": _yt_player_clients()}},
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "0",
        }],
        "ffmpeg_location": ffmpeg_dir,
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "force_ipv4": True,
        **_yt_cookies_opts(),
    }

    last_error = None
    for attempt in range(3):
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
            break
        except Exception as e:
            last_error = e
            if attempt < 2:
                wait = (attempt + 1) * 3
                print(f"  WhisperX: 下载失败 (尝试 {attempt+1}/3): {e}")
                print(f"  WhisperX: {wait}s 后重试...")
                import time as _time
                _time.sleep(wait)
                for p in Path(tmpdir).glob("audio*"):
                    try:
                        p.unlink()
                    except Exception:
                        pass
            else:
                print(f"  WhisperX: yt-dlp 音频下载失败 (3次均失败)")
                print(f"  WhisperX: 异常类型: {type(e).__name__}")
                print(f"  WhisperX: 异常消息: {e}")
                print(f"  WhisperX: 完整堆栈:\n{''.join(_tb.format_tb(e.__traceback__))}")
                return None

    for f in Path(tmpdir).glob("audio.*"):
        return str(f)
    for f in Path(tmpdir).glob("audio*"):
        return str(f)
    return None


def _whisperx_to_word_segments(aligned_result: dict) -> list[dict]:
    """
    将 WhisperX 对齐结果转换为词级片段格式:
      [
        {"start": seg_start, "end": seg_end, "words": [
          {"text": "word", "start": w_start, "end": w_end}, ...
        ]},
        ...
      ]
    """
    segments = []
    for seg in aligned_result.get("segments", []):
        words = seg.get("words", [])
        if not words:
            continue
        word_list = []
        for w in words:
            w_text = w.get("word", "").strip()
            if not w_text:
                continue
            w_start = w.get("start")
            w_end = w.get("end")
            if w_start is None or w_end is None:
                continue
            word_list.append({
                "text": w_text,
                "start": round(w_start, 3),
                "end": round(w_end, 3),
            })
        if not word_list:
            continue
        segments.append({
            "start": round(word_list[0]["start"], 3),
            "end": round(word_list[-1]["end"], 3),
            "words": word_list,
        })
    return segments


def synthesize_segments_from_word_level(word_segments: list[dict], lang: str = "en") -> list[dict]:
    result = []
    for ws in word_segments:
        words = ws.get("words", [])
        if not words:
            continue
        if lang.startswith("zh"):
            text = "".join(w["text"] for w in words)
        else:
            text = " ".join(w["text"] for w in words)
        start = ws["start"]
        end = ws["end"]
        duration = end - start
        if duration <= 0:
            continue
        result.append({"start": start, "duration": duration, "text": text})
    return result


# ═══════════════════════════  翻译  ═══════════════════════════

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
            all_translated.extend([""] * (chunk.count("|||") + 1))
            time.sleep(2)

    for i, seg in enumerate(en_segments):
        zh_segments.append({
            "start": seg["start"],
            "duration": seg["duration"],
            "text": all_translated[i] if i < len(all_translated) else "",
        })

    print(f"  ZH 字幕 (翻译): {len(zh_segments)} 条")
    return zh_segments


# ═══════════════════════════  元信息  ═══════════════════════════

def fetch_meta(url: str) -> dict:
    import yt_dlp

    opts = {
        **_yt_base_opts(),
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "extractor_args": {"youtube": {"player_client": _yt_player_clients()}},
        "force_ipv4": True,
        **_yt_cookies_opts(),
    }
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


# ═══════════════════════════  下载  ═══════════════════════════

def download_thumbnail(thumbnail_url: str) -> Optional[tuple[bytes, str]]:
    """下载缩略图，返回 (bytes, ext) 或 None"""
    if not thumbnail_url:
        return None
    try:
        ext = "webp" if "webp" in thumbnail_url else "jpg"
        req = urllib.request.Request(thumbnail_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
        if len(data) < 100:
            return None
        print(f"  封面已下载: {len(data)} bytes")
        return (data, ext)
    except Exception as e:
        print(f"  WARNING: 封面下载失败: {e}")
        return None


def download_video(url: str, quality: Optional[str] = None) -> Optional[tuple[bytes, str]]:
    """下载视频到临时文件，返回 (bytes, ext) 或 None"""
    import yt_dlp

    with tempfile.TemporaryDirectory() as tmpdir:
        outtmpl = str(Path(tmpdir) / "video")
        h = int(quality[:-1]) if quality else None

        formats_to_try = []
        if h:
            formats_to_try.append(
                f"best[ext=mp4][height<={h}]/best[ext=mp4]/best[height<={h}]/best"
            )
            formats_to_try.append(
                f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
            )
        else:
            formats_to_try.append("best[ext=mp4]/best")
            formats_to_try.append("bestvideo+bestaudio/best")

        for i, fmt in enumerate(formats_to_try):
            need_merge = "+" in fmt
            opts = {
                **_yt_base_opts(),
                "outtmpl": outtmpl,
                "format": fmt,
                "no_warnings": True,
                "extractor_args": {"youtube": {"player_client": _yt_player_clients()}},
                "force_ipv4": True,
                **_yt_cookies_opts(),
            }
            if need_merge:
                opts["merge_output_format"] = "mp4"
            if i > 0:
                opts["overwrites"] = True

            print(f"  正在下载视频... (尝试 {i+1}/{len(formats_to_try)})")
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    ydl.download([url])

                for f in Path(tmpdir).glob("video.*"):
                    data = f.read_bytes()
                    ext = f.suffix.lstrip(".")
                    print(f"  视频已下载: {len(data) / (1024*1024):.1f} MB")
                    return (data, ext)
            except Exception as e:
                print(f"  尝试 {i+1} 失败: {e}")
                continue

    print("  ERROR: 所有下载方式均失败")
    return None


# ═══════════════════════════  SRT 生成  ═══════════════════════════

_SOUND_TAGS = re.compile(
    r"\[Music\]|\[音乐\]|\[Applause\]|\[掌声\]|\[Laughter\]|\[笑声\]|"
    r"\[Background\s+Noise\]|\[背景噪音\]|\[Cheering\]|\[欢呼\]|"
    r"\[Crowd\s+Noise\]|\[人群噪音\]",
    re.IGNORECASE,
)
_LT_GT_TAGS = re.compile(r"\s*&lt;\s*\d+\s*&gt;\s*")
_ANGLE_BRACKET_TAGS = re.compile(r"\s*>>\s*")
_MULTI_SPACE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    text = _SOUND_TAGS.sub("", text)
    text = _LT_GT_TAGS.sub(" ", text)
    text = _ANGLE_BRACKET_TAGS.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text)
    return text.strip()


def normalize_segments(segments: list[dict]) -> list[dict]:
    result = []
    for i, seg in enumerate(segments):
        end = seg["start"] + seg["duration"]
        if i + 1 < len(segments):
            next_start = segments[i + 1]["start"]
            if end > next_start:
                end = next_start
        duration = end - seg["start"]
        if duration <= 0:
            continue
        result.append({"start": seg["start"], "duration": duration, "text": seg["text"]})
    return result


def _seconds_to_srt(seconds: float) -> str:
    h, r = divmod(int(seconds), 3600)
    m, s = divmod(r, 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def segments_to_srt(segments: list[dict]) -> str:
    lines = []
    idx = 0
    for seg in segments:
        text = clean_text(seg["text"])
        if not text:
            continue
        idx += 1
        lines.append(str(idx))
        lines.append(f"{_seconds_to_srt(seg['start'])} --> {_seconds_to_srt(seg['start'] + seg['duration'])}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def merge_to_bilingual_srt(en_segments: list[dict], zh_segments: list[dict]) -> str:
    count = min(len(en_segments), len(zh_segments))
    lines = []
    idx = 0
    for i in range(count):
        en = en_segments[i]
        zh = zh_segments[i]
        en_text = clean_text(en["text"])
        zh_text = clean_text(zh["text"])
        if not en_text and not zh_text:
            continue
        en_start, en_end = en["start"], en["start"] + en["duration"]
        zh_start, zh_end = zh["start"], zh["start"] + zh["duration"]
        start = min(en_start, zh_start)
        end = max(en_end, zh_end)
        idx += 1
        lines.append(str(idx))
        lines.append(f"{_seconds_to_srt(start)} --> {_seconds_to_srt(end)}")
        lines.append(f"{en_text}\n{zh_text}")
        lines.append("")
    return "\n".join(lines)


def build_transcript_entries(
    en_segments: list[dict],
    zh_segments: list[dict],
    en_words_segments: list[dict] | None = None,
) -> list[dict]:
    """构建入库用的双语字幕条目列表"""
    count = min(len(en_segments), len(zh_segments))
    entries = []
    for i in range(count):
        en_text = clean_text(en_segments[i]["text"])
        zh_text = clean_text(zh_segments[i]["text"])
        if not en_text and not zh_text:
            continue

        en_start = en_segments[i]["start"]
        en_end = en_segments[i]["start"] + en_segments[i]["duration"]
        zh_start = zh_segments[i]["start"]
        zh_end = zh_segments[i]["start"] + zh_segments[i]["duration"]
        start = min(en_start, zh_start)
        end = max(en_end, zh_end)

        words_data = {}
        if en_words_segments and i < len(en_words_segments):
            words_data["en"] = en_words_segments[i].get("words", [])

        entries.append({
            "start": _seconds_to_srt(start),
            "end": _seconds_to_srt(end),
            "en": en_text,
            "zh": zh_text,
            "words": words_data,
        })
    return entries


def fmt_duration(entries: list[dict]) -> str:
    if not entries:
        return "00:00"
    last_end = entries[-1]["end"]
    total = _time_to_seconds(last_end)
    mm = int(total) // 60
    ss = int(total) % 60
    return f"{mm:02d}:{ss:02d}"


def _time_to_seconds(t: str) -> float:
    # 清理千位分隔符 (如 "56,191" → "56191")
    t = t.replace(",", "")
    parts = t.replace(".", ":").split(":")
    if len(parts) == 4:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2]) + int(parts[3]) / 1000.0
    if len(parts) == 3:
        return int(parts[0]) * 60 + int(parts[1]) + int(parts[2]) / 1000.0
    return int(parts[0]) * 60 + int(parts[1])
