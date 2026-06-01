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
        self.root.geometry("720x640")
        self.root.resizable(True, True)
        self.root.minsize(600, 500)

        self._running = False
        self._build_ui()
        self._load_defaults()

    def _build_ui(self):
        main = ttk.Frame(self.root, padding=12)
        main.pack(fill=tk.BOTH, expand=True)

        row = 0

        ttk.Label(main, text="YouTube URL:").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.url_var = tk.StringVar()
        url_entry = ttk.Entry(main, textvariable=self.url_var, width=70)
        url_entry.grid(row=row, column=1, sticky=tk.EW, pady=4, padx=(8, 0))
        main.columnconfigure(1, weight=1)

        row += 1
        ttk.Label(main, text="分类 (Category):").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.category_var = tk.StringVar()
        category_combo = ttk.Combobox(
            main, textvariable=self.category_var, width=30,
            values=["News", "Vlog", "Travel", "Education", "Technology", "Psychology"],
        )
        category_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        ttk.Label(main, text="难度等级 (Level):").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.level_var = tk.StringVar(value="Intermediate")
        level_combo = ttk.Combobox(
            main, textvariable=self.level_var, width=20,
            values=["Beginner", "Intermediate", "Advanced"],
            state="readonly",
        )
        level_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        ttk.Label(main, text="视频画质:").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.quality_var = tk.StringVar(value="720p")
        quality_combo = ttk.Combobox(
            main, textvariable=self.quality_var, width=20,
            values=["best", "1080p", "720p", "480p", "360p"],
            state="readonly",
        )
        quality_combo.grid(row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        self.vip_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(main, text="VIP 视频", variable=self.vip_var).grid(
            row=row, column=0, sticky=tk.W, pady=4)

        self.no_video_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(main, text="跳过视频下载", variable=self.no_video_var).grid(
            row=row, column=1, sticky=tk.W, pady=4, padx=(8, 0))

        row += 1
        self.dry_run_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(main, text="预览模式 (Dry Run)", variable=self.dry_run_var).grid(
            row=row, column=0, columnspan=2, sticky=tk.W, pady=4)

        row += 1
        id_frame = ttk.Frame(main)
        id_frame.grid(row=row, column=0, columnspan=2, sticky=tk.EW, pady=4)
        self.id_label = ttk.Label(id_frame, text="下一个 ID: v?")
        self.id_label.pack(side=tk.LEFT)
        ttk.Button(id_frame, text="刷新 ID", command=self._refresh_id).pack(side=tk.LEFT, padx=8)
        ttk.Button(id_frame, text="重置 ID", command=self._reset_id).pack(side=tk.LEFT)

        row += 1
        btn_frame = ttk.Frame(main)
        btn_frame.grid(row=row, column=0, columnspan=2, sticky=tk.EW, pady=8)
        self.start_btn = ttk.Button(btn_frame, text="🚀 开始采集", command=self._start_collect)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 8))
        self.stop_btn = ttk.Button(btn_frame, text="⏹ 停止", command=self._stop_collect, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="清空日志", command=self._clear_log).pack(side=tk.RIGHT)

        row += 1
        ttk.Label(main, text="日志输出:").grid(row=row, column=0, sticky=tk.W, pady=(8, 0))

        row += 1
        self.log_text = scrolledtext.ScrolledText(main, height=18, wrap=tk.WORD, font=("Consolas", 9))
        self.log_text.grid(row=row, column=0, columnspan=2, sticky=tk.NSEW, pady=4)
        main.rowconfigure(row, weight=1)

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
                en_words_segments = fetch_word_level_transcript(video_id, "en")
                if not en_words_segments:
                    self._log("ERROR: 该视频没有英文词级字幕，无法继续。")
                    return
                self._log(f"  EN 词级字幕: {len(en_words_segments)} 段")
                en_segments = synthesize_segments_from_word_level(en_words_segments, "en")
                self._log(f"  合成 EN segments: {len(en_segments)} 条")

            self._log("\nPhase 2/5: 中文字幕...")
            zh_segments = None
            if _load_cached_srt(zh_srt_path):
                self._log("  已有 zh.srt，跳过中文字幕获取")
                zh_segments = _parse_srt_segments(zh_srt_path)
            else:
                zh_words_segments = fetch_word_level_transcript(video_id, "zh-Hans")
                if zh_words_segments:
                    self._log(f"  ZH 词级字幕: {len(zh_words_segments)} 段")
                    zh_segments = synthesize_segments_from_word_level(zh_words_segments, "zh-Hans")
                    self._log(f"  合成 ZH segments: {len(zh_segments)} 条")
                else:
                    self._log("  无中文词级字幕，启动 EN→ZH 翻译...")
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
                tag = ",".join(tags[:5])
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
