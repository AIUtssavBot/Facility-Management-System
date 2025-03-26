from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Router Debug API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Create a simple router for testing
router = APIRouter(prefix="/test", tags=["Test"])

@router.get("/")
async def get_items():
    logger.info("GET /test/ endpoint called")
    return [{"id": 1, "name": "Test Item"}]

@router.get("/{item_id}")
async def get_item(item_id: int):
    logger.info(f"GET /test/{item_id} endpoint called")
    return {"id": item_id, "name": f"Test Item {item_id}"}

# Include the test router
app.include_router(router, prefix="/api")

@app.options("/{full_path:path}")
async def options_route(request: Request, full_path: str):
    """Handle OPTIONS requests to fix CORS issues"""
    logger.info(f"OPTIONS request received for path: {full_path}")
    return JSONResponse(
        content={"message": "OK"},
        status_code=200,
    )

@app.get("/")
async def root():
    return {"message": "Router Debug API"}

if __name__ == "__main__":
    uvicorn.run("debug_router:app", host="0.0.0.0", port=8001, reload=True) 