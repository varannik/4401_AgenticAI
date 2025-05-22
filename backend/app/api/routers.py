from fastapi import APIRouter

from .endpoints import users, agents, knowledge, health

api_router = APIRouter()

# Add all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"]) 