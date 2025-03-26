"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaUser, FaLock, FaBuilding } from "react-icons/fa"
import "./Login.css"
import { authApi } from "../../api/axios"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Call backend API for authentication using our auth service
      const response = await authApi.login(formData.email, formData.password)

      // Store token and user info in localStorage
      localStorage.setItem("token", response.data.access_token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      
      // Update authentication state in parent component
      window.dispatchEvent(new Event('userAuthenticated'))
      
      // Redirect to dashboard
      navigate("/")
    } catch (err) {
      console.error("Login failed:", err)
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="logo-container">
              <FaBuilding className="logo-icon" />
              <h1 className="logo-text">FMS</h1>
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Login to access your facility management dashboard</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-block ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-image">
          <div className="image-overlay">
            <div className="overlay-content">
              <h2>Manage Your Facilities with Ease</h2>
              <p>
                Our comprehensive facility management system helps you streamline operations, reduce costs, and improve
                efficiency.
              </p>
              <div className="feature-bullets">
                <div className="feature-bullet">
                  <div className="bullet-icon">✓</div>
                  <div className="bullet-text">Real-time monitoring and analytics</div>
                </div>
                <div className="feature-bullet">
                  <div className="bullet-icon">✓</div>
                  <div className="bullet-text">Preventive maintenance scheduling</div>
                </div>
                <div className="feature-bullet">
                  <div className="bullet-icon">✓</div>
                  <div className="bullet-text">Task management and assignment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

