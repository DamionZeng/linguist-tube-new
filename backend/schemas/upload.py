from pydantic import BaseModel


class UploadResponse(BaseModel):
    code: int = 200
    data: "UploadData"
    message: str = "success"


class UploadData(BaseModel):
    url: str