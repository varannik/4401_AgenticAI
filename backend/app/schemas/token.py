from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    name: Optional[str] = None
    email: EmailStr

class TokenPayload(BaseModel):
    sub: str  # Subject (usually email)
    name: Optional[str] = None
    exp: Optional[int] = None  # Expiration time 