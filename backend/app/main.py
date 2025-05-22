import time
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from .api.routers import api_router
from .core.config import settings
from .core.auth import get_auth_router

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI Platform API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication router
app.include_router(get_auth_router(), prefix=f"{settings.API_V1_STR}/auth")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Add middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
async def root():
    return {
        "message": "Welcome to the AI Platform API",
        "docs_url": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 