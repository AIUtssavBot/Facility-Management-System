# Facility Management System Backend

Backend API for Facility Management System built with FastAPI, MongoDB, and ML algorithms for task optimization.

## Features

- User authentication with JWT
- Task management API
- Analytics and reporting
- Machine Learning task optimization with genetic algorithms
- PowerBI integration for analytics dashboard

## Tech Stack

- FastAPI - Fast, modern Python web framework
- MongoDB - NoSQL database for flexible data storage
- JWT - Secure authentication with JSON Web Tokens
- DEAP - Evolutionary algorithm framework for task optimization
- Pandas & NumPy - Data processing for analytics
- Python 3.8+ - Modern Python version

## Installation

1. Clone the repository.


2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up MongoDB:
   - Install MongoDB or use MongoDB Atlas cloud service
   - Create a database called `fms_db`

4. Configure environment variables:
   - Copy `.env.example` to `.env` and update the settings
   - Set your MongoDB connection URL and JWT secret

## Running the Server

Start the development server with:

```
uvicorn main:app --reload
```

The API will be available at: http://localhost:8000

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── config/
│   │   └── database.py        # Database configuration
│   ├── models/
│   │   ├── user.py            # User Pydantic models
│   │   ├── task.py            # Task Pydantic models
│   │   └── analytics.py       # Analytics data models
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── users.py           # User management endpoints
│   │   ├── tasks.py           # Task management endpoints
│   │   └── analytics.py       # Analytics & PowerBI endpoints
│   └── utils/
│       ├── auth.py            # Authentication utilities
│       ├── task_optimization.py  # ML algorithms for task allocation
│       └── powerbi_integration.py  # PowerBI integration utilities
├── main.py                    # Main application entry point
├── requirements.txt           # Python dependencies
└── .env                       # Environment variables (not in version control)
```

## ML Task Optimization

The system uses genetic algorithms from the DEAP library to optimize task allocation to users based on:

- Task priority
- Due dates
- User workload balance
- User-task match

The optimization aims to:
1. Assign high-priority tasks first
2. Ensure critical tasks are assigned to users with lower workloads
3. Balance workload across the team
4. Respect due dates and minimize overdue tasks

## PowerBI Integration

The analytics endpoints provide data in a format ready for PowerBI to consume:

1. Use the `/api/analytics/powerbi-data` endpoint to fetch data
2. Import data into PowerBI using "Web API" data source
3. Create visualizations for:
   - Task completion trends
   - User performance metrics
   - Workload distribution
   - Missed task heatmaps 