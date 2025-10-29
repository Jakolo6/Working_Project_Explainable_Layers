# Configuration management for environment variables

from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # Cloudflare R2
    r2_account_id: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket_name: str = "xai-financial-data"
    r2_endpoint_url: str = ""
    
    # Kaggle
    kaggle_username: str = ""
    kaggle_key: str = ""
    
    # Optional
    openai_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    
    # Paths
    model_path: str = "models/xgboost_credit_model.pkl"
    dataset_path: str = "data/german_credit_data.csv"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
