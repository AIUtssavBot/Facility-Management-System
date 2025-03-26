from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from ..models.task import Task, TaskCreate, TaskUpdate, TaskStatus
from ..utils.auth import get_current_user
from ..config.database import tasks_collection, db
from bson import ObjectId
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel, EmailStr

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks-fix", tags=["Tasks Fix"])

# Add Activity model
class Activity(BaseModel):
    action: str
    task_title: str
    timestamp: datetime
    user: Optional[str] = None
    facility: Optional[str] = None

# Save activity function
async def save_activity(action: str, task_title: str, user: str = None, facility: str = None):
    try:
        activity = {
            "action": action,
            "task_title": task_title,
            "timestamp": datetime.utcnow(),
            "user": user,
            "facility": facility
        }
        await db.activities.insert_one(activity)
    except Exception as e:
        logger.error(f"Error saving activity: {str(e)}")

# Model for email notifications
class EmailNotification(BaseModel):
    email: EmailStr
    subject: str
    message: str

# Function to send email
async def send_email_background(email: str, subject: str, message: str):
    """
    Background task to send email
    This is a simplified version that logs the email but doesn't actually send it
    In production, you'd configure SMTP settings
    """
    try:
        logger.info(f"SENDING EMAIL TO: {email}")
        logger.info(f"SUBJECT: {subject}")
        logger.info(f"MESSAGE: {message}")
        
        # In a real implementation, you would use SMTP:
        # msg = MIMEMultipart()
        # msg['From'] = 'your-email@example.com'
        # msg['To'] = email
        # msg['Subject'] = subject
        # msg.attach(MIMEText(message, 'plain'))
        # 
        # with smtplib.SMTP('smtp.your-email-provider.com', 587) as server:
        #     server.starttls()
        #     server.login('your-email@example.com', 'your-password')
        #     server.send_message(msg)
        
        logger.info("Email would be sent in production environment")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

@router.post("/notify")
async def send_notification(notification: EmailNotification, background_tasks: BackgroundTasks):
    """
    Send an email notification about a task
    Doesn't require authentication for testing purposes
    """
    try:
        background_tasks.add_task(
            send_email_background, 
            notification.email, 
            notification.subject, 
            notification.message
        )
        return {"message": "Notification queued successfully"}
    except Exception as e:
        logger.error(f"Error queuing notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

# Simple endpoint with no auth
@router.get("/simple")
async def get_tasks_simple():
    """Simple endpoint to test basic functionality"""
    return {"message": "Simple tasks endpoint working!"}

@router.get("/", response_model=List[Task])
async def get_tasks(current_user = Depends(get_current_user)):
    """
    Get all tasks with authentication
    """
    logger.info(f"GET /tasks-fix/ endpoint called by user: {current_user.email}")
    try:
        tasks = await tasks_collection.find({}).to_list(length=100)
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error in get_tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}"
        )

@router.get("/debug", response_model=List[Task])
async def get_tasks_debug():
    """
    Get all tasks without authentication - for debugging
    """
    logger.info("GET /tasks-fix/debug endpoint called")
    try:
        tasks = await tasks_collection.find({}).to_list(length=100)
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error in get_tasks_debug: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}"
        )

# Test endpoint to check if response_model is causing issues
@router.get("/list-test", response_model=List[Task])
async def get_tasks_list_test():
    """List endpoint for testing the response model without auth"""
    try:
        tasks = await tasks_collection.find({}).to_list(length=100)
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error in get_tasks_list_test: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}"
        )

@router.post("/save-task", response_model=Task)
async def save_task(task: TaskCreate):
    """
    Save a task to the database without authentication (for testing)
    """
    try:
        logger.info(f"Saving task: {task.title}")
        
        task_dict = task.dict()
        task_dict["created_by"] = "anonymous"
        task_dict["created_at"] = datetime.utcnow()
        task_dict["updated_at"] = task_dict["created_at"]
        
        result = await tasks_collection.insert_one(task_dict)
        created_task = await tasks_collection.find_one({"_id": result.inserted_id})
        created_task["id"] = str(created_task["_id"])
        
        # Record activity
        await save_activity(
            action="created",
            task_title=task.title,
            user=task_dict.get("assigned_to"),
            facility=task_dict.get("facility")
        )
        
        return Task(**created_task)
    except Exception as e:
        logger.error(f"Error saving task: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving task: {str(e)}"
        )

