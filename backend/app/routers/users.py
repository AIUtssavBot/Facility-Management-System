from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from ..models.user import User, UserUpdate
from ..utils.auth import get_current_user, get_password_hash
from ..config.database import users_collection
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[User])
async def get_users(current_user = Depends(get_current_user)):
    users = await users_collection.find().to_list(length=100)
    
    # Convert ObjectId to string for all users
    for user in users:
        user["id"] = str(user["_id"])
    
    return [User(**user) for user in users]

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user = Depends(get_current_user)):
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Convert ObjectId to string for response
        user["id"] = str(user["_id"])
        
        return User(**user)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str, 
    user_update: UserUpdate,
    current_user = Depends(get_current_user)
):
    # Check if current user is updating their own profile or is an admin
    if str(current_user.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if provided
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Perform update
    try:
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Get updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        updated_user["id"] = str(updated_user["_id"])
        
        return User(**updated_user)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID or update data"
        ) 