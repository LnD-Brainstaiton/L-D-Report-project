import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.mentor import Mentor

def debug_user():
    db = SessionLocal()
    try:
        print("Searching for student with employee_id '0080'...")
        student = db.query(Student).filter(Student.employee_id == '0080').first()
        if student:
            print(f"Found Student: ID={student.id}, Name={student.name}, Active={student.is_active}, IsMentor={student.is_mentor}")
        else:
            print("Student '0080' NOT FOUND in students table.")

        print("\nSearching for student with employee_id '0342'...")
        student_0342 = db.query(Student).filter(Student.employee_id == '0342').first()
        if student_0342:
            print(f"Found Student: ID={student_0342.id}, Name={student_0342.name}, Active={student_0342.is_active}, IsMentor={student_0342.is_mentor}")
        else:
            print("Student '0342' NOT FOUND in students table.")

        print("\nSearching for Mentors...")
        mentors = db.query(Mentor).all()
        for mentor in mentors:
            # Check if this mentor is related to 0080
            if mentor.student and mentor.student.employee_id == '0080':
                print(f"Found Mentor linked to 0080: ID={mentor.id}, Name={mentor.name}, Type={'Internal' if mentor.is_internal else 'External'}")
            
            # Check if this mentor is related to 0342
            if mentor.student and mentor.student.employee_id == '0342':
                print(f"Found Mentor linked to 0342: ID={mentor.id}, Name={mentor.name}, Type={'Internal' if mentor.is_internal else 'External'}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_user()
