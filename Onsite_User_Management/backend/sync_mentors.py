import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.mentor import Mentor

def sync_mentor_flags():
    db = SessionLocal()
    try:
        print("--- SYNCING MENTOR FLAGS ---")
        
        # Get all internal mentor student IDs
        mentor_student_ids = [m.student_id for m in db.query(Mentor).filter(Mentor.is_internal == True).all() if m.student_id]
        print(f"Found {len(mentor_student_ids)} internal mentors in mentors table.")
        
        # 1. Set is_mentor=True for students who are in mentors table
        students_to_update = db.query(Student).filter(Student.id.in_(mentor_student_ids), Student.is_mentor == False).all()
        print(f"Found {len(students_to_update)} students who are mentors but have is_mentor=False.")
        
        for student in students_to_update:
            print(f"Updating {student.name} ({student.employee_id}) -> is_mentor=True")
            student.is_mentor = True
            
        # 2. Set is_mentor=False for students who are NOT in mentors table but have is_mentor=True
        students_to_fix = db.query(Student).filter(Student.id.notin_(mentor_student_ids), Student.is_mentor == True).all()
        print(f"Found {len(students_to_fix)} students who are NOT mentors but have is_mentor=True.")
        
        for student in students_to_fix:
            print(f"Updating {student.name} ({student.employee_id}) -> is_mentor=False")
            student.is_mentor = False
            
        if students_to_update or students_to_fix:
            db.commit()
            print("Successfully synced mentor flags.")
        else:
            print("No changes needed.")

    finally:
        db.close()

if __name__ == "__main__":
    sync_mentor_flags()
