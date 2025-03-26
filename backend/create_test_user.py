import asyncio
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime

# MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client["fms_db"]
users_collection = db["users"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_test_user():
    # Check if user already exists
    existing_user = users_collection.find_one({"email": "test@example.com"})
    if existing_user:
        print("Test user already exists!")
        return
    
    # Create user data
    user_data = {
        "email": "test@example.com",
        "full_name": "Test User",
        "hashed_password": get_password_hash("password123"),
        "company": "Test Company",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Insert user
    result = users_collection.insert_one(user_data)
    
    if result.inserted_id:
        print(f"Test user created with ID: {result.inserted_id}")
    else:
        print("Failed to create test user")

if __name__ == "__main__":
    asyncio.run(create_test_user()) 