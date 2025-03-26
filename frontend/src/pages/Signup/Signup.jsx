"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaUser, FaLock, FaEnvelope, FaBuilding, FaCheck } from "react-icons/fa"
import "./Signup.css"
import { authApi } from "../../api/axios"

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    agreeTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    if (name === "password") {
      calculatePasswordStrength(value)
    }
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0

    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    setPasswordStrength(strength)
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0:
        return "Weak"
      case 1:
        return "Weak"
      case 2:
        return "Medium"
      case 3:
        return "Strong"
      case 4:
        return "Very Strong"
      default:
        return ""
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return "#f44336"
      case 1:
        return "#f44336"
      case 2:
        return "#ff9800"
      case 3:
        return "#4caf50"
      case 4:
        return "#2e7d32"
      default:
        return ""
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      return
    }

    setIsLoading(true)

    try {
      // Submit to backend API using our auth service
      await authApi.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company: formData.company
      })
      
      // Registration successful, redirect to login
      navigate("/login")
    } catch (err) {
      console.error("Registration failed:", err)
      setError(err.response?.data?.detail || "Registration failed. Please try again.")
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
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">Sign up to start managing your facilities</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
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
              <label htmlFor="company">Company Name</label>
              <div className="input-with-icon">
                <FaBuilding className="input-icon" />
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your company name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Create a password"
                  required
                />
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-progress"
                      style={{
                        width: `${passwordStrength * 25}%`,
                        backgroundColor: getStrengthColor(),
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: getStrengthColor() }}>
                    {getStrengthText()}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} />
                <span className="checkmark"></span>I agree to the{" "}
                <a href="#" className="terms-link">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="terms-link">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-block ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Log In
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

export default Signup

