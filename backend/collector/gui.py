"""
YouTube 视频采集 GUI 工具。

提供图形界面填写采集参数（URL、分类、等级等），一键触发采集 & 入库流程。

用法:
    python -m collector.gui
    python collector/gui.py
"""

import asyncio
import json
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from pathlib import Path

COLLECTOR_DIR = Path(__file__).resolve().parent
PROJECT_DIR = COLLECTOR_DIR.parent
ID_FILE = COLLECTOR_DIR / ".last_id"

sys.path.insert(0, str(PROJECT_DIR))


class CollectorApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("LinguistTube - YouTube 视频采集工具")
        self.root.geometry("740x680")
        self.root.resizable(True, True)
        self.root.minsize(640, 540)

        self._running = False
        self._build_ui()
        self._load_defaults()

    def _build_ui(self):
        # 标签页容器
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=8, pady=(8, 0))

        # ---- Tab 1: 视频采集 ----
        self._build_collect_tab()

        # ---- Tab 2: 视频管理 ----
        self._build_manage_tab()

        # ---- 共享日志区域 ----
        log_frame = ttk.LabelFrame(self.root, text="日志输出", padding=4)
        log_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        self.log_text = scrolledtext.ScrolledText(log_frame, height=12, wrap=tk.WORD, font=("Consolas", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        btn_row = ttk.Frame(log_frame)
        btn_row.pack(fill=tk.X, pady=(4, 0))
        ttk.Button(btn_row, text="清空日志", command=self._clear_log).pack(side=tk.RIGHT)

    def _build_collect_tab(self):
        tab = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(tab, text="视频采集")

        row = 0

        ttk.Label(tab, text="YouTube URL:").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.url_var = tk.StringVar()
        url_entry = ttk.Entry(tab, textvariable=self.url_var, width=60)
        url_entry.grid(row=row, column=1, sticky=tk.EW, pady=4, padx=(8, 0))
        tab.columnconfigure(1, weight=1)

        row += 1
        ttk.Label(tab, text="分类 (Category):").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.category_var = tk.StringVar()
        category_combo = ttk.Combobox(
            tab, textvariable=self.category_var, width=30,
            values=["News", "Vlog", "Travel", "TED", "Movie", "Education"],
        )
        category_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        ttk.Label(tab, text="难度等级 (Level):").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.level_var = tk.StringVar(value="Intermediate")
        level_combo = ttk.Combobox(
            tab, textvariable=self.level_var, width=20,
            values=["Beginner", "Intermediate", "Advanced"],
            state="readonly",
        )
        level_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        ttk.Label(tab, text="视频画质:").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.quality_var = tk.StringVar(value="720p")
        quality_combo = ttk.Combobox(
            tab, textvariable=self.quality_var, width=20,
            values=["best", "1080p", "720p", "480p", "360p"],
            state="readonly",
        )
        quality_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        self.vip_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(tab, text="VIP 视频", variable=self.vip_var).grid(
            row=row, column=0, sticky=tk.W, pady=4)

        self.no_video_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(tab, text="跳过视频下载", variable=self.no_video_var).grid(
            row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        self.dry_run_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(tab, text="预览模式 (Dry Run)", variable=self.dry_run_var).grid(
            row=row, column=0, columnspan=2, sticky=tk.W, pady=4)

        row += 1
        ttk.Label(tab, text="英文字幕采集方式:").grid(row=row, column=0, sticky=tk.W, pady=4)
        en_frame = ttk.Frame(tab)
        en_frame.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))
        self.en_method_var = tk.StringVar(value="whisperx")
        ttk.Radiobutton(en_frame, text="WhisperX (本地高精度转写)", variable=self.en_method_var,
                        value="whisperx").pack(side=tk.LEFT, padx=(0, 8))
        ttk.Radiobutton(en_frame, text="YouTube ASR (yt-dlp, 快速)", variable=self.en_method_var,
                        value="ytdlp").pack(side=tk.LEFT)

        row += 1
        id_frame = ttk.Frame(tab)
        id_frame.grid(row=row, column=0, columnspan=2, sticky=tk.EW, pady=4)
        self.id_label = ttk.Label(id_frame, text="下一个 ID: v?")
        self.id_label.pack(side=tk.LEFT)
        ttk.Button(id_frame, text="刷新 ID", command=self._refresh_id).pack(side=tk.LEFT, padx=8)
        ttk.Button(id_frame, text="重置 ID", command=self._reset_id).pack(side=tk.LEFT)

        row += 1
        btn_frame = ttk.Frame(tab)
        btn_frame.grid(row=row, column=0, columnspan=2, sticky=tk.EW, pady=12)
        self.start_btn = ttk.Button(btn_frame, text="🚀 开始采集", command=self._start_collect)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 8))
        self.stop_btn = ttk.Button(btn_frame, text="⏹ 停止", command=self._stop_collect, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT)

    def _build_manage_tab(self):
        tab = ttk.Frame(self.notebook, padding=12)
        self.notebook.add(tab, text="视频管理")

        # --- 删除视频 ---
        del_frame = ttk.LabelFrame(tab, text="删除视频（支持批量，每行一个 ID 或用逗号分隔）", padding=8)
        del_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 12))

        self.delete_ids_text = tk.Text(del_frame, height=6, width=50, font=("Consolas", 10))
        self.delete_ids_text.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

        del_btn_row = ttk.Frame(del_frame)
        del_btn_row.pack(fill=tk.X)
        ttk.Button(del_btn_row, text="删除以上所有视频及关联数据", command=self._delete_video).pack(side=tk.LEFT)
        ttk.Label(del_frame, text="删除：R2视频/封面 + 数据库字幕/打卡/收藏/历史/轮播图",
                  foreground="gray").pack(anchor=tk.W, pady=(4, 0))

        # --- 提升轮播图 ---
        carousel_frame = ttk.LabelFrame(tab, text="提升到轮播图", padding=8)
        carousel_frame.pack(fill=tk.X)

        row1 = ttk.Frame(carousel_frame)
        row1.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(row1, text="视频 ID:").pack(side=tk.LEFT)
        self.carousel_id_var = tk.StringVar()
        ttk.Entry(row1, textvariable=self.carousel_id_var, width=20).pack(side=tk.LEFT, padx=(8, 8))

        row2 = ttk.Frame(carousel_frame)
        row2.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(row2, text="副标题:").pack(side=tk.LEFT)
        self.carousel_subtitle_var = tk.StringVar()
        ttk.Entry(row2, textvariable=self.carousel_subtitle_var, width=40).pack(side=tk.LEFT, padx=(8, 8))

        row3 = ttk.Frame(carousel_frame)
        row3.pack(fill=tk.X)
        ttk.Button(row3, text="添加到轮播图", command=self._promote_carousel).pack(side=tk.LEFT)
        ttk.Label(carousel_frame, text="自动从视频记录中取标题、封面、标签等信息",
                  foreground="gray").pack(anchor=tk.W, pady=(4, 0))

        # --- 生成注册卡密 ---
        key_frame = ttk.LabelFrame(tab, text="生成注册卡密", padding=8)
        key_frame.pack(fill=tk.X, pady=(12, 0))

        row1 = ttk.Frame(key_frame)
        row1.pack(fill=tk.X, pady=(0, 4))
        ttk.Label(row1, text="有效期 (天):").pack(side=tk.LEFT)
        self.key_days_var = tk.StringVar(value="365")
        ttk.Entry(row1, textvariable=self.key_days_var, width=10).pack(side=tk.LEFT, padx=(8, 0))

        row2 = ttk.Frame(key_frame)
        row2.pack(fill=tk.X)
        ttk.Button(row2, text="生成卡密", command=self._generate_key).pack(side=tk.LEFT)

    def _load_defaults(self):
        self._refresh_id()

    def _refresh_id(self):
        try:
            if ID_FILE.exists():
                data = json.loads(ID_FILE.read_text(encoding="utf-8"))
                next_num = data.get("next_num", 1)
            else:
                next_num = 1
            self.id_label.config(text=f"下一个 ID: v{next_num}")
        except Exception:
            self.id_label.config(text="下一个 ID: v?")

    def _reset_id(self):
        from tkinter import simpledialog
        result = simpledialog.askinteger("重置 ID", "请输入新的 ID 数字:", initialvalue=6, parent=self.root)
        if result is not None:
            ID_FILE.write_text(json.dumps({"next_num": result}), encoding="utf-8")
            self._refresh_id()

    def _log(self, msg: str):
        self.log_text.insert(tk.END, msg + "\n")
        self.log_text.see(tk.END)

    def _clear_log(self):
        self.log_text.delete("1.0", tk.END)

    def _parse_ids(self, text: str) -> list[str]:
        """从文本中解析视频 ID 列表。支持每行一个或用逗号/空格分隔。"""
        ids = []
        for part in text.replace(",", "\n").replace(" ", "\n").split("\n"):
            part = part.strip()
            if part:
                ids.append(part)
        return ids

    def _delete_video(self):
        raw = self.delete_ids_text.get("1.0", tk.END).strip()
        video_ids = self._parse_ids(raw)
        if not video_ids:
            messagebox.showwarning("提示", "请输入要删除的视频 ID")
            return

        id_list = "\n".join(f"  - {v}" for v in video_ids)
        msg = (
            f"确认删除以下 {len(video_ids)} 个视频及其所有关联数据？\n\n"
            f"{id_list}\n\n"
            f"将删除：\n"
            f"  - R2: 视频文件、封面图\n"
            f"  - 数据库: 字幕、打卡、收藏、观看历史、轮播图等\n\n"
            f"此操作不可撤销！"
        )
        if not messagebox.askyesno("确认批量删除", msg):
            return

        self._log(f"\n{'='*50}")
        self._log(f"开始批量删除 {len(video_ids)} 个视频")
        for v in video_ids:
            self._log(f"  - {v}")

        thread = threading.Thread(target=self._run_delete_batch, args=(video_ids,), daemon=True)
        thread.start()

    def _run_delete_batch(self, video_ids: list[str]):
        result = None
        try:
            from services.admin_service import delete_video_batch
            from core.database import dispose_engine

            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(delete_video_batch(video_ids))
            finally:
                loop.run_until_complete(dispose_engine())
                loop.close()

            self._log(f"\n  批量删除结果: {result['success']}/{result['total']} 成功, "
                      f"{result['not_found']} 不存在, {result['failed']} 失败")
            for r in result["results"]:
                vid = r["video_id"]
                if not r.get("found"):
                    self._log(f"  ✗ {vid}: 未找到或出错")
                else:
                    total_db = sum(r.get("db_records", {}).values())
                    self._log(f"  ✓ {vid}: R2 {len(r.get('r2_files', []))} 个文件, DB {total_db} 条记录")
            self._log(f"\n  批量删除完成!")
        except Exception as e:
            self._log(f"\n  批量删除出错: {e}")
            import traceback
            self._log(traceback.format_exc())

    def _promote_carousel(self):
        video_id = self.carousel_id_var.get().strip()
        if not video_id:
            messagebox.showwarning("提示", "请输入视频 ID")
            return

        subtitle = self.carousel_subtitle_var.get().strip()
        msg = (
            f"确认将视频 {video_id} 添加到轮播图？\n\n"
            f"副标题: {subtitle or '(空)'}\n\n"
            f"轮播图标题、封面、标签将从视频记录中自动获取。"
        )
        if not messagebox.askyesno("确认添加轮播图", msg):
            return

        self._log(f"\n{'='*50}")
        self._log(f"添加轮播图: {video_id}")

        thread = threading.Thread(target=self._run_promote_carousel, args=(video_id, subtitle), daemon=True)
        thread.start()

    def _run_promote_carousel(self, video_id: str, subtitle: str):
        result = None
        try:
            from services.admin_service import promote_to_carousel
            from core.database import dispose_engine

            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(promote_to_carousel(video_id, subtitle or None))
            finally:
                loop.run_until_complete(dispose_engine())
                loop.close()

            if not result.get("found"):
                self._log(f"  视频 {video_id} 不存在")
                return

            action = result.get("action", "")
            if action == "skip":
                self._log(f"  视频 {video_id} 已在轮播图中，跳过")
            else:
                self._log(f"  视频 {video_id} 已添加到轮播图")
        except Exception as e:
            self._log(f"\n  添加轮播图出错: {e}")
            import traceback
            self._log(traceback.format_exc())

    def _generate_key(self):
        days_text = self.key_days_var.get().strip()
        try:
            days = int(days_text) if days_text else 365
        except ValueError:
            messagebox.showwarning("提示", "请输入有效的天数")
            return

        if days < 1:
            messagebox.showwarning("提示", "天数必须大于 0")
            return

        self._log(f"\n{'='*50}")
        self._log(f"生成注册卡密 (有效期 {days} 天)...")

        thread = threading.Thread(target=self._run_generate_key, args=(days,), daemon=True)
        thread.start()

    def _run_generate_key(self, days: int):
        import asyncio
        try:
            from services.admin_service import generate_registration_key
            from core.database import dispose_engine

            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(generate_registration_key(days))
            finally:
                loop.run_until_complete(dispose_engine())
                loop.close()

            self._log(f"  卡密: {result['key']}")
            self._log(f"  过期时间: {result['expires_at']}")
            self._log(f"  有效期: {result['days_valid']} 天")
            self._log(f"\n  生成完成!")
        except Exception as e:
            self._log(f"\n  生成卡密出错: {e}")
            import traceback
            self._log(traceback.format_exc())

    def _start_collect(self):
        url = self.url_var.get().strip()
        if not url:
            messagebox.showwarning("提示", "请输入 YouTube URL")
            return

        if self._running:
            messagebox.showwarning("提示", "采集正在进行中...")
            return

        self._running = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)

        self._log(f"开始采集: {url}")
        self._log(f"分类: {self.category_var.get()}, 等级: {self.level_var.get()}, 画质: {self.quality_var.get()}")

        thread = threading.Thread(target=self._run_collect, daemon=True)
        thread.start()

    def _stop_collect(self):
        self._running = False
        self._log("用户请求停止...")

    def _run_collect(self):
        try:
            from collector.collect import (
                _check_deps, extract_video_id, read_next_id, save_id,
                translate_en_to_zh,
                fetch_meta, download_thumbnail, download_video,
                normalize_segments, clean_text, segments_to_srt, merge_to_bilingual_srt,
                fetch_word_level_transcript, synthesize_segments_from_word_level, do_import,
                _file_exists, _load_cached_srt, _load_cached_meta, _parse_srt_segments,
                _shorten_title,
                OUTPUT_BASE,
            )

            _check_deps()

            url = self.url_var.get().strip()
            category = self.category_var.get().strip()
            level = self.level_var.get()
            quality = self.quality_var.get()
            no_video = self.no_video_var.get()
            dry_run = self.dry_run_var.get()

            video_id = extract_video_id(url)
            self._log(f"YouTube Video ID: {video_id}")

            next_id = read_next_id()
            output_dir = OUTPUT_BASE / f"v{next_id}"
            output_dir.mkdir(parents=True, exist_ok=True)
            self._log(f"输出目录: {output_dir}")

            info_path = output_dir / "video_info.json"
            en_srt_path = output_dir / "en.srt"
            zh_srt_path = output_dir / "zh.srt"
            bilingual_srt_path = output_dir / "bilingual.srt"
            thumb_path_jpg = output_dir / "thumbnail.jpg"
            thumb_path_webp = output_dir / "thumbnail.webp"
            video_path_mp4 = output_dir / "video.mp4"

            cached_meta = _load_cached_meta(info_path, video_id)

            self._log("\nPhase 1/5: 英文字幕...")
            en_segments = None
            en_words_segments = None
            if _load_cached_srt(en_srt_path):
                self._log("  已有 en.srt，跳过英文字幕获取")
                en_segments = _parse_srt_segments(en_srt_path)
            else:
                en_words_segments = fetch_word_level_transcript(video_id, "en", method=self.en_method_var.get())
                if not en_words_segments:
                    self._log("ERROR: 该视频没有英文词级字幕，无法继续。")
                    return
                self._log(f"  EN 词级字幕: {len(en_words_segments)} 段")
                en_segments = synthesize_segments_from_word_level(en_words_segments, "en")
                self._log(f"  合成 EN segments: {len(en_segments)} 条")

            self._log("\nPhase 2/5: 中文字幕 (EN→ZH 翻译)...")
            zh_segments = None
            if _load_cached_srt(zh_srt_path):
                self._log("  已有 zh.srt，跳过中文字幕获取")
                zh_segments = _parse_srt_segments(zh_srt_path)
            else:
                self._log("  启动 EN→ZH 翻译...")
                zh_segments = translate_en_to_zh(en_segments)

            self._log("\nPhase 3/5: 获取元信息 & 媒体...")
            meta = cached_meta
            if meta:
                self._log("  已有 video_info.json，跳过元信息获取")
            else:
                meta = fetch_meta(url)

            self._log(f"  标题: {meta['title']}")
            self._log(f"  作者: {meta['author']}")
            self._log(f"  时长: {meta['duration']}")
            tags = meta.get("tags") or []
            if tags:
                tag = ",".join(tags[:3])
            elif category:
                tag = category
                self._log(f"  标签为空，使用分类作为标签: {tag}")
            else:
                tag = ""

            short_title = _shorten_title(meta["title"])
            self._log(f"  入库标题: {short_title}")

            self._log("  下载封面...")
            thumb_path = None
            if _file_exists(thumb_path_jpg, 1024):
                thumb_path = thumb_path_jpg
                self._log(f"  已有 {thumb_path_jpg.name}，跳过封面下载")
            elif _file_exists(thumb_path_webp, 1024):
                thumb_path = thumb_path_webp
                self._log(f"  已有 {thumb_path_webp.name}，跳过封面下载")
            else:
                thumb_path = download_thumbnail(meta["thumbnail_url"], output_dir)

            video_path = None
            if not no_video:
                if _file_exists(video_path_mp4, 1024 * 1024):
                    video_path = video_path_mp4
                    self._log(f"  已有 video.mp4 ({video_path_mp4.stat().st_size / (1024*1024):.1f} MB)，跳过视频下载")
                else:
                    video_path = download_video(url, output_dir, quality)
            else:
                self._log("  跳过视频下载")

            self._log("\nPhase 4/5: 生成 SRT 文件...")
            en_normalized = normalize_segments(en_segments)
            zh_normalized = normalize_segments(zh_segments)

            if not _load_cached_srt(en_srt_path):
                en_srt_path.write_text(segments_to_srt(en_normalized), encoding="utf-8")
            else:
                self._log("  en.srt: 已存在，跳过生成")

            if not _load_cached_srt(zh_srt_path):
                zh_srt_path.write_text(segments_to_srt(zh_normalized), encoding="utf-8")
            else:
                self._log("  zh.srt: 已存在，跳过生成")

            en_words_path = output_dir / "en.words.json"

            if not en_words_path.exists() and en_words_segments:
                en_words_path.write_text(json.dumps(en_words_segments, ensure_ascii=False), encoding="utf-8")
                self._log(f"  en.words.json: {len(en_words_segments)} 段")
            elif en_words_path.exists():
                self._log("  en.words.json: 已存在，跳过生成")

            if not _load_cached_srt(bilingual_srt_path):
                bilingual_srt_path.write_text(merge_to_bilingual_srt(en_normalized, zh_normalized), encoding="utf-8")
            else:
                self._log("  bilingual.srt: 已存在，跳过生成")

            if not cached_meta:
                info_path.write_text(json.dumps({"video_id": video_id, "url": url, **meta},
                                                ensure_ascii=False, indent=2), encoding="utf-8")
            else:
                self._log("  video_info.json: 已存在，跳过生成")

            self._log(f"  SRT 文件检查完成")

            self._log("\nPhase 5/5: 最终检查...")
            if not video_path and not no_video:
                self._log("ERROR: 视频文件缺失，跳过入库。")
                return

            if not video_path:
                self._log("INFO: --no-video 模式，数据已保存但未入库。")
                return

            description = meta.get("description", "")
            self._log(f"\n准备入库: v{next_id} - {short_title}")

            confirmed = threading.Event()
            confirm_result = [False]

            def _ask_confirm():
                en_count = len([s for s in en_normalized if clean_text(s["text"])])
                zh_count = len([s for s in zh_normalized if clean_text(s["text"])])
                msg = (
                    f"确认入库以下内容？\n\n"
                    f"ID: v{next_id}\n"
                    f"标题: {short_title}\n"
                    f"分类: {category or '(未指定)'}\n"
                    f"等级: {level}\n"
                    f"EN 字幕: {en_count} 条\n"
                    f"ZH 字幕: {zh_count} 条\n"
                    f"视频文件: video.mp4\n\n"
                    f"点击「是」确认入库，点击「否」取消。"
                )
                confirm_result[0] = messagebox.askyesno("确认入库", msg)
                confirmed.set()

            self.root.after(0, _ask_confirm)
            confirmed.wait()

            if not confirm_result[0]:
                self._log("用户取消入库。")
                return

            self._log(f"\n执行入库: v{next_id} - {short_title}")

            loop = asyncio.new_event_loop()
            try:
                success = loop.run_until_complete(
                    do_import(
                        video_id=next_id,
                        title=short_title,
                        video_path=output_dir / "video.mp4",
                        srt_path=bilingual_srt_path,
                        thumb_path=thumb_path,
                        level=level,
                        tag=tag,
                        dry_run=dry_run,
                        youtube_video_id=video_id,
                        description=description,
                        category=category,
                        en_words_path=en_words_path,
                    )
                )
            finally:
                from core.database import dispose_engine
                loop.run_until_complete(dispose_engine())
                loop.close()

            if success and not dry_run:
                save_id(next_id)
                self._log(f"\n✅ 入库成功! ID v{next_id} → v{next_id + 1}")
                self.root.after(0, self._refresh_id)
            elif dry_run:
                self._log("\n[DRY-RUN] 预览完成，未实际入库。")
            else:
                self._log("\n❌ 入库失败，请检查日志。")

        except Exception as e:
            self._log(f"\n❌ 采集出错: {e}")
            import traceback
            self._log(traceback.format_exc())
        finally:
            self._running = False
            self.root.after(0, lambda: self.start_btn.config(state=tk.NORMAL))
            self.root.after(0, lambda: self.stop_btn.config(state=tk.DISABLED))


def main():
    root = tk.Tk()
    app = CollectorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
