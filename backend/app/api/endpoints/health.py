from fastapi import APIRouter, Depends
from ...db.mongodb import get_database

router = APIRouter()

@router.get("/")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "ok", "message": "Service is running"}

@router.get("/db")
async def db_health_check():
    """
    Database health check endpoint
    """
    try:
        db = await get_database()
        # Simple ping to check if database is responsive
        await db.command("ping")
        return {"status": "ok", "message": "Database connection is healthy"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection error: {str(e)}"} 