from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import get_settings
from core.database import init_db, dispose_engine
from routers.auth import router as auth_router
from routers.explore import router as explore_router
from routers.video import router as video_router
from routers.user import router as user_router
from routers.favorites import router as favorites_router
from routers.upload import router as upload_router
from routers.search import router as search_router
from routers.word import router as word_router
from routers.speech import router as speech_router
from routers.admin import router as admin_router
from routers.parse_task import router as parse_task_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    try:
        await dispose_engine()
    except Exception:
        pass


app = FastAPI(
    title="LinguistTube API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "data": None, "message": f"Internal server error: {str(exc)}"},
    )


app.include_router(auth_router)
app.include_router(explore_router)
app.include_router(video_router)
app.include_router(user_router)
app.include_router(favorites_router)
app.include_router(upload_router)
app.include_router(search_router)
app.include_router(word_router)
app.include_router(speech_router)
app.include_router(admin_router)
app.include_router(parse_task_router)


@app.get("/api/health")
async def health_check():
    return {"code": 200, "data": "ok", "message": "success"}


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
