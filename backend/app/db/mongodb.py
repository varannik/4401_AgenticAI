import motor.motor_asyncio
from ..core.config import settings

_client = None
_db = None

async def get_database():
    """
    Get MongoDB database instance
    """
    global _client, _db
    if _db is None:
        _client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URI)
        _db = _client[settings.MONGODB_DB_NAME]
    return _db

async def close_mongo_connection():
    """
    Close MongoDB connection
    """
    global _client
    if _client is not None:
        _client.close()

async def init_db():
    """
    Initialize database - create indexes, etc.
    """
    db = await get_database()
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    
    # Add more initialization as needed 