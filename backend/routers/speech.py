import logging

import aiohttp
from fastapi import APIRouter, File, HTTPException, UploadFile

from core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["speech"])

SILICONFLOW_URL = "https://api.siliconflow.cn/v1/audio/transcriptions"


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    settings = get_settings()
    api_key = settings.siliconflow_api_key

    if not api_key:
        raise HTTPException(status_code=500, detail="SILICONFLOW_API_KEY not configured")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    form_data = aiohttp.FormData()
    form_data.add_field(
        "file",
        content,
        filename=file.filename or "recording.webm",
        content_type=file.content_type or "audio/webm",
    )
    form_data.add_field("model", "FunAudioLLM/SenseVoiceSmall")

    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(SILICONFLOW_URL, data=form_data, headers=headers) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"SiliconFlow API error: {resp.status} {error_text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Speech recognition failed: {resp.status}",
                    )

                result = await resp.json()
                text = result.get("text", "")
                return {"code": 200, "data": {"text": text}, "message": "success"}
    except aiohttp.ClientError as e:
        logger.error(f"SiliconFlow request failed: {e}")
        raise HTTPException(status_code=502, detail="Speech recognition service unavailable")
    except Exception as e:
        logger.error(f"Unexpected error in transcribe: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
