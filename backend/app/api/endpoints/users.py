from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from ...core.auth import get_current_user
from ...models.user import User
from ...services.user_service import get_user_by_id, list_users, update_user

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve users.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    users = await list_users(skip=skip, limit=limit)
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "created_at": user.created_at,
        }
        for user in users
    ]

@router.get("/{user_id}", response_model=Dict[str, Any])
async def read_user(
    user_id: str, 
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific user by id.
    """
    if not current_user.is_superuser and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at,
    }

@router.patch("/{user_id}", response_model=Dict[str, Any])
async def update_user_endpoint(
    user_id: str,
    user_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Update a user.
    """
    if not current_user.is_superuser and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Do not allow updating email or superuser status unless admin
    if not current_user.is_superuser:
        user_data.pop("email", None)
        user_data.pop("is_superuser", None)
    
    user = await update_user(user_id, user_data)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    } 