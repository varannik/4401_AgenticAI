import os
from typing import List, Union, Dict, Any
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Platform"
    
    # CORS
    CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "ai_platform"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    
    # Vector Database
    VECTOR_DB_TYPE: str = "qdrant"  # qdrant, pinecone, etc.
    VECTOR_DB_URL: str = "http://localhost:6333"
    VECTOR_DB_API_KEY: str = ""
    
    # Azure AD Auth
    AZURE_AD_TENANT_ID: str
    AZURE_AD_CLIENT_ID: str
    AZURE_AD_CLIENT_SECRET: str
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_API_BASE: str
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"
    AZURE_OPENAI_DEPLOYMENT_NAME: str
    
    # JWT
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Load environment settings
settings = Settings()  # type: ignore 