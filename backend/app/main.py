# Main FastAPI application entry point for XAI Financial Services platform

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import experiment_clean as experiment, admin, explanations
import os

app = FastAPI(
    title="XAI Financial Services API",
    description="Backend API for credit decision explanation research",
    version="1.0.0"
)

# CORS configuration - must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight for 24 hours
)

# Global exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Include API routers
app.include_router(experiment.router)
app.include_router(admin.router)
app.include_router(explanations.router)

@app.get("/")
async def root():
    return {"message": "XAI Financial Services API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
