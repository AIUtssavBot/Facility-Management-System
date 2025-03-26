from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime, timedelta
import random
import numpy as np
from ..utils.auth import get_current_user
from ..config.database import tasks_collection, users_collection
from pydantic import BaseModel

router = APIRouter(prefix="/predictions", tags=["Predictions"])

class PredictionRequest(BaseModel):
    facility: str
    equipment: str = None
    lastMaintenance: str = None
    usageHours: str = None
    temperature: str = None
    humidity: str = None
    buildingSize: str = None
    buildingType: str = None
    occupancyRate: str = None
    dayOfWeek: str = None
    weatherCondition: str = None
    specialEvent: str = None
    historicalData: str = None

@router.post("/maintenance")
async def maintenance_prediction(data: PredictionRequest, current_user = Depends(get_current_user)):
    """
    Generate a maintenance prediction based on input data.
    
    In a production system, this would use a trained ML model.
    For now, we generate realistic sample data.
    """
    try:
        # Get equipment-specific parameters
        equipment_factors = {
            "hvac": {"base_days": 20, "failure_prob": 15, "cost_base": 1500},
            "electrical": {"base_days": 45, "failure_prob": 8, "cost_base": 1200},
            "plumbing": {"base_days": 60, "failure_prob": 12, "cost_base": 800},
            "elevator": {"base_days": 30, "failure_prob": 20, "cost_base": 2500},
            "security": {"base_days": 90, "failure_prob": 5, "cost_base": 1000},
        }
        
        # Get factors for the specified equipment or use default
        equipment = data.equipment
        factors = equipment_factors.get(equipment, {"base_days": 30, "failure_prob": 10, "cost_base": 1000})
        
        # Calculate days until maintenance
        base_days = factors["base_days"]
        usage_modifier = 0
        
        if data.usageHours:
            usage_hours = float(data.usageHours)
            # Reduce days based on usage (more usage = less days)
            if usage_hours > 100:
                usage_modifier = -10
            elif usage_hours > 50:
                usage_modifier = -5
                
        env_modifier = 0
        if data.temperature and data.humidity:
            temp = float(data.temperature)
            humidity = float(data.humidity)
            
            # Extreme conditions reduce maintenance interval
            if temp > 30 or temp < 5 or humidity > 80:
                env_modifier = -8
                
        # Calculate final days
        days_until_maintenance = max(5, base_days + usage_modifier + env_modifier)
        
        # Calculate failure probability
        base_prob = factors["failure_prob"]
        failure_probability = min(90, base_prob + 
                               (5 if data.usageHours and float(data.usageHours) > 80 else 0) +
                               (10 if data.temperature and float(data.temperature) > 35 else 0) +
                               (8 if data.humidity and float(data.humidity) > 85 else 0))
        
        # Calculate cost estimate
        cost_base = factors["cost_base"]
        cost_modifier = 1.0
        if data.usageHours and float(data.usageHours) > 80:
            cost_modifier += 0.2
        if data.temperature and float(data.temperature) > 30:
            cost_modifier += 0.15
            
        cost_estimate = int(cost_base * cost_modifier)
        
        # Calculate maintenance date
        maintenance_date = (datetime.now() + timedelta(days=days_until_maintenance)).strftime("%Y-%m-%d")
        
        # Generate chart data
        chart_data = []
        for i in range(0, 35, 5):
            day_label = "Today" if i == 0 else f"Day {i}"
            # Probability increases over time
            day_probability = min(100, failure_probability + (i * 1.5))
            chart_data.append({"day": day_label, "probability": day_probability})
            
        # Create prediction result
        result = {
            "daysUntilMaintenance": days_until_maintenance,
            "failureProbability": failure_probability,
            "costEstimate": cost_estimate,
            "maintenanceDate": maintenance_date,
            "chartData": chart_data
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")
        
@router.post("/energy")
async def energy_prediction(data: PredictionRequest, current_user = Depends(get_current_user)):
    """
    Generate an energy usage prediction based on input data.
    """
    try:
        # Base energy calculations
        base_usage = 0
        if data.buildingSize:
            # Calculate base usage based on building size (kWh per sq ft)
            size = float(data.buildingSize)
            base_usage = size * 0.05
            
        # Building type modifiers
        type_modifiers = {
            "office": 1.0,
            "residential": 1.2,
            "commercial": 1.5,
            "industrial": 2.0,
            "healthcare": 1.8
        }
        
        type_modifier = type_modifiers.get(data.buildingType, 1.0)
        
        # Calculate current usage
        current_usage = int(base_usage * type_modifier)
        
        # Calculate predicted usage with weather/occupancy factors
        weather_factor = 1.0
        if data.temperature:
            temp = float(data.temperature)
            # Higher temperatures increase energy usage (A/C)
            if temp > 25:
                weather_factor += 0.2
            elif temp < 10:
                weather_factor += 0.15  # Heating
                
        occupancy_factor = 1.0
        if data.occupancyRate:
            occupancy = float(data.occupancyRate)
            occupancy_factor = 0.7 + (occupancy / 100 * 0.5)  # Scale from 0.7 to 1.2
            
        predicted_usage = int(current_usage * weather_factor * occupancy_factor)
        
        # Calculate potential savings
        efficiency_potential = 0.15  # Assume 15% potential savings opportunity
        savings_potential = int(current_usage * efficiency_potential)
        
        # Generate chart data
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]
        chart_data = []
        
        # Historical data (random variation around current usage)
        for i in range(5):
            variation = random.uniform(0.85, 1.15)
            chart_data.append({"month": months[i], "usage": int(current_usage * variation)})
            
        # Current and future prediction
        chart_data.append({"month": months[5], "usage": predicted_usage})
        chart_data.append({
            "month": months[6], 
            "usage": int(predicted_usage * random.uniform(0.95, 1.05))
        })
        
        # Create prediction result
        result = {
            "currentUsage": current_usage,
            "predictedUsage": predicted_usage,
            "savingsPotential": savings_potential,
            "chartData": chart_data
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")
        
@router.post("/occupancy")
async def occupancy_prediction(data: PredictionRequest, current_user = Depends(get_current_user)):
    """
    Generate an occupancy prediction based on input data.
    """
    try:
        # Day of week factors
        day_factors = {
            "monday": 0.8,
            "tuesday": 0.9,
            "wednesday": 1.0,
            "thursday": 0.9,
            "friday": 0.7,
            "saturday": 0.4,
            "sunday": 0.3
        }
        
        day_factor = day_factors.get(data.dayOfWeek, 0.8)
        
        # Weather factors
        weather_factors = {
            "sunny": 1.1,
            "cloudy": 1.0,
            "rainy": 0.8,
            "snowy": 0.7,
            "stormy": 0.6
        }
        
        weather_factor = weather_factors.get(data.weatherCondition, 1.0)
        
        # Special event factors
        event_factors = {
            "none": 1.0,
            "conference": 1.5,
            "holiday": 0.5,
            "promotion": 1.3,
            "other": 1.2
        }
        
        event_factor = event_factors.get(data.specialEvent, 1.0)
        
        # Calculate base occupancy
        base_occupancy = 60  # Baseline percentage
        
        # Calculate current and predicted occupancy
        current_occupancy = int(base_occupancy * day_factor * weather_factor)
        predicted_occupancy = int(current_occupancy * event_factor)
        
        # Determine peak hours based on day of week
        weekday_peaks = ["9:00 AM", "12:00 PM", "4:30 PM"]
        weekend_peaks = ["11:00 AM", "2:00 PM"]
        
        is_weekend = data.dayOfWeek in ["saturday", "sunday"]
        peak_hours = weekend_peaks if is_weekend else weekday_peaks
        
        # Generate hourly occupancy data
        hours = ["6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"]
        
        # Occupancy patterns
        weekday_pattern = [5, 30, 75, 90, 80, 70, 30, 10]
        weekend_pattern = [5, 15, 60, 80, 70, 50, 30, 20]
        
        pattern = weekend_pattern if is_weekend else weekday_pattern
        
        # Apply factors to pattern
        adjusted_pattern = [min(100, int(p * weather_factor * event_factor)) for p in pattern]
        
        # Create chart data
        chart_data = [{"hour": hours[i], "occupancy": adjusted_pattern[i]} for i in range(len(hours))]
        
        # Create prediction result
        result = {
            "currentOccupancy": current_occupancy,
            "predictedOccupancy": predicted_occupancy,
            "peakHours": peak_hours,
            "chartData": chart_data
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}") 