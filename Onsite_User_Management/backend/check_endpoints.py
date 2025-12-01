import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.base import Base, get_db
from app.core.auth import get_current_admin

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_endpoints.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_admin():
    return {"id": 1, "email": "admin@example.com", "role": "admin"}

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_admin] = override_get_current_admin

client = TestClient(app)

def check_endpoints():
    Base.metadata.create_all(bind=engine)
    
    try:
        print("Checking GET /api/v1/students...")
        response = client.get("/api/v1/students")
        print(f"Students Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Students Error: {response.text}")
            
        print("Checking GET /api/v1/mentors...")
        response = client.get("/api/v1/mentors")
        print(f"Mentors Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Mentors Error: {response.text}")
            
    finally:
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_endpoints.db"):
            os.remove("./test_endpoints.db")

if __name__ == "__main__":
    check_endpoints()
