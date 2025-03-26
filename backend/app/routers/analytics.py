from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict
from datetime import datetime, timedelta, date
from ..models.analytics import TaskCompletion, UserPerformance, TeamPerformance, UserTaskHeatmap, AnalyticsDashboard
from ..utils.auth import get_current_user
from ..config.database import tasks_collection, users_collection
import pandas as pd
import numpy as np
from bson import ObjectId

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_analytics_dashboard(days: int = 30, current_user = Depends(get_current_user)):
    """
    Generate analytics dashboard data for PowerBI integration.
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get tasks within date range
    tasks = await tasks_collection.find({
        "$or": [
            {"created_at": {"$gte": start_date}},
            {"due_date": {"$gte": start_date}},
            {"completed_at": {"$gte": start_date}}
        ]
    }).to_list(length=1000)
    
    # Get users
    users = await users_collection.find().to_list(length=100)
    user_map = {str(user["_id"]): user for user in users}
    
    # Convert to pandas DataFrame for easier analysis
    tasks_df = pd.DataFrame(tasks)
    
    # If no tasks, return empty dashboard
    if tasks_df.empty:
        return AnalyticsDashboard(
            task_completion_trend=[],
            user_performances=[],
            team_performance=TeamPerformance(
                total_tasks=0,
                completed_tasks=0,
                overdue_tasks=0,
                completion_rate=0,
                tasks_by_priority={},
                tasks_by_status={}
            ),
            user_heatmaps=[]
        )
    
    # 1. Generate task completion trend
    completion_trend = []
    
    for i in range(days):
        day = start_date + timedelta(days=i)
        day_end = day + timedelta(days=1)
        day_date = day.date()
        
        # Count completed tasks for this day
        completed = sum(1 for task in tasks if 
                         task.get("completed_at") and 
                         day <= task["completed_at"] < day_end)
        
        # Count total tasks due this day
        total = sum(1 for task in tasks if 
                    task.get("due_date") and 
                    day.date() == task["due_date"].date())
        
        completion_trend.append(TaskCompletion(
            date=day_date,
            completed=completed,
            total=total
        ))
    
    # 2. Generate user performance metrics
    user_performances = []
    
    for user_id, user in user_map.items():
        # Filter tasks for this user
        user_tasks = [task for task in tasks if task.get("assigned_to") == user_id]
        
        if not user_tasks:
            continue
        
        # Count metrics
        tasks_completed = sum(1 for task in user_tasks if task.get("status") == "complete")
        tasks_overdue = sum(1 for task in user_tasks if task.get("status") == "overdue")
        tasks_total = len(user_tasks)
        
        # Calculate on-time percentage
        on_time_percentage = 0
        if tasks_completed > 0:
            on_time_tasks = sum(1 for task in user_tasks 
                               if task.get("status") == "complete" and 
                               task.get("completed_at") and 
                               task.get("due_date") and 
                               task["completed_at"] <= task["due_date"])
            on_time_percentage = (on_time_tasks / tasks_completed) * 100
        
        # Calculate average completion time in hours
        completion_times = []
        for task in user_tasks:
            if task.get("status") == "complete" and task.get("completed_at") and task.get("created_at"):
                time_diff = task["completed_at"] - task["created_at"]
                completion_times.append(time_diff.total_seconds() / 3600)  # Convert to hours
        
        avg_completion_time = None
        if completion_times:
            avg_completion_time = sum(completion_times) / len(completion_times)
        
        user_performances.append(UserPerformance(
            user_id=user_id,
            user_name=user.get("full_name", "Unknown"),
            tasks_completed=tasks_completed,
            tasks_overdue=tasks_overdue,
            tasks_total=tasks_total,
            on_time_percentage=on_time_percentage,
            average_completion_time=avg_completion_time
        ))
    
    # 3. Generate team performance metrics
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.get("status") == "complete")
    overdue_tasks = sum(1 for task in tasks if task.get("status") == "overdue")
    
    completion_rate = 0
    if total_tasks > 0:
        completion_rate = (completed_tasks / total_tasks) * 100
    
    # Count tasks by priority
    tasks_by_priority = {}
    for task in tasks:
        priority = task.get("priority", "medium")
        tasks_by_priority[priority] = tasks_by_priority.get(priority, 0) + 1
    
    # Count tasks by status
    tasks_by_status = {}
    for task in tasks:
        status = task.get("status", "todo")
        tasks_by_status[status] = tasks_by_status.get(status, 0) + 1
    
    team_performance = TeamPerformance(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        completion_rate=completion_rate,
        tasks_by_priority=tasks_by_priority,
        tasks_by_status=tasks_by_status
    )
    
    # 4. Generate user task heatmaps (missed tasks by day)
    user_heatmaps = []
    
    for user_id, user in user_map.items():
        # Filter tasks for this user
        user_tasks = [task for task in tasks if task.get("assigned_to") == user_id]
        
        if not user_tasks:
            continue
        
        # Count missed (overdue) tasks by day
        missed_tasks_by_day = {}
        
        for i in range(days):
            day = start_date + timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            
            # Count overdue tasks for this day
            missed_count = sum(1 for task in user_tasks if 
                              task.get("status") == "overdue" and 
                              task.get("due_date") and 
                              task["due_date"].date() == day.date())
            
            if missed_count > 0:
                missed_tasks_by_day[day_str] = missed_count
        
        user_heatmaps.append(UserTaskHeatmap(
            user_id=user_id,
            user_name=user.get("full_name", "Unknown"),
            missed_tasks_by_day=missed_tasks_by_day
        ))
    
    # Build and return dashboard
    return AnalyticsDashboard(
        task_completion_trend=completion_trend,
        user_performances=user_performances,
        team_performance=team_performance,
        user_heatmaps=user_heatmaps
    )

@router.get("/powerbi-data")
async def get_powerbi_data(days: int = 30, current_user = Depends(get_current_user)):
    """
    Get data for PowerBI integration in a format suitable for direct import.
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get tasks within date range
    tasks = await tasks_collection.find({
        "$or": [
            {"created_at": {"$gte": start_date}},
            {"due_date": {"$gte": start_date}},
            {"completed_at": {"$gte": start_date}}
        ]
    }).to_list(length=1000)
    
    # Get users
    users = await users_collection.find().to_list(length=100)
    
    # Convert ObjectId to string for all documents
    for task in tasks:
        task["_id"] = str(task["_id"])
        if "created_by" in task:
            task["created_by"] = str(task["created_by"])
        if "assigned_to" in task:
            task["assigned_to"] = str(task["assigned_to"])
    
    for user in users:
        user["_id"] = str(user["_id"])
    
    # Create user lookup dictionary
    user_map = {user["_id"]: user.get("full_name", "Unknown") for user in users}
    
    # Add user names to tasks for easier PowerBI visualization
    for task in tasks:
        if "created_by" in task and task["created_by"] in user_map:
            task["created_by_name"] = user_map[task["created_by"]]
        if "assigned_to" in task and task["assigned_to"] in user_map:
            task["assigned_to_name"] = user_map[task["assigned_to"]]
    
    # Return data for PowerBI
    return {
        "tasks": tasks,
        "users": users
    }

