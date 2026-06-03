from fastapi import APIRouter
from fastapi.responses import JSONResponse

from schemas.auth import (
    LoginRequest, LoginData, LoginResponse, ErrorResponse,
    RegisterRequest, RegisterResponse,
)
from services.auth_service import login, register, AuthError

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={401: {"model": ErrorResponse}},
)
async def login_endpoint(request: LoginRequest):
    try:
        data = await login(request.username, request.password)
        return {"code": 200, "data": data, "message": "success"}
    except AuthError:
        return JSONResponse(
            status_code=401,
            content={"code": 401, "data": None, "message": "Invalid username or password"},
        )


@router.post(
    "/register",
    response_model=RegisterResponse,
    responses={400: {"model": ErrorResponse}},
)
async def register_endpoint(request: RegisterRequest):
    try:
        data = await register(request.username, request.password, request.invite_key)
        return {"code": 200, "data": data, "message": "success"}
    except AuthError as e:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "data": None, "message": str(e)},
        )