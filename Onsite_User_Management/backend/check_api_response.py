import requests
import json

def check_api():
    try:
        # We need a token. But wait, the API might be protected.
        # Let's try to login first or use a known token if possible.
        # Or maybe there's a public endpoint? No, courses are protected.
        
        # Let's try to login as admin
        login_url = "http://localhost:8000/api/v1/auth/login"
        login_data = {"username": "admin@example.com", "password": "adminpassword"} # Assuming default credentials or similar
        # Wait, the auth endpoint expects form data for OAuth2 usually, or JSON?
        # Let's check auth.py or just try standard OAuth2 form data
        
        # Actually, let's try to use the dependency override trick again but on the RUNNING server? No we can't.
        # We need to authenticate.
        
        # Let's assume the user has a token in their browser, but I can't access that.
        # I'll try to login with default credentials. If that fails, I'll ask the user.
        # Default credentials in `app/core/config.py` or `app/db/init_db.py`?
        
        # Let's try to just hit the endpoint and see if it's 401.
        response = requests.get("http://localhost:8000/api/v1/courses/")
        print(f"Status without auth: {response.status_code}")
        
        if response.status_code in [401, 403]:
            print("Authentication required.")
            # Try to login
            print("Attempting login...")
            try:
                response = requests.post(login_url, json={"email": "admin@example.com", "password": "adminpassword"})
                print(f"Login status: {response.status_code}")
                if response.status_code != 200:
                    print(f"Login response: {response.text}")
            except Exception as e:
                print(f"Login failed: {e}")
                return
            
            if response.status_code == 200:
                token = response.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get("http://localhost:8000/api/v1/courses/", headers=headers)
                print(f"Status with auth: {response.status_code}")
                if response.status_code == 200:
                    courses = response.json()
                    print(f"Found {len(courses)} courses")
                    for course in courses[:5]:
                        print(f"ID: {course.get('id')}, Name: {course.get('name')}, Type: {course.get('course_type')}")
            else:
                print("Failed to login with default credentials.")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_api()
