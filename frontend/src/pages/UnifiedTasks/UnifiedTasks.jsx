import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaUser, FaBuilding, FaFilter, FaSortAmountDown, FaSortAmountUp, FaClock, FaSync } from 'react-icons/fa';
import axios from 'axios';
import './UnifiedTasks.css';

const UnifiedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([
    "Building A", "Building B", "Building C", "Building D", "Building E"
  ]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    facility: '',
    assigned_to: '',
    priority: 'Medium',
    status: 'Pending',
    time: '09:00'
  });
  const [viewMode, setViewMode] = useState(() => {
    // Get the view mode from localStorage or default to 'list'
    return localStorage.getItem('taskViewMode') || 'list';
  });
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  // Check for missed tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTasks = tasks.map(task => {
        if ((task.status === 'In Progress' || task.status === 'Pending') && new Date(task.due_date) < new Date()) {
          return { ...task, status: 'Missed' };
        }
        return task;
      });
      
      if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
        setTasks(updatedTasks);
        // Update tasks on the backend that have changed status
        updatedTasks.forEach(task => {
          if (task.status === 'Missed' && tasks.find(t => t.id === task.id)?.status !== 'Missed') {
            axios.put(`http://localhost:8000/api/tasks-fix/update-task/${task.id}`, {status: task.status})
              .catch(err => console.error('Error updating missed task:', err));
          }
        });

        // Update localStorage
        localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [tasks]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // First check if we have tasks in localStorage
      const localTasks = localStorage.getItem('localTasks');
      if (localTasks) {
        // Parse and normalize tasks from localStorage
        const parsedTasks = JSON.parse(localTasks);
        
        // Ensure consistent casing for status and priority
        const normalizedTasks = parsedTasks.map(task => ({
          ...task,
          status: normalizeStatus(task.status),
          priority: normalizePriority(task.priority)
        }));
        
        setTasks(normalizedTasks);
        setIsLoading(false);
        return;
      }
      
      // Try the list-test endpoint which we know works
      try {
        const response = await axios.get('http://localhost:8000/api/tasks-fix/list-test');
        
        // Check for missed tasks on initial load and normalize data
        const currentDate = new Date();
        const tasksWithMissedStatus = response.data.map(task => {
          const normalizedTask = {
            ...task,
            status: normalizeStatus(task.status),
            priority: normalizePriority(task.priority)
          };
          
          if ((normalizedTask.status === 'In Progress' || normalizedTask.status === 'Pending') && 
              new Date(normalizedTask.due_date) < currentDate) {
            return { ...normalizedTask, status: 'Missed' };
          }
          return normalizedTask;
        });
        
        setTasks(tasksWithMissedStatus);
        
        // Save to localStorage for persistence
        localStorage.setItem('localTasks', JSON.stringify(tasksWithMissedStatus));
      } catch (error) {
        console.error('Error with tasks-fix/list-test endpoint, trying debug endpoint:', error);
        // Fallback to debug endpoint if list-test endpoint fails
        const debugResponse = await axios.get('http://localhost:8000/api/tasks-fix/debug');
        const tasksWithMissedStatus = debugResponse.data.map(task => {
          const normalizedTask = {
            ...task,
            status: normalizeStatus(task.status),
            priority: normalizePriority(task.priority)
          };
          
          if ((normalizedTask.status === 'In Progress' || normalizedTask.status === 'Pending') && 
              new Date(normalizedTask.due_date) < currentDate) {
            return { ...normalizedTask, status: 'Missed' };
          }
          return normalizedTask;
        });
        
        setTasks(tasksWithMissedStatus);
        localStorage.setItem('localTasks', JSON.stringify(tasksWithMissedStatus));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks. Please refresh the page.');
      // Fallback to empty array
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to ensure consistent status capitalization
  const normalizeStatus = (status) => {
    if (!status) return 'Pending';
    
    // Map all status variations to our standard format
    const statusMap = {
      'pending': 'Pending',
      'in progress': 'In Progress',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'missed': 'Missed'
    };
    
    const lowerStatus = status.toLowerCase();
    return statusMap[lowerStatus] || status;
  };
  
  // Helper function to ensure consistent priority capitalization
  const normalizePriority = (priority) => {
    if (!priority) return 'Medium';
    
    // Map all priority variations to our standard format
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High'
    };
    
    const lowerPriority = priority.toLowerCase();
    return priorityMap[lowerPriority] || priority;
  };

  const fetchUsers = async () => {
    try {
      // Always use the working tasks-fix/users endpoint
      const response = await axios.get('http://localhost:8000/api/tasks-fix/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to dummy data if API fails
      setUsers([
        { id: '1', full_name: 'John Doe', email: 'john@example.com' },
        { id: '2', full_name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', full_name: 'Mike Johnson', email: 'mike@example.com' },
        { id: '4', full_name: 'Sarah Williams', email: 'sarah@example.com' },
        { id: '5', full_name: 'Robert Brown', email: 'robert@example.com' }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.due_date || !newTask.facility || !newTask.assigned_to) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Get the date and time parts
      const datePart = newTask.due_date;
      const timePart = newTask.time || '09:00';
      
      // Create an ISO string with the correct timezone
      const dueDate = new Date(`${datePart}T${timePart}:00`);
      
      // Create a task object
      const taskData = {
        title: newTask.title,
        description: newTask.description || "",
        due_date: dueDate.toISOString(), // Use ISO string with time
        priority: newTask.priority,
        status: newTask.status,
        assigned_to: newTask.assigned_to,
        // Additional fields from the form
        facility: newTask.facility,
        time: timePart, // Store time separately for display
        tags: []
      };

      // Try to save to the backend first
      let savedTask;
      try {
        const response = await axios.post('http://localhost:8000/api/tasks-fix/save-task', taskData);
        savedTask = response.data;
        console.log('Task saved to database:', savedTask);
      } catch (apiError) {
        console.error('Failed to save task to database, using local storage instead:', apiError);
        // If backend save fails, create a fake task ID
        savedTask = {
          ...taskData,
          id: `fake-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: "current-user",
          completed_at: null
        };
      }
      
      // Update local state
      const updatedTasks = [...tasks, savedTask];
      setTasks(updatedTasks);
      
      // Store tasks in localStorage for persistence across page refreshes
      localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
      
      // Try to send email notification if the user exists
      const assignedUser = users.find(user => user.id === newTask.assigned_to);
      if (assignedUser && assignedUser.email) {
        try {
          await axios.post('http://localhost:8000/api/tasks-fix/notify', {
            email: assignedUser.email,
            subject: `New Task Assigned: ${newTask.title}`,
            message: `You have been assigned a new task: ${newTask.title}. Due date: ${newTask.due_date}.`
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
      
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        facility: '',
        assigned_to: '',
        priority: 'Medium',
        status: 'Pending',
        time: '09:00'
      });
      setError('');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setIsLoading(true);
    try {
      // First update local state
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      
      // Update localStorage
      localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
      
      // Then try to delete from the backend
      await axios.delete(`http://localhost:8000/api/tasks-fix/${taskId}`);
      console.log('Task deleted from database');
      
      setError(''); // Clear any errors
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task from database, but it was removed locally.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    setIsLoading(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTask = { ...task, status: newStatus };
      
      // Check if the task due date is past and new status is "In Progress"
      if (newStatus === 'In Progress' && new Date(updatedTask.due_date) < new Date()) {
        updatedTask.status = 'Missed';
      }
      
      // Update local state first
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      setTasks(updatedTasks);
      
      // Store updated tasks in localStorage
      localStorage.setItem('localTasks', JSON.stringify(updatedTasks));
      
      // Try to update in the backend
      try {
        // Only send necessary fields for the update
        const updateData = {
          status: updatedTask.status
        };
        
        await axios.put(`http://localhost:8000/api/tasks-fix/update-task/${taskId}`, updateData);
        console.log('Task status updated in database');
      } catch (apiError) {
        console.error('API update failed, but local state was updated:', apiError);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortField === 'due_date') {
      return sortDirection === 'asc' 
        ? new Date(a.due_date) - new Date(b.due_date)
        : new Date(b.due_date) - new Date(a.due_date);
    }
    if (sortField === 'priority') {
      const priorityOrder = { Low: 1, Medium: 2, High: 3 };
      return sortDirection === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return sortDirection === 'asc'
      ? a[sortField].localeCompare(b[sortField])
      : b[sortField].localeCompare(a[sortField]);
  });

  const filteredTasks = filterStatus === 'all'
    ? sortedTasks
    : sortedTasks.filter(task => task.status === filterStatus);

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in progress': return 'status-in-progress';
      case 'pending': return 'status-pending';
      case 'missed': return 'status-missed';
      default: return '';
    }
  };

  const handleSyncTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch the latest tasks from the server
      const response = await axios.get('http://localhost:8000/api/tasks-fix/sync');
      const serverTasks = response.data;
      
      // Get current local tasks
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      
      // Create a map of task IDs for quick lookup
      const taskMap = new Map();
      localTasks.forEach(task => {
        if (!task.id.startsWith('fake-')) { // Only consider real tasks from backend
          taskMap.set(task.id, task);
        }
      });
      
      // Merge server tasks with local tasks
      serverTasks.forEach(task => {
        taskMap.set(task.id, task);
      });
      
      // Add local-only tasks that haven't been synced yet
      const localOnlyTasks = localTasks.filter(task => task.id.startsWith('fake-'));
      
      // Convert map back to array
      const mergedTasks = [...taskMap.values(), ...localOnlyTasks];
      
      // Update localStorage with merged tasks
      localStorage.setItem('localTasks', JSON.stringify(mergedTasks));
      
      // Update state
      setTasks(mergedTasks);
      setError('Tasks synchronized successfully!');
      
      // After 3 seconds, clear the success message
      setTimeout(() => {
        setError('');
      }, 3000);
    } catch (error) {
      console.error('Error syncing tasks:', error);
      setError('Failed to sync tasks with the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Save the view mode to localStorage
    localStorage.setItem('taskViewMode', mode);
  };

  return (
    <div className="unified-tasks">
      <h1 className="page-title">Task Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="task-controls">
        <div className="view-toggle">
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => handleViewModeChange('list')}
          >
            List View
          </button>
          <button 
            className={viewMode === 'kanban' ? 'active' : ''}
            onClick={() => handleViewModeChange('kanban')}
          >
            Kanban View
          </button>
          <button 
            className="sync-button"
            onClick={handleSyncTasks}
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'spinning' : ''} /> {isLoading ? 'Syncing...' : 'Sync Tasks'}
          </button>
        </div>
        
        <div className="task-filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Missed">Missed</option>
          </select>
          
          <button className="sort-button" onClick={() => handleSort('due_date')}>
            Sort by Date {sortField === 'due_date' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
          </button>
          
          <button className="sort-button" onClick={() => handleSort('priority')}>
            Sort by Priority {sortField === 'priority' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
          </button>
        </div>
      </div>
      
      <div className="add-task-section">
        <h2>Add New Task</h2>
        <div className="task-input">
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="title">Task Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="due_date">Due Date*</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={newTask.due_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="facility">Facility*</label>
              <select
                id="facility"
                name="facility"
                value={newTask.facility}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Facility</option>
                {facilities.map(facility => (
                  <option key={facility} value={facility}>{facility}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label htmlFor="assigned_to">Assigned To*</label>
              <select
                id="assigned_to"
                name="assigned_to"
                value={newTask.assigned_to}
                onChange={handleInputChange}
                required
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={newTask.priority}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="input-group">
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={newTask.time || "09:00"}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
          </div>
          
          <div className="input-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              placeholder="Enter task description"
              rows="3"
            ></textarea>
          </div>
          
          <button 
            className="add-task-button" 
            onClick={handleAddTask}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="task-list">
          <h2>Tasks ({filteredTasks.length})</h2>
          {isLoading && <div className="loading">Loading tasks...</div>}
          {!isLoading && filteredTasks.length === 0 && (
            <div className="no-tasks">No tasks found. Add a new task to get started.</div>
          )}
          {filteredTasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-details">
                <div className="detail-item">
                  <FaCalendarAlt /> 
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <FaBuilding /> 
                  <span>Facility: {task.facility}</span>
                </div>
                <div className="detail-item">
                  <FaUser /> 
                  <span>Assigned to: {
                    users.find(u => u.id === task.assigned_to)?.full_name || task.assigned_to
                  }</span>
                </div>
                <div className="detail-item">
                  <FaClock /> 
                  <span>Status: <span className={`status-text ${getStatusClass(task.status)}`}>{task.status}</span></span>
                </div>
              </div>
              <div className="task-actions">
                <div className="status-buttons">
                  <button 
                    className={`status-btn pending ${task.status === 'Pending' ? 'active' : ''}`}
                    onClick={() => handleUpdateTaskStatus(task.id, 'Pending')}
                    disabled={task.status === 'Pending'}
                  >
                    Pending
                  </button>
                  <button 
                    className={`status-btn in-progress ${task.status === 'In Progress' ? 'active' : ''}`}
                    onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                    disabled={task.status === 'In Progress'}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`status-btn completed ${task.status === 'Completed' ? 'active' : ''}`}
                    onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}
                    disabled={task.status === 'Completed'}
                  >
                    Completed
                  </button>
                </div>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          <div className="kanban-column">
            <h3 className="column-header pending">Pending</h3>
            {filteredTasks
              .filter(task => task.status === 'Pending')
              .map(task => (
                <div key={task.id} className={`kanban-card ${getPriorityClass(task.priority)}`}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="card-meta">
                    <span className="card-facility"><FaBuilding /> {task.facility}</span>
                    <span className="card-assignee"><FaUser /> {users.find(u => u.id === task.assigned_to)?.full_name || 'Unassigned'}</span>
                  </div>
                  <div className="card-footer">
                    <span>{new Date(task.due_date).toLocaleDateString()} {task.time || "09:00"}</span>
                    <button onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}>
                      Move to In Progress
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="kanban-column">
            <h3 className="column-header in-progress">In Progress</h3>
            {filteredTasks
              .filter(task => task.status === 'In Progress')
              .map(task => (
                <div key={task.id} className={`kanban-card ${getPriorityClass(task.priority)}`}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="card-meta">
                    <span className="card-facility"><FaBuilding /> {task.facility}</span>
                    <span className="card-assignee"><FaUser /> {users.find(u => u.id === task.assigned_to)?.full_name || 'Unassigned'}</span>
                  </div>
                  <div className="card-footer">
                    <span>{new Date(task.due_date).toLocaleDateString()} {task.time || "09:00"}</span>
                    <button onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}>
                      Move to Completed
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="kanban-column">
            <h3 className="column-header completed">Completed</h3>
            {filteredTasks
              .filter(task => task.status === 'Completed')
              .map(task => (
                <div key={task.id} className={`kanban-card ${getPriorityClass(task.priority)}`}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="card-meta">
                    <span className="card-facility"><FaBuilding /> {task.facility}</span>
                    <span className="card-assignee"><FaUser /> {users.find(u => u.id === task.assigned_to)?.full_name || 'Unassigned'}</span>
                  </div>
                  <div className="card-footer">
                    <span>{new Date(task.due_date).toLocaleDateString()} {task.time || "09:00"}</span>
                    <button onClick={() => handleDeleteTask(task.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="kanban-column">
            <h3 className="column-header missed">Missed</h3>
            {filteredTasks
              .filter(task => task.status === 'Missed')
              .map(task => (
                <div key={task.id} className={`kanban-card ${getPriorityClass(task.priority)}`}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="card-meta">
                    <span className="card-facility"><FaBuilding /> {task.facility}</span>
                    <span className="card-assignee"><FaUser /> {users.find(u => u.id === task.assigned_to)?.full_name || 'Unassigned'}</span>
                  </div>
                  <div className="card-footer">
                    <span>{new Date(task.due_date).toLocaleDateString()} {task.time || "09:00"}</span>
                    <button onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}>
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedTasks; 