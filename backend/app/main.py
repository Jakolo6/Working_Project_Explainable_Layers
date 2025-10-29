# Main FastAPI application entry point for XAI Financial Services platform

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import experiment
import os

app = FastAPI(
    title="XAI Financial Services API",
    description="Backend API for credit decision explanation research",
    version="1.0.0"
)

# CORS configuration for frontend communication
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "https://*.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(experiment.router, prefix="/api/v1/experiment", tags=["experiment"])

@app.get("/")
async def root():
    return {"message": "XAI Financial Services API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
