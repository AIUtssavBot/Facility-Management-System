import random
from datetime import datetime

# Define the task allocation problem
class TaskAllocationProblem:
    def __init__(self, tasks, users):
        self.tasks = tasks
        self.users = users
        
    def get_priority_value(self, priority):
        """Convert priority string to numeric value"""
        if isinstance(priority, str):
            priorities = {"Low": 1, "Medium": 2, "High": 3}
            return priorities.get(priority, 1)
        return 1  # Default priority if not found
        
    def get_days_until_due(self, due_date):
        """Calculate days until due date"""
        if not due_date:
            return 30  # Default if no due date
            
        try:
            if isinstance(due_date, str):
                due = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            else:
                due = due_date
                
            now = datetime.now()
            days = (due - now).days
            return max(0, days)  # Ensure non-negative
        except (ValueError, TypeError):
            return 30  # Default if error parsing date

    def fitness(self, allocation):
        """
        Calculate the fitness of a given allocation
        Higher value means better allocation
        """
        total_fitness = 0
        
        for task_idx, user_idx in enumerate(allocation):
            if task_idx >= len(self.tasks) or user_idx >= len(self.users):
                continue
                
            task = self.tasks[task_idx]
            user = self.users[user_idx]
            
            # Calculate priority score (higher priority = higher score)
            priority_value = self.get_priority_value(task.get('priority', 'Medium'))
            
            # Calculate urgency score (closer due date = higher score)
            days_until_due = self.get_days_until_due(task.get('due_date'))
            urgency_score = max(1, 30 - days_until_due) / 30  # Normalize to 0-1
            
            # Combine factors (customize weights as needed)
            task_score = (priority_value * 3) * urgency_score
            
            total_fitness += task_score
            
        return total_fitness

    def mutate(self, allocation):
        """Randomly change part of the allocation"""
        if not allocation or not self.users:
            return
            
        # Choose a random position to mutate
        pos = random.randint(0, len(allocation) - 1)
        # Assign a random user
        allocation[pos] = random.randint(0, len(self.users) - 1)

    def crossover(self, parent1, parent2):
        """Combine two allocations to create a new one"""
        if not parent1 or not parent2:
            return parent1 or parent2 or []
            
        crossover_point = len(parent1) // 2
        child = parent1[:crossover_point] + parent2[crossover_point:]
        return child

def optimize_task_allocation(tasks, users, population_size=20, generations=50):
    """
    Run the genetic algorithm to optimize task allocation
    
    Args:
        tasks: List of task objects with id, priority, due_date
        users: List of user objects with id
        population_size: Size of the population (default: 20)
        generations: Number of generations to run (default: 50)
        
    Returns:
        Dict mapping task IDs to user IDs for the best allocation
    """
    # Initialize the problem
    problem = TaskAllocationProblem(tasks, users)
    
    # Convert object IDs to indices for easier handling
    task_id_to_idx = {task.get('_id', i): i for i, task in enumerate(tasks)}
    user_id_to_idx = {user.get('_id', i): i for i, user in enumerate(users)}
    
    # Initialize population - each individual is a list where index=task, value=user
    population = []
    for _ in range(population_size):
        individual = [random.randint(0, len(users)-1) for _ in range(len(tasks))]
        population.append(individual)
    
    # Run the genetic algorithm
    for generation in range(generations):
        # Evaluate fitness
        fitness_scores = [problem.fitness(allocation) for allocation in population]
        
        # Select the best solutions - ensure non-zero weights
        weights = [max(0.1, score) for score in fitness_scores]
        selected = random.choices(population, weights=weights, k=max(5, population_size//2))
        
        # Generate new population
        new_population = []
        while len(new_population) < population_size:
            if len(selected) >= 2:
                parent1, parent2 = random.sample(selected, 2)
                child = problem.crossover(parent1, parent2)
                problem.mutate(child)
                new_population.append(child)
            else:
                # Not enough parents, just copy the existing ones
                new_population.extend(selected)
        
        population = new_population[:population_size]
    
    # Get the best allocation
    best_allocation = max(population, key=problem.fitness)
    
    # Convert back to task_id -> user_id mapping
    result = {}
    for task_idx, user_idx in enumerate(best_allocation):
        if task_idx < len(tasks) and user_idx < len(users):
            task_id = str(tasks[task_idx].get('_id', task_idx))
            user_id = str(users[user_idx].get('_id', user_idx))
            result[task_id] = user_id
    
    return result 