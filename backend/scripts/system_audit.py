#!/usr/bin/env python3
"""
System Audit Script for XAI Financial Services Platform
Validates all services, connections, and configurations
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError
from supabase import create_client, Client
import requests
from typing import Dict, List, Tuple

# Load environment variables
load_dotenv()

class SystemAuditor:
    def __init__(self):
        self.results = {
            "env_vars": {},
            "supabase": {},
            "r2": {},
            "kaggle": {},
            "backend": {},
            "frontend": {}
        }
        
    def print_header(self, title: str):
        """Print formatted section header"""
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}\n")
    
    def print_status(self, item: str, status: bool, message: str = ""):
        """Print status with emoji"""
        emoji = "✅" if status else "❌"
        print(f"{emoji} {item}: {message if message else ('OK' if status else 'FAILED')}")
    
    # ========================================================================
    # 1. ENVIRONMENT VARIABLES VALIDATION
    # ========================================================================
    
    def validate_env_vars(self):
        """Check all required environment variables"""
        self.print_header("1. ENVIRONMENT VARIABLES VALIDATION")
        
        required_vars = {
            "SUPABASE_URL": "Supabase project URL",
            "SUPABASE_KEY": "Supabase anon key",
            "R2_ACCOUNT_ID": "Cloudflare R2 account ID",
            "R2_ACCESS_KEY_ID": "R2 access key ID",
            "R2_SECRET_ACCESS_KEY": "R2 secret access key",
            "R2_BUCKET_NAME": "R2 bucket name",
            "R2_ENDPOINT_URL": "R2 endpoint URL",
            "KAGGLE_USERNAME": "Kaggle username",
            "KAGGLE_KEY": "Kaggle API key",
            "FRONTEND_URL": "Frontend URL for CORS"
        }
        
        for var, description in required_vars.items():
            value = os.getenv(var)
            is_valid = bool(value and value.strip() and "your_" not in value.lower())
            self.results["env_vars"][var] = is_valid
            
            if is_valid:
                # Mask sensitive values
                if "KEY" in var or "SECRET" in var:
                    display_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
                else:
                    display_value = value
                self.print_status(f"{var}", True, f"{description} - {display_value}")
            else:
                self.print_status(f"{var}", False, f"{description} - MISSING or PLACEHOLDER")
        
        all_valid = all(self.results["env_vars"].values())
        print(f"\n{'='*80}")
        print(f"Environment Variables: {'✅ ALL VALID' if all_valid else '❌ SOME MISSING'}")
        return all_valid
    
    # ========================================================================
    # 2. SUPABASE CONNECTION & TABLES
    # ========================================================================
    
    def verify_supabase(self):
        """Test Supabase connection and verify tables"""
        self.print_header("2. SUPABASE DATABASE VERIFICATION")
        
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                self.print_status("Supabase Connection", False, "Missing credentials")
                return False
            
            # Create client
            supabase: Client = create_client(supabase_url, supabase_key)
            self.print_status("Supabase Connection", True, f"Connected to {supabase_url}")
            
            # Check tables
            required_tables = [
                "sessions",
                "predictions",
                "participant_responses",
                "pre_experiment_responses",
                "post_experiment_responses",
                "layer_feedback"
            ]
            
            print(f"\nTable Verification:")
            for table in required_tables:
                try:
                    # Try to query the table
                    response = supabase.table(table).select("*", count="exact").limit(0).execute()
                    count = response.count if hasattr(response, 'count') else 0
                    self.results["supabase"][table] = True
                    self.print_status(f"  Table '{table}'", True, f"Exists (0 rows)")
                except Exception as e:
                    self.results["supabase"][table] = False
                    self.print_status(f"  Table '{table}'", False, f"Error: {str(e)[:50]}")
            
            # Sample queries
            print(f"\nSample Queries:")
            for table in required_tables:
                if self.results["supabase"].get(table):
                    print(f"  SELECT COUNT(*) FROM {table};")
            
            all_tables_exist = all(self.results["supabase"].values())
            print(f"\n{'='*80}")
            print(f"Supabase Tables: {'✅ ALL EXIST' if all_tables_exist else '❌ SOME MISSING'}")
            return all_tables_exist
            
        except Exception as e:
            self.print_status("Supabase Connection", False, str(e))
            return False
    
    # ========================================================================
    # 3. CLOUDFLARE R2 VERIFICATION
    # ========================================================================
    
    def verify_r2(self):
        """Test Cloudflare R2 connection and bucket access"""
        self.print_header("3. CLOUDFLARE R2 STORAGE VERIFICATION")
        
        try:
            account_id = os.getenv("R2_ACCOUNT_ID")
            access_key = os.getenv("R2_ACCESS_KEY_ID")
            secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
            bucket_name = os.getenv("R2_BUCKET_NAME")
            
            if not all([account_id, access_key, secret_key, bucket_name]):
                self.print_status("R2 Connection", False, "Missing credentials")
                return False
            
            # Create S3 client for R2
            s3_client = boto3.client(
                's3',
                endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name='auto'
            )
            
            # Test connection by listing buckets
            try:
                response = s3_client.list_buckets()
                buckets = [b['Name'] for b in response.get('Buckets', [])]
                self.print_status("R2 Connection", True, f"Connected successfully")
                
                # Check if our bucket exists
                if bucket_name in buckets:
                    self.print_status(f"Bucket '{bucket_name}'", True, "Exists")
                    self.results["r2"]["bucket_exists"] = True
                    
                    # List files in bucket
                    try:
                        objects = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
                        if 'Contents' in objects:
                            print(f"\nBucket Contents (first 10 files):")
                            for obj in objects['Contents']:
                                size_mb = obj['Size'] / (1024 * 1024)
                                print(f"  - {obj['Key']} ({size_mb:.2f} MB)")
                            self.results["r2"]["files_accessible"] = True
                        else:
                            print(f"\nBucket is empty")
                            self.results["r2"]["files_accessible"] = True
                    except Exception as e:
                        self.print_status("List Bucket Files", False, str(e)[:50])
                        self.results["r2"]["files_accessible"] = False
                else:
                    self.print_status(f"Bucket '{bucket_name}'", False, "Does not exist")
                    self.results["r2"]["bucket_exists"] = False
                    print(f"\nAvailable buckets: {', '.join(buckets) if buckets else 'None'}")
                
            except ClientError as e:
                self.print_status("R2 Connection", False, str(e))
                return False
            
            print(f"\n{'='*80}")
            r2_ok = self.results["r2"].get("bucket_exists", False)
            print(f"R2 Storage: {'✅ ACCESSIBLE' if r2_ok else '❌ ISSUES FOUND'}")
            return r2_ok
            
        except Exception as e:
            self.print_status("R2 Setup", False, str(e))
            return False
    
    # ========================================================================
    # 4. KAGGLE API VERIFICATION
    # ========================================================================
    
    def verify_kaggle(self):
        """Test Kaggle API connection"""
        self.print_header("4. KAGGLE API VERIFICATION")
        
        try:
            username = os.getenv("KAGGLE_USERNAME")
            api_key = os.getenv("KAGGLE_KEY")
            
            if not username or not api_key:
                self.print_status("Kaggle Credentials", False, "Missing")
                return False
            
            # Set Kaggle credentials
            os.environ['KAGGLE_USERNAME'] = username
            os.environ['KAGGLE_KEY'] = api_key
            
            # Try importing kaggle
            try:
                from kaggle.api.kaggle_api_extended import KaggleApi
                api = KaggleApi()
                api.authenticate()
                self.print_status("Kaggle Authentication", True, f"Authenticated as {username}")
                
                # Try to list datasets (just to verify connection)
                try:
                    datasets = api.dataset_list(search="credit", page_size=3)
                    self.print_status("Kaggle API Access", True, f"Can access datasets")
                    print(f"\nSample datasets found:")
                    for ds in datasets[:3]:
                        print(f"  - {ds.ref}")
                    self.results["kaggle"]["api_works"] = True
                except Exception as e:
                    self.print_status("Kaggle API Access", False, str(e)[:50])
                    self.results["kaggle"]["api_works"] = False
                    
            except ImportError:
                self.print_status("Kaggle Package", False, "Not installed (pip install kaggle)")
                return False
            
            print(f"\n{'='*80}")
            kaggle_ok = self.results["kaggle"].get("api_works", False)
            print(f"Kaggle API: {'✅ WORKING' if kaggle_ok else '❌ ISSUES FOUND'}")
            return kaggle_ok
            
        except Exception as e:
            self.print_status("Kaggle Setup", False, str(e))
            return False
    
    # ========================================================================
    # 5. BACKEND SCRIPTS & MODEL CHECK
    # ========================================================================
    
    def verify_backend_scripts(self):
        """Check backend scripts and model files"""
        self.print_header("5. BACKEND SCRIPTS & MODEL VERIFICATION")
        
        base_path = Path(__file__).parent.parent
        
        # Check scripts
        scripts = {
            "download_dataset.py": "Dataset download script",
            "train_model.py": "Model training script"
        }
        
        print("Script Files:")
        for script, description in scripts.items():
            script_path = base_path / "scripts" / script
            exists = script_path.exists()
            self.results["backend"][script] = exists
            self.print_status(f"  {script}", exists, description)
        
        # Check if scripts can import
        print("\nScript Import Test:")
        for script in scripts.keys():
            try:
                module_name = script.replace(".py", "")
                # Don't actually import to avoid execution, just check syntax
                script_path = base_path / "scripts" / script
                if script_path.exists():
                    with open(script_path, 'r') as f:
                        compile(f.read(), script_path, 'exec')
                    self.print_status(f"  {script} syntax", True, "Valid Python")
                else:
                    self.print_status(f"  {script} syntax", False, "File not found")
            except SyntaxError as e:
                self.print_status(f"  {script} syntax", False, f"Syntax error: {e}")
        
        # Check model file in R2 (if R2 is accessible)
        if self.results["r2"].get("bucket_exists"):
            print("\nModel File Check (in R2):")
            try:
                account_id = os.getenv("R2_ACCOUNT_ID")
                access_key = os.getenv("R2_ACCESS_KEY_ID")
                secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
                bucket_name = os.getenv("R2_BUCKET_NAME")
                
                s3_client = boto3.client(
                    's3',
                    endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key,
                    region_name='auto'
                )
                
                # Check for model file
                model_key = "models/xgboost_credit_model.pkl"
                try:
                    s3_client.head_object(Bucket=bucket_name, Key=model_key)
                    self.print_status(f"  Model file '{model_key}'", True, "Exists in R2")
                    self.results["backend"]["model_exists"] = True
                except ClientError:
                    self.print_status(f"  Model file '{model_key}'", False, "Not found in R2")
                    self.results["backend"]["model_exists"] = False
                    
            except Exception as e:
                self.print_status("Model Check", False, str(e)[:50])
        
        print(f"\n{'='*80}")
        scripts_ok = all(self.results["backend"].get(s, False) for s in scripts.keys())
        print(f"Backend Scripts: {'✅ ALL PRESENT' if scripts_ok else '❌ SOME MISSING'}")
        return scripts_ok
    
    # ========================================================================
    # 6. BACKEND API HEALTH CHECK
    # ========================================================================
    
    def verify_backend_api(self):
        """Test backend API endpoints"""
        self.print_header("6. BACKEND API HEALTH CHECK")
        
        backend_url = os.getenv("FRONTEND_URL", "").replace("novaxai.netlify.app", "working-project-explainable-layers.up.railway.app")
        if "localhost" in backend_url:
            backend_url = "https://working-project-explainable-layers.up.railway.app"
        
        print(f"Testing API at: {backend_url}")
        
        # Test root endpoint
        try:
            response = requests.get(f"{backend_url}/", timeout=10)
            self.print_status("Root endpoint (/)", response.status_code == 200, f"Status: {response.status_code}")
            self.results["backend"]["root_endpoint"] = response.status_code == 200
        except Exception as e:
            self.print_status("Root endpoint (/)", False, str(e)[:50])
            self.results["backend"]["root_endpoint"] = False
        
        # Test docs endpoint
        try:
            response = requests.get(f"{backend_url}/docs", timeout=10)
            self.print_status("API docs (/docs)", response.status_code == 200, f"Status: {response.status_code}")
            self.results["backend"]["docs_endpoint"] = response.status_code == 200
        except Exception as e:
            self.print_status("API docs (/docs)", False, str(e)[:50])
            self.results["backend"]["docs_endpoint"] = False
        
        print(f"\n{'='*80}")
        api_ok = self.results["backend"].get("root_endpoint", False)
        print(f"Backend API: {'✅ ACCESSIBLE' if api_ok else '❌ NOT ACCESSIBLE'}")
        print(f"\nNote: Full endpoint testing requires the backend to be deployed and running.")
        return api_ok
    
    # ========================================================================
    # 7. FRONTEND CONNECTION TEST
    # ========================================================================
    
    def verify_frontend(self):
        """Test frontend configuration"""
        self.print_header("7. FRONTEND CONFIGURATION CHECK")
        
        frontend_url = os.getenv("FRONTEND_URL", "https://novaxai.netlify.app")
        api_url = "https://working-project-explainable-layers.up.railway.app"
        
        print(f"Frontend URL: {frontend_url}")
        print(f"Expected API URL: {api_url}")
        
        # Check if frontend is accessible
        try:
            response = requests.get(frontend_url, timeout=10)
            self.print_status("Frontend accessible", response.status_code == 200, f"Status: {response.status_code}")
            self.results["frontend"]["accessible"] = response.status_code == 200
        except Exception as e:
            self.print_status("Frontend accessible", False, str(e)[:50])
            self.results["frontend"]["accessible"] = False
        
        # Check .env.local file
        env_local_path = Path(__file__).parent.parent.parent / "frontend" / ".env.local"
        if env_local_path.exists():
            with open(env_local_path, 'r') as f:
                content = f.read()
                has_api_url = "NEXT_PUBLIC_API_URL" in content
                self.print_status(".env.local file", has_api_url, "Contains NEXT_PUBLIC_API_URL")
                self.results["frontend"]["env_configured"] = has_api_url
        else:
            self.print_status(".env.local file", False, "Not found")
            self.results["frontend"]["env_configured"] = False
        
        print(f"\n{'='*80}")
        frontend_ok = self.results["frontend"].get("accessible", False)
        print(f"Frontend: {'✅ DEPLOYED' if frontend_ok else '❌ NOT ACCESSIBLE'}")
        return frontend_ok
    
    # ========================================================================
    # FINAL SUMMARY
    # ========================================================================
    
    def print_summary(self):
        """Print final audit summary"""
        self.print_header("SYSTEM AUDIT SUMMARY")
        
        categories = {
            "Environment Variables": self.results["env_vars"],
            "Supabase Database": self.results["supabase"],
            "Cloudflare R2": self.results["r2"],
            "Kaggle API": self.results["kaggle"],
            "Backend Scripts": self.results["backend"],
            "Frontend": self.results["frontend"]
        }
        
        for category, results in categories.items():
            if results:
                passed = sum(1 for v in results.values() if v)
                total = len(results)
                status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
                print(f"{status} {category}: {passed}/{total} checks passed")
        
        print(f"\n{'='*80}")
        
        # Overall status
        all_passed = all(
            all(results.values()) if results else False 
            for results in categories.values()
        )
        
        if all_passed:
            print("🎉 ALL SYSTEMS OPERATIONAL - Ready for experiment phase!")
        else:
            print("⚠️  SOME ISSUES FOUND - Review failures above before proceeding")
        
        print(f"{'='*80}\n")
    
    def run_full_audit(self):
        """Run complete system audit"""
        print("\n" + "="*80)
        print("  XAI FINANCIAL SERVICES PLATFORM - SYSTEM AUDIT")
        print("="*80)
        
        self.validate_env_vars()
        self.verify_supabase()
        self.verify_r2()
        self.verify_kaggle()
        self.verify_backend_scripts()
        self.verify_backend_api()
        self.verify_frontend()
        self.print_summary()

if __name__ == "__main__":
    auditor = SystemAuditor()
    auditor.run_full_audit()
