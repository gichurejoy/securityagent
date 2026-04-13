import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

from routers import agent, dashboard, auth, portal

# Create tables
Base.metadata.create_all(bind=engine)

# app = FastAPI(title="Security Agent API", version="1.0.0")
# AFTER
root_path = os.getenv("API_ROOT_PATH", "/api")
app = FastAPI(
    title="Security Agent API",
    version="1.0.0",
    root_path=root_path
)

# Setup CORS for the React dashboard
# Allow localhost for development and a dynamic list of origins for production
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production domain/IP from environment if exists
prod_origin = os.getenv("ALLOWED_ORIGIN")
if prod_origin:
    allowed_origins.append(prod_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # This ensures that even when the backend crashes, it still sends the CORS headers.
    # Without this, a 500 error in React 19 appears as a "Failed to fetch" due to missing CORS headers.
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "exception": str(exc)},
    )
    # Re-apply CORS headers for the error response
    origin = request.headers.get("origin")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

@app.get("/")
def read_root():
    return {"message": "Security Agent API is Live"}

@app.get("/v1/health")
def health_check():
    return {"status": "ok"}

# Include modularized routers
app.include_router(portal.router)
app.include_router(agent.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
