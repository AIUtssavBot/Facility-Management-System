# Facility Management System (FMS)

A comprehensive facility management system with task optimization using ML algorithms, and analytics dashboard integration with PowerBI.

## Features

- User authentication with JWT tokens
- Task management and assignment
- ML-powered task optimization using genetic algorithms
- Real-time analytics with performance metrics
- PowerBI integration for data visualization
- Mobile-friendly responsive design

## Project Structure

The project consists of two main components:

### Frontend
- React-based SPA (Single Page Application)
- Modern UI with responsive design
- Authentication and route protection
- Dashboard for task management and analytics
- Realtime data visualization

### Backend
- FastAPI REST API
- MongoDB database for data storage
- JWT token-based authentication
- Machine Learning task optimization with DEAP genetic algorithms
- Analytics processing with pandas and numpy
- PowerBI integration API endpoints

## Setup Instructions

### Backend Setup

1. Ensure you have MongoDB installed and running
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```
   uvicorn main:app --reload
   ```
6. The backend API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install the required packages:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. The frontend will be available at http://localhost:5173

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ML Task Optimization

The system uses genetic algorithms to optimize task allocation based on:
- Task priority
- Due dates
- User workload balance
- User-task match

## PowerBI Integration

To set up PowerBI integration:
1. In PowerBI Desktop, use "Get Data" > "Web API"
2. Enter the endpoint URL: http://localhost:8000/api/analytics/powerbi-data
3. Configure the authentication if needed
4. Import the data and create visualizations

## Screenshots

[Include screenshots here when available]
