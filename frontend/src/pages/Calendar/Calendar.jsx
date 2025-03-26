"use client"

import { useState, useEffect } from "react"
import { FaPlus, FaChevronLeft, FaChevronRight, FaSync, FaUser } from "react-icons/fa"
import axios from "axios"
import "./Calendar.css"

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])
  const [tasks, setTasks] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [users, setUsers] = useState([])
  const [facilities, setFacilities] = useState([
    "Building A", 
    "Building B", 
    "Building C", 
    "Exterior", 
    "All Buildings"
  ])
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    facility: "Building A",
    assigned_to: "",
    priority: "Medium",
    status: "Pending",
    time: "09:00"
  })
  const [isSyncing, setIsSyncing] = useState(false)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Generate random color for task highlights
  const getRandomColor = () => {
    const colors = ["#4361ee", "#3a86ff", "#ff9f1c", "#2ec4b6", "#e63946", "#588157", "#8338ec", "#fb8500"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Sync tasks with the server
  const handleSyncTasks = async () => {
    setIsSyncing(true)
    try {
      // Fetch tasks from backend
      const response = await axios.get('http://localhost:8000/api/tasks-fix/sync')
      const serverTasks = response.data
      
      // Get local tasks
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]')
      
      // Normalize server tasks
      const normalizedServerTasks = serverTasks.map(task => ({
        ...task,
        status: normalizeStatus(task.status),
        priority: normalizePriority(task.priority)
      }))
      
      // Normalize local tasks
      const normalizedLocalTasks = localTasks.map(task => ({
        ...task,
        status: normalizeStatus(task.status),
        priority: normalizePriority(task.priority)
      }))
      
      // Merge tasks from server and local storage
      const taskMap = new Map()
      
      // Add local tasks to map
      normalizedLocalTasks.forEach(task => {
        if (!task.id.startsWith('fake-') && !task.id.startsWith('dummy-')) {
          taskMap.set(task.id, task)
        }
      })
      
      // Merge in server tasks
      normalizedServerTasks.forEach(task => {
        taskMap.set(task.id, task)
      })
      
      // Keep local-only tasks
      const localOnlyTasks = normalizedLocalTasks.filter(task => 
        task.id.startsWith('fake-') || task.id.startsWith('dummy-')
      )
      
      // Create final merged list
      const mergedTasks = [...taskMap.values(), ...localOnlyTasks]
      
      // Update localStorage
      localStorage.setItem('localTasks', JSON.stringify(mergedTasks))
      
      // Convert to calendar format
      const calendarTasks = mergedTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        facility: task.facility || "Building A",
        priority: task.priority,
        date: new Date(task.due_date),
        time: task.time || "09:00",
        assigned_to: task.assigned_to,
        status: task.status,
        color: getRandomColor(),
      }))
      
      // Update state
      setTasks(calendarTasks)
      
    } catch (error) {
      console.error("Error syncing tasks:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Fetch users function
  const fetchUsers = async () => {
    try {
      // Use the working tasks-fix/users endpoint
      const response = await axios.get("http://localhost:8000/api/tasks-fix/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to some default users if API fails
      setUsers([
        { id: "1", full_name: "John Doe", email: "john@example.com" },
        { id: "2", full_name: "Jane Smith", email: "jane@example.com" },
        { id: "3", full_name: "Mike Johnson", email: "mike@example.com" },
        { id: "4", full_name: "Sarah Williams", email: "sarah@example.com" },
        { id: "5", full_name: "Robert Brown", email: "robert@example.com" }
      ]);
    }
  };

  // Fetch tasks from backend
  useEffect(() => {
    fetchTasks();
    fetchUsers();
    generateCalendarDays();
  }, []);

  // Re-generate calendar when month changes
  useEffect(() => {
    generateCalendarDays()
  }, [currentDate])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (previous month days + current month days)
    const totalDays = daysFromPrevMonth + lastDay.getDate()

    // Calculate rows needed (7 days per row)
    const rows = Math.ceil(totalDays / 7)

    // Calculate total cells in the calendar
    const totalCells = rows * 7

    const days = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = 0; i < daysFromPrevMonth; i++) {
      const day = prevMonthLastDay - daysFromPrevMonth + i + 1
      days.push({
        day,
        month: month - 1 < 0 ? 11 : month - 1,
        year: month - 1 < 0 ? year - 1 : year,
        isCurrentMonth: false,
      })
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      })
    }

    // Add days from next month
    const remainingCells = totalCells - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: month + 1 > 11 ? 0 : month + 1,
        year: month + 1 > 11 ? year + 1 : year,
        isCurrentMonth: false,
      })
    }

    setCalendarDays(days)
  }

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

  const fetchTasks = async () => {
    try {
      // First check localStorage for tasks
      const localTasks = localStorage.getItem('localTasks');
      if (localTasks) {
        // Parse the tasks from localStorage
        const parsedTasks = JSON.parse(localTasks);
        
        // Convert localStorage tasks to calendar format with normalized values
        const calendarTasks = parsedTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          facility: task.facility,
          priority: normalizePriority(task.priority),
          date: new Date(task.due_date),
          time: task.time || "09:00",
          assigned_to: task.assigned_to,
          status: normalizeStatus(task.status),
          color: getRandomColor(),
        }));
        
        setTasks(calendarTasks);
        return;
      }
      
      // If no localStorage tasks, try the API
      try {
        const response = await axios.get("http://localhost:8000/api/tasks-fix/list-test");
        
        // Convert API tasks to calendar format with normalized values
        const calendarTasks = response.data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          facility: task.facility || "Building A",
          priority: normalizePriority(task.priority || "Medium"),
          date: new Date(task.due_date),
          time: task.time || "09:00",
          assigned_to: task.assigned_to,
          status: normalizeStatus(task.status || "Pending"),
          color: getRandomColor(),
        }));
        
        setTasks(calendarTasks);
        
        // Save these tasks to localStorage for persistence
        const localStorageFormat = calendarTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          facility: task.facility,
          priority: task.priority,
          due_date: task.date.toISOString(),
          time: task.time,
          assigned_to: task.assigned_to,
          status: task.status
        }));
        
        localStorage.setItem('localTasks', JSON.stringify(localStorageFormat));
      } catch (error) {
        console.error("Error fetching tasks from API:", error);
        
        // Fall back to using dummy data if both localStorage and API fail
        const dummyTasks = [
          {
            id: "dummy-1",
            title: "HVAC Maintenance",
            description: "Regular maintenance check for HVAC systems",
            facility: "Building A",
            priority: "High",
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
            time: "10:00",
            assigned_to: "1",
            status: "Pending",
            color: getRandomColor(),
          },
          {
            id: "dummy-2",
            title: "Plumbing Repair",
            description: "Fix leaking pipe in restroom",
            facility: "Building B",
            priority: "High",
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2),
            time: "14:30",
            assigned_to: "2",
            status: "Pending",
            color: getRandomColor(),
          }
        ];
        
        setTasks(dummyTasks);
        
        // Save dummy tasks to localStorage
        const localStorageFormat = dummyTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          facility: task.facility,
          priority: task.priority,
          due_date: task.date.toISOString(),
          time: task.time,
          assigned_to: task.assigned_to,
          status: task.status
        }));
        
        localStorage.setItem('localTasks', JSON.stringify(localStorageFormat));
      }
    } catch (error) {
      console.error("Error in fetchTasks:", error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Format selected date for the form
  const formatDateForInput = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Set new task values when a day is selected
  const handleDateClick = (day) => {
    // If clicking on a day from another month, switch to that month
    if (!day.isCurrentMonth) {
      setCurrentDate(new Date(day.year, day.month, 1))
    }

    const clickedDate = new Date(day.year, day.month, day.day)
    setSelectedDate(clickedDate)
    
    // Automatically set the due_date field in the newTask
    setNewTask(prev => ({
      ...prev,
      due_date: formatDateForInput(clickedDate)
    }))
  }

  const handleAddTask = () => {
    setShowAddTask(true)
  }

  const handleCancelAdd = () => {
    setShowAddTask(false)
    setNewTask({
      title: "",
      description: "",
      due_date: formatDateForInput(selectedDate),
      facility: "Building A",
      assigned_to: "",
      priority: "Medium",
      status: "Pending",
      time: "09:00"
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      // Format date
      const selectedDay = selectedDate.getDate();
      const selectedMonth = selectedDate.getMonth() + 1;
      const selectedYear = selectedDate.getFullYear();
      const formattedDueDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      
      // Normalize status and priority
      const normalizedStatus = normalizeStatus(newTask.status);
      const normalizedPriority = normalizePriority(newTask.priority);
      
      // Create task data object
      const taskData = {
        title: newTask.title,
        description: newTask.description || "",
        facility: newTask.facility,
        priority: normalizedPriority,
        status: normalizedStatus,
        assigned_to: newTask.assigned_to,
        due_date: new Date(`${formattedDueDate}T${newTask.time || "09:00"}:00`).toISOString(),
        time: newTask.time || "09:00",
      };
      
      // Try to save to backend
      let savedTask;
      try {
        const response = await axios.post('http://localhost:8000/api/tasks-fix/save-task', taskData);
        savedTask = response.data;
        console.log('Task saved to database:', savedTask);
      } catch (error) {
        console.error('Failed to save task to backend:', error);
        // Create fake task ID if backend fails
        savedTask = {
          ...taskData,
          id: `fake-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      // Create calendar task object
      const calendarTask = {
        id: savedTask.id,
        title: savedTask.title,
        description: savedTask.description,
        facility: savedTask.facility,
        priority: normalizedPriority,
        date: new Date(savedTask.due_date),
        time: savedTask.time || newTask.time || "09:00",
        assigned_to: savedTask.assigned_to,
        status: normalizedStatus,
        color: getRandomColor(),
      };
      
      // Update calendar tasks state
      const updatedTasks = [...tasks, calendarTask];
      setTasks(updatedTasks);
      
      // Get existing tasks from localStorage and add the new one
      const existingTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      
      // Convert calendar task to localStorage format
      const localStorageTask = {
        id: savedTask.id,
        title: savedTask.title,
        description: savedTask.description,
        facility: savedTask.facility,
        priority: normalizedPriority,
        due_date: savedTask.due_date,
        time: savedTask.time || newTask.time || "09:00",
        assigned_to: savedTask.assigned_to,
        status: normalizedStatus
      };
      
      const updatedLocalTasks = [...existingTasks, localStorageTask];
      
      // Save to localStorage for persistence and sharing with UnifiedTasks
      localStorage.setItem('localTasks', JSON.stringify(updatedLocalTasks));
      
      // Try to send email notification if user exists
      const assignedUser = users.find(user => user.id === newTask.assigned_to);
      if (assignedUser && assignedUser.email) {
        try {
          await axios.post('http://localhost:8000/api/tasks-fix/notify', {
            email: assignedUser.email,
            subject: `New Task Assigned: ${newTask.title}`,
            message: `You have been assigned a new task: ${newTask.title}. Due date: ${formattedDueDate} at ${newTask.time || "09:00"}.`
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
      
      // Reset form and close it
      setShowAddTask(false)
      setNewTask({
        title: "",
        description: "",
        due_date: formatDateForInput(selectedDate),
        facility: "Building A",
        assigned_to: "",
        priority: "Medium",
        status: "Pending",
        time: "09:00"
      })
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  // Get tasks for the selected date
  const getTasksForDate = (date) => {
    return tasks.filter(
      (task) =>
        task.date.getDate() === date.getDate() &&
        task.date.getMonth() === date.getMonth() &&
        task.date.getFullYear() === date.getFullYear(),
    )
  }

  // Check if a day has tasks
  const hasTasksForDay = (day) => {
    return tasks.some(
      (task) =>
        task.date.getDate() === day.day && task.date.getMonth() === day.month && task.date.getFullYear() === day.year,
    )
  }

  // Format date for display
  const formatDate = (date) => {
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  // Check for missed tasks and update status
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTasks = tasks.map(task => {
        if ((task.status === 'In Progress' || task.status === 'Pending') && new Date(task.date) < new Date()) {
          return { ...task, status: 'Missed' };
        }
        return task;
      });
      
      if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
        setTasks(updatedTasks);
        
        // Update localStorage
        const localStorageFormat = updatedTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          facility: task.facility,
          priority: task.priority,
          due_date: task.date.toISOString(),
          time: task.time,
          assigned_to: task.assigned_to,
          status: task.status
        }));
        
        localStorage.setItem('localTasks', JSON.stringify(localStorageFormat));
        
        // Update backend if needed
        updatedTasks.forEach(task => {
          if (task.status === 'Missed' && tasks.find(t => t.id === task.id)?.status !== 'Missed') {
            axios.put(`http://localhost:8000/api/tasks-fix/update-task/${task.id}`, {status: task.status})
              .catch(err => console.error('Error updating missed task:', err));
          }
        });
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <div className="calendar-page fade-in">
      <div className="calendar-header">
        <h1 className="page-title">Calendar</h1>
        <div className="calendar-navigation">
          <button className="nav-btn" onClick={handlePrevMonth}>
            <FaChevronLeft />
          </button>
          <h2 className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button className="nav-btn" onClick={handleNextMonth}>
            <FaChevronRight />
          </button>
        </div>
        <button 
          className="sync-btn" 
          onClick={handleSyncTasks}
          disabled={isSyncing}
        >
          <FaSync className={isSyncing ? "spinning" : ""} />
          {isSyncing ? "Syncing..." : "Sync Tasks"}
        </button>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Day names row */}
          {dayNames.map((day, index) => (
            <div key={index} className="day-name">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? "other-month" : ""} ${
                selectedDate.getDate() === day.day &&
                selectedDate.getMonth() === day.month &&
                selectedDate.getFullYear() === day.year
                  ? "selected"
                  : ""
              } ${
                new Date().getDate() === day.day &&
                new Date().getMonth() === day.month &&
                new Date().getFullYear() === day.year
                  ? "today"
                  : ""
              }`}
              onClick={() => handleDateClick(day)}
            >
              <div className="day-number">{day.day}</div>
              {hasTasksForDay(day) && (
                <div className="task-indicators">
                  {tasks
                    .filter(
                      (task) =>
                        task.date.getDate() === day.day &&
                        task.date.getMonth() === day.month &&
                        task.date.getFullYear() === day.year,
                    )
                    .slice(0, 3)
                    .map((task, i) => (
                      <div key={i} className="task-indicator" style={{ backgroundColor: task.color }}></div>
                    ))}
                  {tasks.filter(
                    (task) =>
                      task.date.getDate() === day.day &&
                      task.date.getMonth() === day.month &&
                      task.date.getFullYear() === day.year,
                  ).length > 3 && <div className="more-tasks">+</div>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="selected-date-tasks">
          <div className="selected-date-header">
            <h3>{formatDate(selectedDate)}</h3>
            <button className="add-task-btn" onClick={handleAddTask}>
              <FaPlus /> Add Task
            </button>
          </div>

          {showAddTask && (
            <div className="add-task-form-container slide-in">
              <form className="add-task-form" onSubmit={handleSubmitTask}>
                <h4>Add New Task for {formatDate(selectedDate)}</h4>

                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="2"
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="facility">Facility</label>
                    <select
                      id="facility"
                      name="facility"
                      value={newTask.facility}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      {facilities.map((facility, index) => (
                        <option key={index} value={facility}>{facility}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="time">Time</label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={newTask.time}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="assigned_to">Assigned To</label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={newTask.assigned_to}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCancelAdd}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="tasks-for-date">
            {getTasksForDate(selectedDate).length === 0 ? (
              <p className="no-tasks">No tasks scheduled for this date.</p>
            ) : (
              <div className="task-list-for-date">
                {getTasksForDate(selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((task) => (
                    <div key={task.id} className="task-item slide-in" style={{ borderLeftColor: task.color }}>
                      <div className="task-time">{task.time || "09:00"}</div>
                      <div className="task-content">
                        <h4 className="task-title">{task.title}</h4>
                        <p className="task-description">{task.description}</p>
                        <div className="task-details">
                          <span className="task-facility">{task.facility}</span>
                          <span className={`task-priority ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                          <span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="task-assignment">
                          <span className="assigned-user">
                            <FaUser /> Assigned to: {users.find(user => user.id === task.assigned_to)?.full_name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar

