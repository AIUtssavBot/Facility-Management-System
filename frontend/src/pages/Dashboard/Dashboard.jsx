"use client"

import { useState, useEffect } from "react"
import { FaBuilding, FaUsers, FaTasks, FaClipboardCheck } from "react-icons/fa"
import axios from "axios"
import "./Dashboard.css"

const Dashboard = () => {
  const [stats, setStats] = useState({
    facilities: 0,
    staff: 0,
    tasks: 0,
    completed: 0,
  })
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return 'Yesterday';
    }
  };

  // Fetch real data on load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get facilities (predefined list for now)
        const facilities = ["Building A", "Building B", "Building C", "Building D", "Building E"];
        
        // Get users from API
        let users = [];
        try {
          const response = await axios.get('http://localhost:8000/api/tasks-fix/users');
          users = response.data || [];
        } catch (error) {
          console.error('Error fetching users:', error);
          users = [
            { id: '1', full_name: 'John Doe', email: 'john@example.com' },
            { id: '2', full_name: 'Jane Smith', email: 'jane@example.com' },
            { id: '3', full_name: 'Mike Johnson', email: 'mike@example.com' },
            { id: '4', full_name: 'Sarah Williams', email: 'sarah@example.com' },
            { id: '5', full_name: 'Robert Brown', email: 'robert@example.com' }
          ];
        }
        
        // Get task statistics
        try {
          const taskStatsResponse = await axios.get('http://localhost:8000/api/tasks-fix/task-stats/all');
          const taskStats = taskStatsResponse.data;
          
          setStats({
            facilities: facilities.length,
            staff: users.length,
            tasks: taskStats.total,
            completed: taskStats.completed,
          });
        } catch (error) {
          console.error('Error fetching task stats:', error);
          
          // Fallback to localStorage
          const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
          const totalTasks = localTasks.length;
          const completedTasks = localTasks.filter(task => task.status.toLowerCase() === 'completed').length;
          
          setStats({
            facilities: facilities.length,
            staff: users.length,
            tasks: totalTasks,
            completed: completedTasks,
          });
        }

        // Fetch recent activities
        try {
          const activitiesResponse = await axios.get('http://localhost:8000/api/tasks-fix/recent-activities');
          if (activitiesResponse.data) {
            setActivities(activitiesResponse.data);
          }
        } catch (error) {
          console.error('Error fetching activities:', error);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({
          facilities: 5,
          staff: 12,
          tasks: 0,
          completed: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Format activity message
  const formatActivityMessage = (activity) => {
    const facility = activity.facility ? ` in ${activity.facility}` : '';
    const user = activity.user ? ` by ${activity.user}` : '';
    return `${activity.task_title} was ${activity.action}${facility}${user}`;
  };

  return (
    <div className="dashboard fade-in">
      <h1 className="page-title">Facility Management Dashboard</h1>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon facility-icon">
            <FaBuilding />
          </div>
          <div className="stat-details">
            <h3>{stats.facilities}</h3>
            <p>Facilities</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon staff-icon">
            <FaUsers />
          </div>
          <div className="stat-details">
            <h3>{stats.staff}</h3>
            <p>Staff Members</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon task-icon">
            <FaTasks />
          </div>
          <div className="stat-details">
            <h3>{stats.tasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed-icon">
            <FaClipboardCheck />
          </div>
          <div className="stat-details">
            <h3>{stats.completed}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card recent-activities">
          <div className="card-header">
            <h2 className="card-title">Recent Activities</h2>
          </div>
          <ul className="activity-list">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <li key={index} className="activity-item">
                  <span className="activity-time">{formatTimestamp(activity.timestamp)}</span>
                  <span className="activity-text">{formatActivityMessage(activity)}</span>
                </li>
              ))
            ) : (
              <li className="activity-item">
                <span className="activity-text">No recent activities</span>
              </li>
            )}
          </ul>
        </div>

        <div className="card facility-status">
          <div className="card-header">
            <h2 className="card-title">Facility Status</h2>
          </div>
          <div className="status-list">
            <div className="status-item">
              <span className="status-name">Building A</span>
              <div className="status-bar">
                <div className="status-progress" style={{ width: "92%" }}></div>
              </div>
              <span className="status-percentage">92%</span>
            </div>
            <div className="status-item">
              <span className="status-name">Building B</span>
              <div className="status-bar">
                <div className="status-progress" style={{ width: "78%" }}></div>
              </div>
              <span className="status-percentage">78%</span>
            </div>
            <div className="status-item">
              <span className="status-name">Building C</span>
              <div className="status-bar">
                <div className="status-progress" style={{ width: "85%" }}></div>
              </div>
              <span className="status-percentage">85%</span>
            </div>
            <div className="status-item">
              <span className="status-name">Building D</span>
              <div className="status-bar">
                <div className="status-progress" style={{ width: "64%" }}></div>
              </div>
              <span className="status-percentage">64%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

