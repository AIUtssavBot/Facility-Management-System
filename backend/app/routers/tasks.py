from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from ..models.task import Task, TaskCreate, TaskUpdate, TaskStatus
from ..utils.auth import get_current_user
from ..utils.task_optimization import optimize_task_allocation, sort_tasks_for_user, get_task_status
from ..config.database import tasks_collection, users_collection
from bson import ObjectId
from ..utils.genetic_algorithm import TaskAllocationProblem, optimize_task_allocation
import random
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=Task)
async def create_task(task: TaskCreate, current_user = Depends(get_current_user)):
    # Prepare task for insertion
    task_dict = task.dict()
    task_dict["created_by"] = current_user.user_id
    task_dict["created_at"] = datetime.utcnow()
    task_dict["updated_at"] = task_dict["created_at"]
    
    # Insert into database
    result = await tasks_collection.insert_one(task_dict)
    
    # Get created task
    created_task = await tasks_collection.find_one({"_id": result.inserted_id})
    created_task["id"] = str(created_task["_id"])
    
    return Task(**created_task)

@router.get("/", response_model=List[Task])
async def get_tasks(
    priority: Optional[str] = None,
    due_before: Optional[datetime] = None,
    assigned_to: Optional[str] = None,
    sort_optimized: bool = False,
    current_user = Depends(get_current_user)
):
    logger.info(f"GET /tasks request received. User: {current_user.email}, Filters: priority={priority}, due_before={due_before}, assigned_to={assigned_to}")
    try:
        # Build query filter
        query = {}
        
        if priority:
            query["priority"] = priority
        
        if due_before:
            query["due_date"] = {"$lte": due_before}
            
        if assigned_to:
            query["assigned_to"] = assigned_to
        
        # Get tasks
        logger.info(f"Executing tasks query with filter: {query}")
        tasks = await tasks_collection.find(query).to_list(length=100)
        logger.info(f"Found {len(tasks)} tasks")
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        # If requesting optimized sorting
        if sort_optimized and assigned_to:
            tasks = sort_tasks_for_user(tasks, assigned_to)
        
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error in get_tasks: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}"
        )

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user = Depends(get_current_user)):
    try:
        task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Convert ObjectId to string for response
        task["id"] = str(task["_id"])
        # Update task status based on current date
        task["status"] = get_task_status(task)
        
        return Task(**task)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID"
        )

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str, 
    task_update: TaskUpdate,
    current_user = Depends(get_current_user)
):
    # Prepare update data
    update_data = task_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # If status is being set to complete, set completed_at
    if update_data.get("status") == TaskStatus.COMPLETE:
        update_data["completed_at"] = datetime.utcnow()
    
    # Perform update
    try:
        result = await tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
            
        # Get updated task
        updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        updated_task["id"] = str(updated_task["_id"])
        
        return Task(**updated_task)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID or update data"
        )

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user = Depends(get_current_user)):
    try:
        # Check if task exists
        task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Only the creator can delete a task
        if task["created_by"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this task"
            )
        
        # Delete the task
        await tasks_collection.delete_one({"_id": ObjectId(task_id)})
        
        return None
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task ID"
        )

@router.post("/optimize-allocation", response_model=List[Task])
async def optimize_tasks(current_user = Depends(get_current_user)):
    """
    Use genetic algorithm to optimize task allocation to users.
    """
    # Get unassigned tasks
    unassigned_tasks = await tasks_collection.find({
        "assigned_to": None
    }).to_list(length=100)
    
    # Get active users
    users = await users_collection.find({"is_active": True}).to_list(length=50)
    
    # Convert ObjectIds to strings for both tasks and users
    for task in unassigned_tasks:
        task["id"] = str(task["_id"])
    
    for user in users:
        user["id"] = str(user["_id"])
    
    # Skip optimization if no tasks or users
    if not unassigned_tasks or not users:
        return []
    
    # Optimize task allocation
    assignments = optimize_task_allocation(unassigned_tasks, users)
    
    # Update tasks with assigned users
    updated_tasks = []
    for task_id, user_id in assignments:
        # Update in database
        await tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"assigned_to": user_id, "updated_at": datetime.utcnow()}}
        )
        
        # Get updated task
        updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
        updated_task["id"] = str(updated_task["_id"])
        updated_tasks.append(Task(**updated_task))
    
    return updated_tasks

@router.get("/user/{user_id}/optimized", response_model=List[Task])
async def get_optimized_tasks_for_user(
    user_id: str, 
    current_user = Depends(get_current_user)
):
    """
    Get optimally sorted tasks for a specific user.
    """
    # Get user's tasks
    tasks = await tasks_collection.find({
        "assigned_to": user_id
    }).to_list(length=100)
    
    # Convert ObjectId to string for all tasks
    for task in tasks:
        task["id"] = str(task["_id"])
    
    # Sort tasks optimally
    sorted_tasks = sort_tasks_for_user(tasks, user_id)
    
    return [Task(**task) for task in sorted_tasks]

@router.get("/optimize-tasks")
async def optimize_tasks():
    try:
        # Fetch tasks and users from the database
        tasks = await tasks_collection.find().to_list(length=100)
        users = await users_collection.find().to_list(length=100)
        
        if not tasks or not users:
            return {"message": "No tasks or users available for optimization", "allocation": {}}
        
        # Run the optimization algorithm
        optimized_allocation = optimize_task_allocation(tasks, users)
        
        # Update tasks in the database with the optimized allocation
        for task_id, user_id in optimized_allocation.items():
            await tasks_collection.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"assigned_to": user_id}}
            )
        
        return {
            "message": "Tasks optimized successfully",
            "allocation": optimized_allocation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error optimizing tasks: {str(e)}"
        )

@router.get("/debug/no-auth", response_model=List[Task])
async def get_tasks_debug():
    """
    Debug endpoint to get tasks without authentication.
    Only for development - should be removed in production.
    """
    logger.info("DEBUG endpoint accessed - fetching tasks without auth")
    try:
        tasks = await tasks_collection.find({}).to_list(length=100)
        
        # Convert ObjectId to string for all tasks
        for task in tasks:
            task["id"] = str(task["_id"])
        
        logger.info(f"DEBUG endpoint found {len(tasks)} tasks")
        return [Task(**task) for task in tasks]
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}"
        ) 