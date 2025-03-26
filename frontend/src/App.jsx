"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Sidebar from "./components/Sidebar/Sidebar"
import Dashboard from "./pages/Dashboard/Dashboard"
import Analytics from "./pages/Analytics/Analytics"
import Calendar from "./pages/Calendar/Calendar"
import Prediction from "./pages/Prediction/Prediction"
import Home from "./pages/Home/Home"
import Login from "./pages/Login/Login"
import Signup from "./pages/Signup/Signup"
import Profile from "./pages/Profile/Profile"
import "./App.css"
import axios from "axios"
import UnifiedTasks from './pages/UnifiedTasks/UnifiedTasks'

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  // Check for token on initial load and verify it's valid
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token")
      
      if (token) {
        // Set default axios header 
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        
        try {
          // Verify token by making a request to the backend
          await axios.get("http://localhost:8000/api/auth/me")
          // If request succeeds, token is valid
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Invalid token:", error)
          // Remove invalid token and auth headers
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          delete axios.defaults.headers.common["Authorization"]
        }
      }
      
      setIsLoading(false)
    }
    
    verifyToken()
    
    // Listen for authentication events
    const handleAuth = () => {
      setIsAuthenticated(true)
      const token = localStorage.getItem("token")
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      }
    }
    
    // Listen for logout events
    const handleLogout = () => {
      setIsAuthenticated(false)
    }
    
    window.addEventListener('userAuthenticated', handleAuth)
    window.addEventListener('userLoggedOut', handleLogout)
    
    return () => {
      window.removeEventListener('userAuthenticated', handleAuth)
      window.removeEventListener('userLoggedOut', handleLogout)
    }
  }, [])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  const handleLogout = () => {
    // Clear token and user data
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    
    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"]
    
    // Update state
    setIsAuthenticated(false)
  }

  // Show loading while checking auth state
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>
  }

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated ? (
          <Sidebar 
            expanded={sidebarExpanded} 
            toggleSidebar={toggleSidebar} 
            onLogout={handleLogout}
          />
        ) : null}
        <main
          className={`main-content ${isAuthenticated ? (sidebarExpanded ? "sidebar-expanded" : "") : "no-sidebar"}`}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            
            <Route
              path="/analytics"
              element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/calendar"
              element={isAuthenticated ? <Calendar /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/prediction"
              element={isAuthenticated ? <Prediction /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/unified-tasks"
              element={isAuthenticated ? <UnifiedTasks /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
            />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

