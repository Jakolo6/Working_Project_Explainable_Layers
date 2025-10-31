# Main FastAPI application entry point for XAI Financial Services platform

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import experiment, admin
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
    "http://localhost:3000",
    "*"  # Allow all origins for Railway deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permissive CORS for initial deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(experiment.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "XAI Financial Services API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
