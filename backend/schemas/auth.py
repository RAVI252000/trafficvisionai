from pydantic import BaseModel, EmailStr
from schemas.user import UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
