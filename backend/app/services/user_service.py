from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from ..db.mongodb import get_database
from ..models.user import User

async def get_user_by_email(email: str) -> Optional[User]:
    """
    Get a user by email
    """
    db = await get_database()
    user_data = await db.users.find_one({"email": email})
    if user_data:
        return User(**user_data)
    return None

async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Get a user by ID
    """
    db = await get_database()
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(**user_data)
    return None

async def create_user(user: User) -> User:
    """
    Create a new user
    """
    db = await get_database()
    user_dict = user.model_dump(by_alias=True, exclude={"id"})
    result = await db.users.insert_one(user_dict)
    user_data = await db.users.find_one({"_id": result.inserted_id})
    return User(**user_data)

async def update_user(user_id: str, user_data: dict) -> Optional[User]:
    """
    Update a user
    """
    db = await get_database()
    user_data["updated_at"] = datetime.utcnow()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": user_data}
    )
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if updated_user:
        return User(**updated_user)
    return None

async def create_user_if_not_exists(email: str, name: Optional[str] = None) -> User:
    """
    Create a user if they don't exist, otherwise return the existing user
    """
    user = await get_user_by_email(email)
    if user:
        # Update the user if name has changed
        if name and user.name != name:
            user = await update_user(str(user.id), {"name": name})
        return user
    
    # Create new user
    new_user = User(email=email, name=name)
    return await create_user(new_user)

async def list_users(skip: int = 0, limit: int = 100) -> List[User]:
    """
    List all users
    """
    db = await get_database()
    users = []
    cursor = db.users.find().skip(skip).limit(limit)
    async for document in cursor:
        users.append(User(**document))
    return users 