@router.get("/metrics/task-completion")
async def get_task_completion_metrics(days: int = 30, current_user = Depends(get_current_user)):
    """
    Get task completion metrics over time.
    """
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get tasks within date range
    tasks = await tasks_collection.find({
        "$or": [
            {"created_at": {"$gte": start_date}},
            {"due_date": {"$gte": start_date}},
            {"completed_at": {"$gte": start_date}}
        ]
    }).to_list(length=1000)
    
    # Generate daily metrics
    daily_metrics = []
    
    for i in range(days):
        day = start_date + timedelta(days=i)
        day_end = day + timedelta(days=1)
        day_str = day.strftime("%Y-%m-%d")
        
        # Count metrics for this day
        created = sum(1 for task in tasks if 
                      task.get("created_at") and 
                      day <= task["created_at"] < day_end)
        
        due = sum(1 for task in tasks if 
                  task.get("due_date") and 
                  day <= task["due_date"] < day_end)
        
        completed = sum(1 for task in tasks if 
                         task.get("completed_at") and 
                         day <= task["completed_at"] < day_end)
        
        overdue = sum(1 for task in tasks if 
                      task.get("due_date") and 
                      task["due_date"] < day_end and
                      task.get("status") == "overdue")
        
        daily_metrics.append({
            "date": day_str,
            "tasks_created": created,
            "tasks_due": due,
            "tasks_completed": completed,
            "tasks_overdue": overdue
        })
    
    return daily_metrics

@router.get("/metrics/user-performance")
async def get_user_performance_metrics(current_user = Depends(get_current_user)):
    """
    Get performance metrics for all users.
    """
    # Get all tasks
    tasks = await tasks_collection.find().to_list(length=1000)
    
    # Get users
    users = await users_collection.find().to_list(length=100)
    
    # Process performance metrics for each user
    user_metrics = []
    
    for user in users:
        user_id = str(user["_id"])
        user_tasks = [task for task in tasks if task.get("assigned_to") == user_id]
        
        if not user_tasks:
            continue
        
        # Calculate metrics
        tasks_total = len(user_tasks)
        tasks_completed = sum(1 for task in user_tasks if task.get("status") == "complete")
        tasks_overdue = sum(1 for task in user_tasks if task.get("status") == "overdue")
        tasks_in_progress = sum(1 for task in user_tasks if task.get("status") == "in_progress")
        
        # Calculate average completion time
        completion_times = []
        for task in user_tasks:
            if task.get("status") == "complete" and task.get("completed_at") and task.get("created_at"):
                time_diff = task["completed_at"] - task["created_at"]
                completion_times.append(time_diff.total_seconds() / 3600)  # Convert to hours
        
        avg_completion_time = None
        if completion_times:
            avg_completion_time = sum(completion_times) / len(completion_times)
        
        # Calculate on-time percentage
        on_time_percentage = 0
        if tasks_completed > 0:
            on_time_tasks = sum(1 for task in user_tasks 
                               if task.get("status") == "complete" and 
                               task.get("completed_at") and 
                               task.get("due_date") and 
                               task["completed_at"] <= task["due_date"])
            on_time_percentage = (on_time_tasks / tasks_completed) * 100
        
        user_metrics.append({
            "user_id": user_id,
            "user_name": user.get("full_name", "Unknown"),
            "tasks_total": tasks_total,
            "tasks_completed": tasks_completed,
            "tasks_overdue": tasks_overdue,
            "tasks_in_progress": tasks_in_progress,
            "completion_rate": (tasks_completed / tasks_total * 100) if tasks_total > 0 else 0,
            "on_time_percentage": on_time_percentage,
            "avg_completion_time": avg_completion_time
        })
    
    return user_metrics 