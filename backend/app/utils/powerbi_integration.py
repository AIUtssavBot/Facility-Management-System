import pandas as pd
import json
from fastapi import HTTPException
from datetime import datetime, timedelta

def prepare_data_for_powerbi(tasks, users):
    """
    Prepare data in a suitable format for PowerBI.
    
    Args:
        tasks: List of task documents
        users: List of user documents
    
    Returns:
        Dictionary of DataFrames ready for export
    """
    try:
        # Convert to pandas DataFrames for easier manipulation
        tasks_df = pd.DataFrame(tasks)
        users_df = pd.DataFrame(users)
        
        # Create a user lookup dictionary
        user_map = {}
        if not users_df.empty and '_id' in users_df.columns and 'full_name' in users_df.columns:
            user_map = users_df.set_index('_id')['full_name'].to_dict()
        
        # Add user names to tasks if not already present
        if not tasks_df.empty:
            if 'created_by' in tasks_df.columns and 'created_by_name' not in tasks_df.columns:
                tasks_df['created_by_name'] = tasks_df['created_by'].map(user_map).fillna('Unknown')
                
            if 'assigned_to' in tasks_df.columns and 'assigned_to_name' not in tasks_df.columns:
                tasks_df['assigned_to_name'] = tasks_df['assigned_to'].map(user_map).fillna('Unassigned')
        
        # Generate summary data frames
        
        # 1. Task status summary
        if not tasks_df.empty and 'status' in tasks_df.columns:
            status_summary = tasks_df['status'].value_counts().reset_index()
            status_summary.columns = ['status', 'count']
        else:
            status_summary = pd.DataFrame(columns=['status', 'count'])
        
        # 2. Task priority summary
        if not tasks_df.empty and 'priority' in tasks_df.columns:
            priority_summary = tasks_df['priority'].value_counts().reset_index()
            priority_summary.columns = ['priority', 'count']
        else:
            priority_summary = pd.DataFrame(columns=['priority', 'count'])
        
        # 3. User performance summary
        user_performance = []
        
        if not tasks_df.empty and 'assigned_to' in tasks_df.columns:
            for user_id, user_name in user_map.items():
                user_tasks = tasks_df[tasks_df['assigned_to'] == user_id]
                
                if len(user_tasks) == 0:
                    continue
                
                completed = len(user_tasks[user_tasks['status'] == 'complete'])
                overdue = len(user_tasks[user_tasks['status'] == 'overdue'])
                total = len(user_tasks)
                
                user_performance.append({
                    'user_id': user_id,
                    'user_name': user_name,
                    'tasks_completed': completed,
                    'tasks_overdue': overdue,
                    'tasks_total': total,
                    'completion_rate': (completed / total * 100) if total > 0 else 0
                })
        
        user_performance_df = pd.DataFrame(user_performance)
        
        return {
            'tasks': tasks_df.to_dict(orient='records') if not tasks_df.empty else [],
            'users': users_df.to_dict(orient='records') if not users_df.empty else [],
            'status_summary': status_summary.to_dict(orient='records'),
            'priority_summary': priority_summary.to_dict(orient='records'),
            'user_performance': user_performance_df.to_dict(orient='records') if not user_performance_df.empty else []
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prepare data for PowerBI: {str(e)}")

def generate_powerbi_export(tasks, users, days=30):
    """
    Generate data in the format expected by PowerBI.
    
    Args:
        tasks: List of task documents
        users: List of user documents
        days: Number of days to include in time-series data
    
    Returns:
        JSON string with PowerBI-compatible data
    """
    try:
        data = prepare_data_for_powerbi(tasks, users)
        
        # Add time-series data for trending
        time_series = []
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        tasks_df = pd.DataFrame(tasks)
        
        if not tasks_df.empty and 'created_at' in tasks_df.columns:
            # Convert datetime columns to pandas datetime if they aren't already
            for col in ['created_at', 'due_date', 'completed_at']:
                if col in tasks_df.columns:
                    if tasks_df[col].dtype != 'datetime64[ns]':
                        tasks_df[col] = pd.to_datetime(tasks_df[col], errors='coerce')
        
            # Generate daily metrics
            for i in range(days):
                day = start_date + timedelta(days=i)
                day_end = day + timedelta(days=1)
                
                # Filter tasks for this day
                created = len(tasks_df[(tasks_df['created_at'] >= day) & (tasks_df['created_at'] < day_end)])
                completed = len(tasks_df[(tasks_df['completed_at'] >= day) & (tasks_df['completed_at'] < day_end)])
                due = len(tasks_df[(tasks_df['due_date'] >= day) & (tasks_df['due_date'] < day_end)])
                
                time_series.append({
                    'date': day.strftime('%Y-%m-%d'),
                    'tasks_created': created,
                    'tasks_completed': completed,
                    'tasks_due': due
                })
        
        data['time_series'] = time_series
        
        return json.dumps(data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PowerBI export: {str(e)}")

def generate_heatmap_data(tasks, users):
    """
    Generate data specifically for user missed task heatmaps in PowerBI.
    
    Args:
        tasks: List of task documents
        users: List of user documents
    
    Returns:
        Dictionary with heatmap data
    """
    try:
        # Convert to pandas DataFrames
        tasks_df = pd.DataFrame(tasks)
        users_df = pd.DataFrame(users)
        
        heatmap_data = []
        
        # Skip if no tasks or missing data
        if tasks_df.empty or 'due_date' not in tasks_df.columns or 'assigned_to' not in tasks_df.columns:
            return {'heatmap_data': heatmap_data}
        
        # Create a user lookup dictionary
        user_map = {}
        if not users_df.empty and '_id' in users_df.columns and 'full_name' in users_df.columns:
            user_map = users_df.set_index('_id')['full_name'].to_dict()
        
        # Convert due_date to datetime if not already
        if tasks_df['due_date'].dtype != 'datetime64[ns]':
            tasks_df['due_date'] = pd.to_datetime(tasks_df['due_date'], errors='coerce')
        
        # Filter to only include overdue tasks
        overdue_tasks = tasks_df[tasks_df['status'] == 'overdue']
        
        # Group by user and date
        if not overdue_tasks.empty:
            overdue_tasks['due_date_day'] = overdue_tasks['due_date'].dt.date
            
            # Group and count
            grouped = overdue_tasks.groupby(['assigned_to', 'due_date_day']).size().reset_index()
            grouped.columns = ['user_id', 'date', 'missed_count']
            
            # Add user names
            grouped['user_name'] = grouped['user_id'].map(user_map).fillna('Unknown')
            
            # Convert date to string format YYYY-MM-DD
            grouped['date'] = grouped['date'].astype(str)
            
            heatmap_data = grouped.to_dict(orient='records')
        
        return {'heatmap_data': heatmap_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate heatmap data: {str(e)}") 