"""Check what the API is returning for BS1981's enrollments"""
import requests

response = requests.get("http://localhost:8000/api/students/BS1981/enrollments")
data = response.json()

print("\n=== Online Courses ===")
for course in data.get('online_courses', []):
    print(f"\nCourse: {course.get('course_name')}")
    print(f"  date_assigned: {course.get('date_assigned')}")
    print(f"  course_start_date: {course.get('course_start_date')}")
    print(f"  completion_date: {course.get('completion_date')}")
    print(f"  progress: {course.get('progress')}")
    
    # Convert timestamp to readable date
    if course.get('date_assigned'):
        from datetime import datetime
        print(f"  date_assigned (readable): {datetime.fromtimestamp(course.get('date_assigned'))}")
