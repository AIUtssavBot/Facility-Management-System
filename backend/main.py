from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.routers import auth, users, tasks, analytics, predictions
from app.routers import tasks_fix
from app.config.database import init_db

app = FastAPI(title="FMS - Facility Management System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:3000"],  # Add all potential frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(tasks_fix.router, prefix="/api", tags=["Tasks Fix"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])

@app.options("/{full_path:path}")
async def options_route(request: Request, full_path: str):
    """Handle OPTIONS requests to fix CORS issues"""
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
    )

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to Facility Management System API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)