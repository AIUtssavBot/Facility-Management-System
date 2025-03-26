import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "fms_db")

# MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
users_collection = db.users
tasks_collection = db.tasks
analytics_collection = db.analytics

async def init_db():
    """Initialize database connections and create indexes"""
    try:
        # Check if connection is successful
        await client.admin.command('ping')
        print("Successfully connected to MongoDB")
        
        # Create indexes for faster queries
        await users_collection.create_index("email", unique=True)
        await tasks_collection.create_index("user_id")
        await tasks_collection.create_index("due_date")
        
        print("Database initialized successfully")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise 