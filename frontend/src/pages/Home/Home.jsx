"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FaBuilding, FaChartLine, FaCalendarAlt, FaTasks, FaArrowRight, FaHome } from "react-icons/fa"
import "./Home.css"

const Home = () => {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsAuthenticated(!!token)
  }, [])

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const features = [
    {
      icon: <FaBuilding />,
      title: "Facility Management",
      description:
        "Efficiently manage all your facilities in one place. Track maintenance, monitor performance, and optimize operations.",
    },
    {
      icon: <FaChartLine />,
      title: "Analytics & Insights",
      description:
        "Gain valuable insights with powerful analytics. Make data-driven decisions to improve efficiency and reduce costs.",
    },
    {
      icon: <FaCalendarAlt />,
      title: "Smart Scheduling",
      description:
        "Plan and schedule maintenance tasks with ease. Never miss important deadlines with our intuitive calendar system.",
    },
    {
      icon: <FaTasks />,
      title: "Task Management",
      description:
        "Streamline task assignment and tracking. Improve team coordination and ensure timely completion of all tasks.",
    },
  ]

  return (
    <div className="home-page">
      {isAuthenticated && (
        <div className="dashboard-banner">
          <div className="banner-content">
            <span>You are logged in</span>
            <button className="dashboard-link" onClick={handleGoToDashboard}>
              <FaHome /> Go to Dashboard
            </button>
          </div>
        </div>
      )}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Facility Management System</h1>
          <p className="hero-subtitle">Streamline operations, reduce costs, and improve efficiency</p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <button className="btn btn-primary" onClick={handleGoToDashboard}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-secondary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="image-container">
            <div className="building-image"></div>
            <div className="overlay-graphics">
              <div className="graphic graphic-1"></div>
              <div className="graphic graphic-2"></div>
              <div className="graphic graphic-3"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-container">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${index === activeFeature ? "active" : ""}`}
              onClick={() => setActiveFeature(index)}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">Why Choose Our System?</h2>
          <ul className="benefits-list">
            <li className="benefit-item">
              <div className="benefit-check">✓</div>
              <div className="benefit-text">Reduce operational costs by up to 25%</div>
            </li>
            <li className="benefit-item">
              <div className="benefit-check">✓</div>
              <div className="benefit-text">Improve team productivity and coordination</div>
            </li>
            <li className="benefit-item">
              <div className="benefit-check">✓</div>
              <div className="benefit-text">Extend equipment lifespan with preventive maintenance</div>
            </li>
            <li className="benefit-item">
              <div className="benefit-check">✓</div>
              <div className="benefit-text">Make data-driven decisions with powerful analytics</div>
            </li>
            <li className="benefit-item">
              <div className="benefit-check">✓</div>
              <div className="benefit-text">Ensure compliance with regulatory requirements</div>
            </li>
          </ul>
          {isAuthenticated ? (
            <button className="btn btn-primary with-icon" onClick={handleGoToDashboard}>
              Go to Dashboard <FaArrowRight />
            </button>
          ) : (
            <Link to="/signup" className="btn btn-primary with-icon">
              Get Started <FaArrowRight />
            </Link>
          )}
        </div>
        <div className="benefits-image">
          <div className="dashboard-preview">
            <img 
              src="/dashboard-preview.jpg" 
              alt="FMS Dashboard Preview" 
              className="dashboard-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";
              }}
            />
          </div>
        </div>
      </div>

      <div className="testimonials-section">
        <h2 className="section-title">What Our Clients Say</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>
                "This system has transformed how we manage our facilities. We've reduced downtime by 30% and saved
                thousands in operational costs."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar avatar-1"></div>
              <div className="author-info">
                <div className="author-name">John Anderson</div>
                <div className="author-title">Facility Manager, ABC Corp</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>
                "The analytics and prediction features have been game-changers for our preventive maintenance program.
                Highly recommended!"
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar avatar-2"></div>
              <div className="author-info">
                <div className="author-name">Sarah Johnson</div>
                <div className="author-title">Operations Director, XYZ Industries</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>
                "The task management and scheduling features have improved our team's efficiency by 40%. The interface
                is intuitive and user-friendly."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar avatar-3"></div>
              <div className="author-info">
                <div className="author-name">Michael Chen</div>
                <div className="author-title">Maintenance Supervisor, Global Properties</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2 className="cta-title">Ready to optimize your facility management?</h2>
        <p className="cta-text">
          Join thousands of companies that trust our system to manage their facilities efficiently.
        </p>
        <div className="cta-buttons">
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login to Your Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home