@router.put("/update-task/{task_id}", response_model=Task)
async def update_task_no_auth(task_id: str, task_update: TaskUpdate):
    """
    Update a task without authentication (for testing)
    """
    try:
        update_data = task_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Get the task before update
        old_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        
        if update_data.get("status") == TaskStatus.COMPLETE:
            update_data["completed_at"] = datetime.utcnow()
        
        result = await tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        updated_task["id"] = str(updated_task["_id"])
        
        # Record activity for status change
        if "status" in update_data and old_task:
            await save_activity(
                action=f"status changed to {update_data['status']}",
                task_title=old_task["title"],
                user=old_task.get("assigned_to"),
                facility=old_task.get("facility")
            )
        
        return Task(**updated_task)
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task: {str(e)}"
        )

@router.get("/sync", response_model=List[Task])
async def sync_tasks():
    """
    Sync all tasks from the database (no auth required)
    Use this to refresh local storage with server data
    """
    try:
        tasks = await tasks_collection.find({}).to_list(length=100)
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error syncing tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing tasks: {str(e)}"
        )

# Add a users endpoint to fix the 405 Method Not Allowed error
@router.get("/users", response_model=List[dict])
async def get_users():
    """
    Get all users without authentication - for testing
    This is a workaround for the 405 Method Not Allowed error
    """
    logger.info("GET /tasks-fix/users endpoint called")
    try:
        # Return dummy users since we don't have access to the users collection
        dummy_users = [
            {"id": "1", "full_name": "John Doe", "email": "aiml.utssav@gmail.com"},
            {"id": "2", "full_name": "Jane Smith", "email": "aiml.utssav@gmail.com"},
            {"id": "3", "full_name": "Mike Johnson", "email": "aiml.utssav@gmail.com"},
            {"id": "4", "full_name": "Sarah Williams", "email": "aiml.utssav@gmail.com"},
            {"id": "5", "full_name": "Robert Brown", "email": "aiml.utssav@gmail.com"}
        ]
        return dummy_users
    except Exception as e:
        logger.error(f"Error in get_users: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    """
    Delete a task without authentication (for testing)
    """
    try:
        # Get task before deletion
        task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        
        result = await tasks_collection.delete_one({"_id": ObjectId(task_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Record activity
        if task:
            await save_activity(
                action="deleted",
                task_title=task["title"],
                user=task.get("assigned_to"),
                facility=task.get("facility")
            )
        
        return {"message": f"Task {task_id} deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting task: {str(e)}"
        )

# Add a task stats model
class TaskStats(BaseModel):
    total: int
    completed: int
    in_progress: int
    pending: int
    missed: int

@router.get("/task-stats/{user_id}", response_model=TaskStats)
async def get_task_stats(user_id: str):
    """
    Get task statistics for a specific user
    """
    try:
        # Get all tasks for the user
        if user_id == "all":
            tasks = await tasks_collection.find({}).to_list(length=100)
        else:
            tasks = await tasks_collection.find({"assigned_to": user_id}).to_list(length=100)
        
        # Initialize counters
        stats = {
            "total": len(tasks),
            "completed": 0,
            "in_progress": 0,
            "pending": 0,
            "missed": 0
        }
        
        # Count tasks by status
        for task in tasks:
            status = task.get("status", "Pending").lower()
            if status == "completed":
                stats["completed"] += 1
            elif status == "in progress":
                stats["in_progress"] += 1
            elif status == "pending":
                stats["pending"] += 1
            elif status == "missed":
                stats["missed"] += 1
        
        return TaskStats(**stats)
    except Exception as e:
        logger.error(f"Error getting task stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting task stats: {str(e)}"
        )

@router.get("/recent-activities")
async def get_recent_activities():
    """
    Get recent activities
    """
    try:
        activities = await db.activities.find().sort("timestamp", -1).limit(10).to_list(length=10)
        for activity in activities:
            activity["_id"] = str(activity["_id"])
        return activities
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching activities: {str(e)}"
        ) 