from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError
from msal import ConfidentialClientApplication

from .config import settings
from ..models.user import User
from ..schemas.token import Token, TokenPayload
from ..services.user_service import get_user_by_email, create_user_if_not_exists

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def get_msal_app() -> ConfidentialClientApplication:
    return ConfidentialClientApplication(
        client_id=settings.AZURE_AD_CLIENT_ID,
        client_credential=settings.AZURE_AD_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}"
    )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenPayload(sub=email)
    except PyJWTError:
        raise credentials_exception
    
    user = await get_user_by_email(email=token_data.sub)
    if user is None:
        raise credentials_exception
    return user

def get_auth_router() -> APIRouter:
    router = APIRouter()
    
    @router.post("/token", response_model=Token)
    async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
        """
        OAuth2 compatible token login, get an access token for future requests
        """
        app = get_msal_app()
        
        # Try to authenticate with Azure AD
        result = app.acquire_token_by_username_password(
            username=form_data.username,
            password=form_data.password,
            scopes=[f"{settings.AZURE_AD_CLIENT_ID}/.default"]
        )
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # User is authenticated, get user info from token
        user_info = result.get("id_token_claims", {})
        email = user_info.get("preferred_username", form_data.username)
        name = user_info.get("name", "")
        
        # Create or update user in our database
        user = await create_user_if_not_exists(email=email, name=name)
        
        # Create access token for our system
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email, "name": name}, 
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user.id),
            "name": user.name,
            "email": user.email
        }
    
    @router.get("/me", response_model=Dict[str, Any])
    async def read_users_me(current_user: User = Depends(get_current_user)):
        """
        Get current user
        """
        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.name,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at,
        }
    
    return router 