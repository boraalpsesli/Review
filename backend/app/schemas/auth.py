from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(UserBase):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class TokenPayload(BaseModel):
    sub: Optional[str] = None
