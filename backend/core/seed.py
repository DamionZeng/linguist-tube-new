import asyncio
import json
from datetime import datetime, timezone, timedelta

from sqlalchemy import text
from passlib.context import CryptContext

from core.database import _get_async_session, init_db
from core.config import get_settings
from models.user import User
from models.video import Video, Transcript
from models.category import Category
from models.carousel import CarouselItem
from models.watch_history import WatchHistory
from models.vocabulary import Vocabulary
from models.favorite_sentence import FavoriteSentence
from models.registration_key import RegistrationKey

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_data():
    settings = get_settings()
    print(f"Seeding database: {settings.database_url.split('@')[-1]}")

    await init_db()

    session_factory = _get_async_session()
    async with session_factory() as session:
        # ========= users =========
        existing = await session.execute(text("SELECT COUNT(*) FROM users"))
        if existing.scalar() == 0:
            users = [
                User(id=1, username="damion", password_hash=pwd_context.hash("123456"), role="user"),
                User(id=2, username="root", password_hash=pwd_context.hash("123456"), role="vip"),
            ]
            session.add_all(users)
            await session.flush()
            # 显式指定了 id，需要重置序列避免后续注册冲突
            await session.execute(text("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))"))
            print("  users seeded")

        # ========= registration_keys =========
        existing = await session.execute(text("SELECT COUNT(*) FROM registration_keys"))
        if existing.scalar() == 0:
            import secrets
            import string as _string
            alphabet = _string.ascii_uppercase + _string.digits
            keys = []
            for i in range(3):
                random_part = "".join(secrets.choice(alphabet) for _ in range(16))
                # 第一个终生VIP，第二个30天，第三个365天
                vip_durations = [None, 30, 365]
                keys.append(RegistrationKey(
                    key=random_part,
                    expires_at=datetime(2026, 12, 31, tzinfo=timezone.utc),
                    vip_duration_days=vip_durations[i],
                    is_used=False,
                ))
            session.add_all(keys)
            print("  registration_keys seeded")

        # ========= categories =========
        existing = await session.execute(text("SELECT COUNT(*) FROM categories"))
        if existing.scalar() == 0:
            cats = ["All", "Business", "Daily Life", "Travel", "IELTS", "Slang"]
            for name in cats:
                session.add(Category(name=name))
            print("  categories seeded")

        # ========= videos =========
        existing = await session.execute(text("SELECT COUNT(*) FROM videos"))
        if existing.scalar() == 0:
            videos = [
                Video(id="v1", title="商场购物与试衣", duration="12:45", level="Intermediate",
                      thumb="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
                      tag="British English", is_vip_only=False,
                      video_url="https://www.youtube.com/watch?v=4E9YkJKiRTc", sort_order=1),
                Video(id="v2", title="Coffee Shop Conversations", duration="08:20", level="Beginner",
                      thumb="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80",
                      tag="Daily Life", is_vip_only=False,
                      video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", sort_order=2),
                Video(id="v3", title="Tech Interview Power Words", duration="15:10", level="Advanced",
                      thumb="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
                      tag="Business", is_vip_only=True,
                      video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", sort_order=3),
                Video(id="v4", title="Airport & Customs Vocabulary", duration="10:05", level="Beginner",
                      thumb="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80",
                      tag="Travel", is_vip_only=True,
                      video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ", sort_order=4),
            ]
            session.add_all(videos)
            print("  videos seeded")

        await session.flush()

        # ========= carousel_items =========
        existing = await session.execute(text("SELECT COUNT(*) FROM carousel_items"))
        if existing.scalar() == 0:
            carousels = [
                CarouselItem(id="v1", title="商场购物与试衣", subtitle="Shopping & Fitting",
                             desc="Learn essential vocabulary for trying on clothes at the mall.",
                             image="https://images.unsplash.com/photo-1605100804763-247f67b854d4?auto=format&fit=crop&w=800&q=80",
                             tag="Up Next", video_id="v1", sort_order=1),
                CarouselItem(id="v2", title="咖啡馆点餐", subtitle="Ordering at a Cafe",
                             desc="Master the common phrases used in a coffee shop.",
                             image="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
                             tag="New", video_id="v2", sort_order=2),
                CarouselItem(id="v3", title="求职面试技巧", subtitle="Job Interview Tips",
                             desc="Key phrases and power words to land your dream job.",
                             image="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
                             tag="Featured", video_id="v3", sort_order=3),
            ]
            session.add_all(carousels)
            print("  carousel_items seeded")

        # ========= transcripts =========
        existing = await session.execute(text("SELECT COUNT(*) FROM transcripts"))
        if existing.scalar() == 0:
            transcripts = [
                Transcript(id="1", video_id="v1", start_time="00:00", end_time="00:05",
                           en_text="Testing actual video playback with network URL.",
                           zh_text="正在使用网络URL测试实际的视频播放。",
                           highlights_json=json.dumps([{"word": "network", "color": "text-[#D48166]"}]), sort_order=1),
                Transcript(id="2", video_id="v1", start_time="00:05", end_time="00:10",
                           en_text="Please listen to the actual audio of the video.",
                           zh_text="请听视频中的实际音频。",
                           highlights_json=json.dumps([{"word": "actual", "color": "text-[#94A684]"}]), sort_order=2),
                Transcript(id="3", video_id="v1", start_time="00:10", end_time="00:15",
                           en_text="Tears of Steel is an open-source short film.",
                           zh_text="《钢铁之泪》是一部开源短片。",
                           highlights_json=json.dumps([]), sort_order=3),
                Transcript(id="4", video_id="v1", start_time="00:15", end_time="00:20",
                           en_text="It features real actors and computer generated environments.",
                           zh_text="它以真实的演员和计算机生成的环境为特色。",
                           highlights_json=json.dumps([
                               {"word": "generated", "color": "text-[#D48166]"},
                               {"word": "environments", "color": "text-[#94A684]"}
                           ]), sort_order=4),
                Transcript(id="5", video_id="v1", start_time="00:20", end_time="00:30",
                           en_text="You can test the scrolling, highlight, and play features freely.",
                           zh_text="您可以自由测试滚动、高亮和播放功能。",
                           highlights_json=json.dumps([{"word": "scrolling", "color": "text-[#94A684]"}]), sort_order=5),
            ]
            session.add_all(transcripts)
            print("  transcripts seeded")

        # ========= watch_history (damion user_id=1) =========
        existing = await session.execute(text("SELECT COUNT(*) FROM watch_history"))
        if existing.scalar() == 0:
            history = [
                WatchHistory(user_id=1, video_id="v1", progress=85, last_watched="2 hours ago"),
                WatchHistory(user_id=1, video_id="v2", progress=30, last_watched="Yesterday"),
            ]
            session.add_all(history)
            print("  watch_history seeded")

        # ========= vocabulary (root user_id=2 VIP) =========
        existing = await session.execute(text("SELECT COUNT(*) FROM vocabulary"))
        if existing.scalar() == 0:
            vocab = [
                Vocabulary(id="w1", user_id=2, word="get by", phonetic="/get baɪ/", pos="phrasal verb",
                           mean="To manage or survive with limited resources.", trans="勉强生存，维持",
                           example='"I can get by on just 5 hours of sleep."',
                           example_trans="我只睡5个小时也能勉强应付。", added_at="2 days ago"),
                Vocabulary(id="w2", user_id=2, word="knackered", phonetic="/'nækəd/", pos="adj.",
                           mean="Extremely tired; exhausted. (British Informal)", trans="极度疲倦的，筋疲力尽的",
                           example='"I am absolutely knackered after that long trip."',
                           example_trans="那趟长途旅行后我真是累坏了。", added_at="Oct 12"),
                Vocabulary(id="w3", user_id=2, word="try on", phonetic="/traɪ ɒn/", pos="phrasal verb",
                           mean="Put on a piece of clothing to see if it fits.", trans="试穿",
                           example='"Can I try this on before buying it?"',
                           example_trans="买之前我可以试穿一下这个吗？", added_at="Just now"),
                Vocabulary(id="w4", user_id=2, word="freshen up", phonetic="/ˈfreʃ.ən ʌp/", pos="phrasal verb",
                           mean="To wash and make yourself look clean and tidy.", trans="梳洗打扮",
                           example='"We wanted to freshen up a bit before going out."',
                           example_trans="出门前我们想稍加梳洗打扮一下。", added_at="1 week ago"),
            ]
            session.add_all(vocab)
            print("  vocabulary seeded")

        # ========= favorite_sentences (damion user_id=1) =========
        existing = await session.execute(text("SELECT COUNT(*) FROM favorite_sentences"))
        if existing.scalar() == 0:
            sentences = [
                FavoriteSentence(id="s1", user_id=1, en_text="They go on your finger.",
                                 zh_text="它们戴在你的手指上。", video_title="商场购物与试衣", time="00:02"),
                FavoriteSentence(id="s2", user_id=1, en_text="We wanted to freshen up a bit.",
                                 zh_text="我们想要稍微梳洗打扮一下。", video_title="购物分享与周末晚餐", time="00:00"),
            ]
            session.add_all(sentences)
            print("  favorite_sentences seeded")

        await session.commit()
        print("Seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())