from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginData(BaseModel):
    username: str
    role: str
    token: str


class LoginResponse(BaseModel):
    code: int = 200
    data: LoginData
    message: str = "success"


class ErrorResponse(BaseModel):
    code: int
    data: None = None
    message: str