"""
AI 内容生成模块。

使用兼容 OpenAI API 格式的 LLM 根据视频信息和字幕生成:
  1. 中英文名称
  2. Tag
  3. Category
  4. Level
  5. 中英文描述

通过环境变量配置供应商和模型:
  AI_BASE_URL  - API 基础地址 (如 https://api.deepseek.com/v1)
  AI_API_KEY   - API Key
  AI_MODEL     - 模型名称 (如 deepseek-chat)
"""

import json
import logging
import re

import aiohttp

from config import get_settings

logger = logging.getLogger(__name__)

# 硬编码的 categories 列表 (与 categories 表一致)
VALID_CATEGORIES = ["News", "Vlog", "Travel", "TED", "Movie", "Education"]

VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"]


async def generate_video_metadata(
    title: str,
    description: str,
    subtitle_text: str,
) -> dict:
    """
    通过 AI 生成视频元数据。

    Args:
        title: YouTube 视频原始标题
        description: YouTube 视频原始描述
        subtitle_text: 英文字幕文本 (前 3000 字符)

    Returns:
        dict with keys: title_en, title_zh, tags, category, level,
                        description_en, description_zh
    """
    settings = get_settings()
    api_key = settings.ai_api_key
    base_url = settings.ai_base_url.rstrip("/")
    model = settings.ai_model

    if not api_key:
        raise ValueError("AI_API_KEY 未配置")

    # 截取字幕文本，避免过长
    sub_text = subtitle_text[:3000] if subtitle_text else ""

    prompt = f"""You are a professional English learning content curator. Based on the following YouTube video information and English subtitles, generate structured metadata for an English learning platform.

VIDEO TITLE: {title}
VIDEO DESCRIPTION: {description[:1000] if description else 'N/A'}
ENGLISH SUBTITLES (excerpt): {sub_text}

Generate the following fields. You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no code blocks:

{{
  "title_en": "English name, max 5 words, concise and descriptive",
  "title_zh": "Chinese name, max 8 Chinese characters, concise translation",
  "tags": ["tag1", "tag2"],
  "category": "one of: {', '.join(VALID_CATEGORIES)}",
  "level": "one of: {', '.join(VALID_LEVELS)}",
  "description_en": "English description, 1-3 sentences summarizing the video content for English learners",
  "description_zh": "Chinese description, 1-3 sentences summarizing the video content"
}}

RULES:
- title_en: Use the original title but shorten to max 5 words. Remove channel names, brackets, etc.
- title_zh: Translate to Chinese, max 8 Chinese characters.
- tags: 1-2 English words that best describe the topic. Each tag is a single word.
- category: MUST be exactly one of: {', '.join(VALID_CATEGORIES)}. Choose the most fitting one.
- level: Judge based on vocabulary difficulty in subtitles. Beginner = simple everyday words, Intermediate = moderate vocabulary, Advanced = complex/academic/specialized vocabulary.
- description_en: Rewrite the original description to be concise and useful for English learners.
- description_zh: Chinese translation of the English description.

Respond with ONLY the JSON object, nothing else."""

    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    logger.info(f"AI 请求: model={model}, base_url={base_url}")

    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"AI API error: {resp.status} {error_text}")
                    raise RuntimeError(f"AI API 请求失败: {resp.status}")

                result = await resp.json()
                content = result["choices"][0]["message"]["content"].strip()

                # 清理可能的 markdown 代码块包裹
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content)
                content = content.strip()

                metadata = json.loads(content)

                # 验证和修正字段
                metadata = _validate_and_fix(metadata)

                return metadata

    except json.JSONDecodeError as e:
        logger.error(f"AI 返回的 JSON 解析失败: {e}, content: {content}")
        raise RuntimeError(f"AI 返回格式错误: {e}")
    except aiohttp.ClientError as e:
        logger.error(f"AI API 请求异常: {e}")
        raise RuntimeError(f"AI API 请求异常: {e}")


def _validate_and_fix(metadata: dict) -> dict:
    """验证并修正 AI 生成的元数据"""

    # title_en: 最多 5 个单词
    title_en = metadata.get("title_en", "").strip()
    if not title_en:
        title_en = "Untitled Video"
    words = title_en.split()
    if len(words) > 5:
        title_en = " ".join(words[:5])
    metadata["title_en"] = title_en

    # title_zh: 最多 8 个中文字符
    title_zh = metadata.get("title_zh", "").strip()
    if not title_zh:
        title_zh = title_en
    # 计算中文字符数
    zh_chars = re.findall(r'[\u4e00-\u9fff]', title_zh)
    if len(zh_chars) > 8:
        # 截取前 8 个中文字符
        count = 0
        result = []
        for ch in title_zh:
            if '\u4e00' <= ch <= '\u9fff':
                count += 1
                if count > 8:
                    break
            result.append(ch)
        title_zh = "".join(result)
    metadata["title_zh"] = title_zh

    # tags: 最多 2 个，每个是一个英语单词
    tags = metadata.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",")]
    validated_tags = []
    for tag in tags[:2]:
        tag = str(tag).strip()
        # 只取第一个单词
        tag = tag.split()[0] if tag.split() else tag
        if tag:
            validated_tags.append(tag)
    metadata["tags"] = validated_tags

    # category: 必须是 VALID_CATEGORIES 之一
    category = metadata.get("category", "").strip()
    if category not in VALID_CATEGORIES:
        # 尝试模糊匹配
        for vc in VALID_CATEGORIES:
            if vc.lower() == category.lower():
                category = vc
                break
        else:
            category = "Education"  # 默认
    metadata["category"] = category

    # level: 必须是 VALID_LEVELS 之一
    level = metadata.get("level", "").strip()
    if level not in VALID_LEVELS:
        for vl in VALID_LEVELS:
            if vl.lower() == level.lower():
                level = vl
                break
        else:
            level = "Intermediate"  # 默认
    metadata["level"] = level

    # description_en
    description_en = metadata.get("description_en", "").strip()
    if not description_en:
        description_en = "No description available."
    metadata["description_en"] = description_en

    # description_zh
    description_zh = metadata.get("description_zh", "").strip()
    if not description_zh:
        description_zh = description_en
    metadata["description_zh"] = description_zh

    return metadata
