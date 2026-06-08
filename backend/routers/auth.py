from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from schemas.auth import (
    LoginRequest, LoginData, LoginResponse, ErrorResponse,
    RegisterRequest, RegisterResponse,
    RedeemKeyRequest, RedeemKeyResponse,
)
from services.auth_service import login, register, redeem_key, AuthError
from core.deps import get_required_user
from models.user import User

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


@router.post(
    "/redeem-key",
    response_model=RedeemKeyResponse,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
async def redeem_key_endpoint(
    request: RedeemKeyRequest,
    user: User = Depends(get_required_user),
):
    try:
        data = await redeem_key(user.id, request.key)
        return {"code": 200, "data": data, "message": "success"}
    except AuthError as e:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "data": None, "message": str(e)},
        )
