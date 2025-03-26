"use client"

import { useState } from "react"
import { NavLink } from "react-router-dom"
import { FaHome, FaChartBar, FaTasks, FaCalendarAlt, FaChartLine, FaClipboardList, FaBars, FaUser } from "react-icons/fa"
import "./Sidebar.css"

const Sidebar = ({ expanded, toggleSidebar }) => {
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = () => {
    if (!expanded) {
      setHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!expanded) {
      setHovered(false)
    }
  }

  const isExpanded = expanded || hovered

  return (
    <div
      className={`sidebar ${isExpanded ? "expanded" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        {isExpanded && <h2 className="logo">FMS</h2>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaHome />
              </span>
              {isExpanded && <span className="text">Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaChartBar />
              </span>
              {isExpanded && <span className="text">Analytics</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/unified-tasks" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaTasks />
              </span>
              {isExpanded && <span className="text">Task Management</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/calendar" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaCalendarAlt />
              </span>
              {isExpanded && <span className="text">Calendar</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/prediction" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaChartLine />
              </span>
              {isExpanded && <span className="text">Prediction</span>}
            </NavLink>
          </li>
          <li className="profile-nav-item">
            <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="icon">
                <FaUser />
              </span>
              {isExpanded && <span className="text">Profile</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">{isExpanded && <p>Facility Management System</p>}</div>
    </div>
  )
}

export default Sidebar

