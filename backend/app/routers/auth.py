from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from datetime import timedelta, datetime
import logging
import json
from ..models.user import UserCreate, Token, User
from ..utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from ..config.database import users_collection
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User)
async def register(request: Request):
    try:
        # Get request body as text
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        logging.warning(f"Register request body: {body_str}")
        logging.warning(f"Request headers: {request.headers}")
        
        # Parse JSON manually
        try:
            data = json.loads(body_str)
            logging.warning(f"Parsed JSON data: {data}")
        except json.JSONDecodeError as e:
            logging.error(f"Invalid JSON: {e}")
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid JSON in request: {str(e)}"}
            )
        
        # Validate required fields
        required_fields = ["email", "password", "full_name"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            logging.error(f"Missing required fields: {missing_fields}")
            return JSONResponse(
                status_code=400,
                content={"detail": f"Missing required fields: {', '.join(missing_fields)}"}
            )
        
        # Validate email format
        if not "@" in data["email"] or not "." in data["email"]:
            logging.error(f"Invalid email format: {data['email']}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid email format"}
            )
        
        # Validate password length
        if len(data["password"]) < 8:
            logging.error("Password too short")
            return JSONResponse(
                status_code=400,
                content={"detail": "Password must be at least 8 characters long"}
            )
        
        # Create user_data object
        try:
            user_data = UserCreate(
                email=data["email"],
                password=data["password"],
                full_name=data["full_name"],
                company=data.get("company", "")
            )
            logging.warning(f"Created UserCreate object: {user_data}")
        except Exception as e:
            logging.error(f"Error creating UserCreate object: {e}")
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid user data: {str(e)}"}
            )
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            logging.warning(f"Email already registered: {user_data.email}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Email already registered"}
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user document
        user_dict = user_data.dict()
        user_dict.pop("password")
        user_dict["hashed_password"] = hashed_password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["is_active"] = True
        
        logging.warning(f"User document to insert: {user_dict}")
        
        # Insert into database
        try:
            result = await users_collection.insert_one(user_dict)
            logging.warning(f"User created with ID: {result.inserted_id}")
            
            # Get the created user
            created_user = await users_collection.find_one({"_id": result.inserted_id})
            
            # Convert ObjectId to string for response
            created_user["id"] = str(created_user["_id"])
            
            return User(**created_user)
        except Exception as e:
            logging.error(f"Error creating user: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error creating user: {str(e)}"}
            )
    except Exception as e:
        logging.error(f"Unexpected error in register endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server error: {str(e)}"}
        )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user by email
    user = await users_collection.find_one({"email": form_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"], "user_id": str(user["_id"])},
        expires_delta=access_token_expires
    )
    
    # Convert user for response
    user_out = {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "company": user.get("company"),
        "created_at": user.get("created_at"),
        "is_active": user.get("is_active", True)
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_out
    }

@router.get("/me", response_model=User)
async def read_users_me(current_user = Depends(get_current_user)):
    user = await users_collection.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert ObjectId to string for response
    user["id"] = str(user["_id"])
    
    return User(**user) 