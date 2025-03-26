import random
import numpy as np
from deap import base, creator, tools, algorithms
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# Define the genetic algorithm for task allocation

def optimize_task_allocation(tasks: List[Dict], users: List[Dict]) -> List[Tuple[str, str]]:
    """
    Uses a genetic algorithm to optimize task allocation to users.
    
    Args:
        tasks: List of task dictionaries with id, priority, due_date, etc.
        users: List of user dictionaries with id, name, etc.
    
    Returns:
        List of (task_id, user_id) tuples representing the optimal allocation
    """
    if not tasks or not users:
        return []
    
    # Create fitness and individual classes
    creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMin)
    
    toolbox = base.Toolbox()
    
    # Helper function to generate a random allocation
    def generate_allocation():
        # For each task, assign a random user
        return [random.randint(0, len(users) - 1) for _ in range(len(tasks))]
    
    # Register the generation function
    toolbox.register("individual", tools.initIterate, creator.Individual, generate_allocation)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    
    # Define the evaluation function for our task allocation problem
    def evaluate_allocation(individual):
        # Initialize cost
        total_cost = 0
        
        # Track workload per user for balancing
        user_workloads = {user['id']: 0 for user in users}
        
        # For each task and its assigned user index
        for i, user_idx in enumerate(individual):
            task = tasks[i]
            user = users[user_idx]
            user_id = user['id']
            
            # Increase user's workload
            user_workloads[user_id] += 1
            
            # Factor 1: Priority cost - higher priority tasks should be prioritized
            priority_map = {
                'low': 1,
                'medium': 2,
                'high': 3,
                'critical': 4
            }
            priority_cost = 5 - priority_map.get(task['priority'], 1)  # Inverse of priority
            
            # Factor 2: Due date cost - sooner due dates should be prioritized
            now = datetime.now()
            due_date = task['due_date']
            days_left = max(0, (due_date - now).days)
            due_date_cost = min(days_left, 10)  # Cap at 10 days
            
            # Factor 3: User skill match cost (would need skill data)
            # For simplicity, we'll use a random value between 0-5
            skill_match_cost = random.randint(0, 5)
            
            # Combine costs with weights
            task_cost = (priority_cost * 3) + (due_date_cost * 2) + (skill_match_cost * 1)
            total_cost += task_cost
        
        # Factor 4: Workload balance penalty
        if len(users) > 1:
            workload_values = list(user_workloads.values())
            workload_std = np.std(workload_values)
            workload_penalty = workload_std * 10  # Penalize uneven distribution
            total_cost += workload_penalty
        
        return (total_cost,)
    
    # Register evaluation function
    toolbox.register("evaluate", evaluate_allocation)
    
    # Register genetic operators
    toolbox.register("mate", tools.cxTwoPoint)
    toolbox.register("mutate", tools.mutUniformInt, low=0, up=len(users)-1, indpb=0.2)
    toolbox.register("select", tools.selTournament, tournsize=3)
    
    # Run the genetic algorithm
    population = toolbox.population(n=50)
    ngen = 40  # Number of generations
    
    algorithms.eaSimple(population, toolbox, cxpb=0.5, mutpb=0.2, ngen=ngen, verbose=False)
    
    # Get the best individual
    best_individual = tools.selBest(population, k=1)[0]
    
    # Convert the best individual to task-user assignments
    assignments = []
    for i, user_idx in enumerate(best_individual):
        task_id = tasks[i]['id']
        user_id = users[user_idx]['id']
        assignments.append((task_id, user_id))
    
    return assignments

def get_task_status(task):
    """
    Determine the status of a task based on its due date and completion status.
    
    Args:
        task: A task dictionary with due_date and status fields
    
    Returns:
        String representing the status (todo, in_progress, complete, overdue)
    """
    now = datetime.now()
    
    # If task is already marked complete
    if task.get('status') == 'complete':
        return 'complete'
    
    # Check if task is overdue
    if task['due_date'] < now and task.get('status') != 'complete':
        return 'overdue'
    
    # Check if task is in progress
    if task.get('status') == 'in_progress':
        return 'in_progress'
    
    # Default to todo
    return 'todo'

def sort_tasks_for_user(tasks, user_id=None):
    """
    Sort tasks for a specific user based on priority and due date.
    
    Args:
        tasks: List of task dictionaries
        user_id: ID of the user to filter tasks for (optional)
    
    Returns:
        Sorted list of tasks
    """
    # Filter tasks for the user if user_id is provided
    if user_id:
        tasks = [t for t in tasks if t.get('assigned_to') == user_id]
    
    # Update task statuses based on current date/time
    for task in tasks:
        task['status'] = get_task_status(task)
    
    # Define priority order
    priority_order = {
        'critical': 0,
        'high': 1,
        'medium': 2,
        'low': 3
    }
    
    # Sort tasks by status (overdue first), then priority, then due date
    status_order = {
        'overdue': 0,
        'in_progress': 1, 
        'todo': 2,
        'complete': 3
    }
    
    sorted_tasks = sorted(
        tasks,
        key=lambda t: (
            status_order.get(t['status'], 999),
            priority_order.get(t['priority'], 999),
            t['due_date']
        )
    )
    
    return sorted_tasks 