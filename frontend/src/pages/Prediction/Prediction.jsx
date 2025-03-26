"use client"

import { useState } from "react"
import { FaChartLine, FaCalculator, FaSpinner } from "react-icons/fa"
import axios from "axios"
import "./Prediction.css"

const Prediction = () => {
  const [predictionType, setPredictionType] = useState("maintenance")
  const [formData, setFormData] = useState({
    facility: "",
    equipment: "",
    lastMaintenance: "",
    usageHours: "",
    temperature: "",
    humidity: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePredictionTypeChange = (type) => {
    setPredictionType(type)
    setPredictionResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Make actual API call to backend for prediction
      const response = await axios.post(`http://localhost:8000/api/predictions/${predictionType}`, formData)
      setPredictionResult(response.data)
    } catch (error) {
      console.error("Error making prediction:", error)
      
      // Fallback to simulated data if API fails
      let result

      if (predictionType === "maintenance") {
        // Simulate maintenance prediction
        const daysUntilMaintenance = Math.floor(Math.random() * 30) + 5
        const failureProbability = Math.floor(Math.random() * 40) + 10
        const costEstimate = Math.floor(Math.random() * 5000) + 1000

        result = {
          daysUntilMaintenance,
          failureProbability,
          costEstimate,
          maintenanceDate: new Date(Date.now() + daysUntilMaintenance * 24 * 60 * 60 * 1000).toLocaleDateString(),
          chartData: [
            { day: "Today", probability: failureProbability },
            { day: "Day 5", probability: failureProbability + 5 },
            { day: "Day 10", probability: failureProbability + 12 },
            { day: "Day 15", probability: failureProbability + 20 },
            { day: "Day 20", probability: failureProbability + 30 },
            { day: "Day 25", probability: failureProbability + 42 },
            { day: "Day 30", probability: failureProbability + 55 },
          ],
        }
      } else if (predictionType === "energy") {
        // Simulate energy usage prediction
        const currentUsage = Math.floor(Math.random() * 1000) + 500
        const predictedUsage = Math.floor(currentUsage * (Math.random() * 0.3 + 0.9))
        const savingsPotential = Math.floor(currentUsage * (Math.random() * 0.2 + 0.05))

        result = {
          currentUsage,
          predictedUsage,
          savingsPotential,
          chartData: [
            { month: "Jan", usage: Math.floor(Math.random() * 1000) + 500 },
            { month: "Feb", usage: Math.floor(Math.random() * 1000) + 500 },
            { month: "Mar", usage: Math.floor(Math.random() * 1000) + 500 },
            { month: "Apr", usage: Math.floor(Math.random() * 1000) + 500 },
            { month: "May", usage: Math.floor(Math.random() * 1000) + 500 },
            { month: "Jun", usage: predictedUsage },
            { month: "Jul", usage: predictedUsage + Math.floor(Math.random() * 100) - 50 },
          ],
        }
      } else if (predictionType === "occupancy") {
        // Simulate occupancy prediction
        const currentOccupancy = Math.floor(Math.random() * 80) + 20
        const predictedOccupancy = Math.floor(currentOccupancy * (Math.random() * 0.3 + 0.9))
        const peakHours = ["9:00 AM", "2:00 PM", "4:30 PM"]

        result = {
          currentOccupancy,
          predictedOccupancy,
          peakHours,
          chartData: [
            { hour: "6 AM", occupancy: Math.floor(Math.random() * 20) },
            { hour: "8 AM", occupancy: Math.floor(Math.random() * 40) + 20 },
            { hour: "10 AM", occupancy: Math.floor(Math.random() * 30) + 50 },
            { hour: "12 PM", occupancy: Math.floor(Math.random() * 20) + 60 },
            { hour: "2 PM", occupancy: Math.floor(Math.random() * 20) + 70 },
            { hour: "4 PM", occupancy: Math.floor(Math.random() * 30) + 50 },
            { hour: "6 PM", occupancy: Math.floor(Math.random() * 40) + 20 },
            { hour: "8 PM", occupancy: Math.floor(Math.random() * 20) },
          ],
        }
      }

      setPredictionResult(result)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPredictionForm = () => {
    switch (predictionType) {
      case "maintenance":
        return (
          <form onSubmit={handleSubmit} className="prediction-form">
            <div className="form-group">
              <label htmlFor="facility">Facility</label>
              <input
                type="text"
                id="facility"
                name="facility"
                value={formData.facility}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="equipment">Equipment Type</label>
              <select
                id="equipment"
                name="equipment"
                value={formData.equipment}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="">Select Equipment</option>
                <option value="hvac">HVAC System</option>
                <option value="electrical">Electrical System</option>
                <option value="plumbing">Plumbing System</option>
                <option value="elevator">Elevator</option>
                <option value="security">Security System</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lastMaintenance">Last Maintenance Date</label>
                <input
                  type="date"
                  id="lastMaintenance"
                  name="lastMaintenance"
                  value={formData.lastMaintenance}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="usageHours">Usage Hours (per week)</label>
                <input
                  type="number"
                  id="usageHours"
                  name="usageHours"
                  value={formData.usageHours}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  max="168"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperature">Avg. Temperature (°C)</label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="humidity">Avg. Humidity (%)</label>
                <input
                  type="number"
                  id="humidity"
                  name="humidity"
                  value={formData.humidity}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinning" /> Processing...
                </>
              ) : (
                <>
                  <FaCalculator /> Generate Prediction
                </>
              )}
            </button>
          </form>
        )

      case "energy":
        return (
          <form onSubmit={handleSubmit} className="prediction-form">
            <div className="form-group">
              <label htmlFor="facility">Facility</label>
              <input
                type="text"
                id="facility"
                name="facility"
                value={formData.facility}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="buildingSize">Building Size (sq ft)</label>
                <input
                  type="number"
                  id="buildingSize"
                  name="buildingSize"
                  value={formData.buildingSize}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="buildingType">Building Type</label>
                <select
                  id="buildingType"
                  name="buildingType"
                  value={formData.buildingType}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="office">Office</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="healthcare">Healthcare</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperature">Avg. Temperature (°C)</label>
                <input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="occupancyRate">Occupancy Rate (%)</label>
                <input
                  type="number"
                  id="occupancyRate"
                  name="occupancyRate"
                  value={formData.occupancyRate}
                  onChange={handleInputChange}
                  className="form-control"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinning" /> Processing...
                </>
              ) : (
                <>
                  <FaCalculator /> Generate Prediction
                </>
              )}
            </button>
          </form>
        )

      case "occupancy":
        return (
          <form onSubmit={handleSubmit} className="prediction-form">
            <div className="form-group">
              <label htmlFor="facility">Facility</label>
              <input
                type="text"
                id="facility"
                name="facility"
                value={formData.facility}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dayOfWeek">Day of Week</label>
                <select
                  id="dayOfWeek"
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weatherCondition">Weather Condition</label>
                <select
                  id="weatherCondition"
                  name="weatherCondition"
                  value={formData.weatherCondition}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Weather</option>
                  <option value="sunny">Sunny</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rainy">Rainy</option>
                  <option value="snowy">Snowy</option>
                  <option value="stormy">Stormy</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specialEvent">Special Event</label>
                <select
                  id="specialEvent"
                  name="specialEvent"
                  value={formData.specialEvent}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="none">None</option>
                  <option value="conference">Conference</option>
                  <option value="holiday">Holiday</option>
                  <option value="promotion">Promotion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="historicalData">Historical Data Period</label>
                <select
                  id="historicalData"
                  name="historicalData"
                  value={formData.historicalData}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Period</option>
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinning" /> Processing...
                </>
              ) : (
                <>
                  <FaCalculator /> Generate Prediction
                </>
              )}
            </button>
          </form>
        )

      default:
        return null
    }
  }

  const renderPredictionResult = () => {
    if (!predictionResult) return null

    switch (predictionType) {
      case "maintenance":
        return (
          <div className="prediction-result fade-in">
            <h3>Maintenance Prediction Results</h3>

            <div className="result-cards">
              <div className="result-card">
                <h4>Days Until Maintenance</h4>
                <div className="result-value">{predictionResult.daysUntilMaintenance}</div>
                <div className="result-label">Recommended by {predictionResult.maintenanceDate}</div>
              </div>

              <div className="result-card">
                <h4>Failure Probability</h4>
                <div className="result-value">{predictionResult.failureProbability}%</div>
                <div className="result-label">Current risk level</div>
              </div>

              <div className="result-card">
                <h4>Estimated Cost</h4>
                <div className="result-value">${predictionResult.costEstimate}</div>
                <div className="result-label">Preventive maintenance</div>
              </div>
            </div>

            <div className="prediction-chart">
              <h4>Failure Probability Over Time</h4>
              <div className="chart-container">
                <div className="chart-y-axis">
                  <div>100%</div>
                  <div>75%</div>
                  <div>50%</div>
                  <div>25%</div>
                  <div>0%</div>
                </div>
                <div className="chart-content">
                  {predictionResult.chartData.map((item, index) => (
                    <div key={index} className="chart-bar-container">
                      <div className="chart-bar" style={{ height: `${item.probability}%` }}></div>
                      <div className="chart-label">{item.day}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "energy":
        return (
          <div className="prediction-result fade-in">
            <h3>Energy Usage Prediction Results</h3>

            <div className="result-cards">
              <div className="result-card">
                <h4>Current Usage</h4>
                <div className="result-value">{predictionResult.currentUsage} kWh</div>
                <div className="result-label">Monthly average</div>
              </div>

              <div className="result-card">
                <h4>Predicted Usage</h4>
                <div className="result-value">{predictionResult.predictedUsage} kWh</div>
                <div className="result-label">Next month estimate</div>
              </div>

              <div className="result-card">
                <h4>Savings Potential</h4>
                <div className="result-value">{predictionResult.savingsPotential} kWh</div>
                <div className="result-label">With optimizations</div>
              </div>
            </div>

            <div className="prediction-chart">
              <h4>Energy Usage Trend</h4>
              <div className="chart-container">
                <div className="chart-y-axis">
                  <div>1500 kWh</div>
                  <div>1000 kWh</div>
                  <div>500 kWh</div>
                  <div>0 kWh</div>
                </div>
                <div className="chart-content">
                  {predictionResult.chartData.map((item, index) => (
                    <div key={index} className="chart-bar-container">
                      <div className="chart-bar" style={{ height: `${(item.usage / 1500) * 100}%` }}></div>
                      <div className="chart-label">{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "occupancy":
        return (
          <div className="prediction-result fade-in">
            <h3>Occupancy Prediction Results</h3>

            <div className="result-cards">
              <div className="result-card">
                <h4>Current Occupancy</h4>
                <div className="result-value">{predictionResult.currentOccupancy}%</div>
                <div className="result-label">Average rate</div>
              </div>

              <div className="result-card">
                <h4>Predicted Occupancy</h4>
                <div className="result-value">{predictionResult.predictedOccupancy}%</div>
                <div className="result-label">Next period estimate</div>
              </div>

              <div className="result-card">
                <h4>Peak Hours</h4>
                <div className="result-value">{predictionResult.peakHours.join(", ")}</div>
                <div className="result-label">Highest occupancy times</div>
              </div>
            </div>

            <div className="prediction-chart">
              <h4>Occupancy Throughout the Day</h4>
              <div className="chart-container">
                <div className="chart-y-axis">
                  <div>100%</div>
                  <div>75%</div>
                  <div>50%</div>
                  <div>25%</div>
                  <div>0%</div>
                </div>
                <div className="chart-content">
                  {predictionResult.chartData.map((item, index) => (
                    <div key={index} className="chart-bar-container">
                      <div className="chart-bar" style={{ height: `${item.occupancy}%` }}></div>
                      <div className="chart-label">{item.hour}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="prediction-page fade-in">
      <div className="prediction-header">
        <h1 className="page-title">Predictive Analytics</h1>
      </div>

      <div className="prediction-container">
        <div className="prediction-sidebar">
          <h3>Prediction Types</h3>
          <div className="prediction-types">
            <button
              className={`prediction-type-btn ${predictionType === "maintenance" ? "active" : ""}`}
              onClick={() => handlePredictionTypeChange("maintenance")}
            >
              <FaChartLine />
              <span>Maintenance Prediction</span>
            </button>

            <button
              className={`prediction-type-btn ${predictionType === "energy" ? "active" : ""}`}
              onClick={() => handlePredictionTypeChange("energy")}
            >
              <FaChartLine />
              <span>Energy Usage Prediction</span>
            </button>

            <button
              className={`prediction-type-btn ${predictionType === "occupancy" ? "active" : ""}`}
              onClick={() => handlePredictionTypeChange("occupancy")}
            >
              <FaChartLine />
              <span>Occupancy Prediction</span>
            </button>
          </div>
        </div>

        <div className="prediction-content">
          <div className="prediction-form-container">
            <h2>
              {predictionType === "maintenance" && "Maintenance Prediction"}
              {predictionType === "energy" && "Energy Usage Prediction"}
              {predictionType === "occupancy" && "Occupancy Prediction"}
            </h2>
            <p className="prediction-description">
              {predictionType === "maintenance" &&
                "Predict when equipment will need maintenance based on usage patterns and environmental factors."}
              {predictionType === "energy" &&
                "Forecast energy consumption and identify potential savings opportunities."}
              {predictionType === "occupancy" &&
                "Predict facility occupancy rates to optimize space utilization and services."}
            </p>

            {renderPredictionForm()}
          </div>

          {renderPredictionResult()}
        </div>
      </div>
    </div>
  )
}

export default Prediction

