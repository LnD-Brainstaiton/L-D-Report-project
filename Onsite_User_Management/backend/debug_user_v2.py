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
        print("--- DEBUGGING STUDENTS ---")
        # Try finding by ID with and without BS prefix
        ids_to_check = ['0080', 'BS0080', '0342', 'BS0342']
        
        for eid in ids_to_check:
            student = db.query(Student).filter(Student.employee_id == eid).first()
            if student:
                print(f"FOUND Student '{eid}': ID={student.id}, Name={student.name}, Active={student.is_active}, IsMentor={student.is_mentor}, Dept={student.department}")
            else:
                print(f"Student '{eid}' NOT FOUND in students table.")

        print("\n--- DEBUGGING MENTORS ---")
        mentors = db.query(Mentor).all()
        print(f"Total Mentors found: {len(mentors)}")
        for mentor in mentors:
            student_info = "N/A"
            if mentor.student:
                student_info = f"ID={mentor.student.id} EmpID={mentor.student.employee_id} Active={mentor.student.is_active}"
            
            print(f"Mentor ID={mentor.id}: Name={mentor.name}, Type={'Internal' if mentor.is_internal else 'External'}, StudentInfo=[{student_info}]")

    finally:
        db.close()

if __name__ == "__main__":
    debug_user()
