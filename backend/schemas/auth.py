from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginData(BaseModel):
    username: str
    role: str
    vip_expires_at: str | None = None
    created_at: str | None = None
    token: str


class LoginResponse(BaseModel):
    code: int = 200
    data: LoginData
    message: str = "success"


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    invite_key: str = Field(..., min_length=1, max_length=64, description="注册卡密")


class RegisterData(BaseModel):
    username: str
    role: str
    vip_expires_at: str | None = None
    created_at: str | None = None
    token: str


class RegisterResponse(BaseModel):
    code: int = 200
    data: RegisterData
    message: str = "success"


class RedeemKeyRequest(BaseModel):
    key: str = Field(..., min_length=1, max_length=64, description="卡密")


class RedeemKeyData(BaseModel):
    username: str
    role: str
    vip_expires_at: str | None = None
    created_at: str | None = None
    token: str


class RedeemKeyResponse(BaseModel):
    code: int = 200
    data: RedeemKeyData
    message: str = "success"


class ErrorResponse(BaseModel):
    code: int
    data: None = None
    message: str
