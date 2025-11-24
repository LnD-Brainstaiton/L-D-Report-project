"""Test script to sync employees from LMS API."""
import asyncio
import sys
from app.db.base import SessionLocal
from app.services.lms_service import LMSService
from app.models.student import Student
from app.core.validation import validate_department
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_sync():
    """Test syncing employees from LMS."""
    db = SessionLocal()
    
    try:
        logger.info("Fetching users from LMS API...")
        lms_users = await LMSService.fetch_all_users()
        logger.info(f"Fetched {len(lms_users)} users from LMS")
        
        stats = {
            "total_fetched": len(lms_users),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }
        
        for user in lms_users:
            try:
                # Map LMS user to student format
                student_data = LMSService.map_lms_user_to_student(user)
                
                if not student_data:
                    stats["skipped"] += 1
                    continue
                
                employee_id = student_data["employee_id"]
                email = student_data["email"]
                
                # Validate department
                try:
                    department = validate_department(student_data.get("department", "Other"))
                except ValueError:
                    department = "Other"
                
                # Check if student exists
                existing_student = db.query(Student).filter(
                    (Student.employee_id == employee_id) | (Student.email == email)
                ).first()
                
                if existing_student:
                    # Update existing
                    existing_student.name = student_data["name"]
                    existing_student.email = email
                    existing_student.department = department
                    existing_student.is_active = student_data.get("is_active", True)
                    if student_data.get("designation"):
                        existing_student.designation = student_data["designation"]
                    stats["updated"] += 1
                else:
                    # Create new
                    new_student = Student(
                        employee_id=employee_id,
                        name=student_data["name"],
                        email=email,
                        department=department,
                        is_active=student_data.get("is_active", True),
                        designation=student_data.get("designation"),
                    )
                    db.add(new_student)
                    stats["created"] += 1
                
            except Exception as e:
                error_msg = f"Error processing user {user.get('username', user.get('id', 'unknown'))}: {str(e)}"
                stats["errors"].append(error_msg)
                logger.error(error_msg)
                continue
        
        # Commit
        db.commit()
        
        # Print results
        print("\n" + "="*50)
        print("SYNC RESULTS")
        print("="*50)
        print(f"Total fetched from LMS: {stats['total_fetched']}")
        print(f"Created: {stats['created']}")
        print(f"Updated: {stats['updated']}")
        print(f"Skipped: {stats['skipped']}")
        if stats['errors']:
            print(f"\nErrors ({len(stats['errors'])}):")
            for error in stats['errors'][:10]:  # Show first 10 errors
                print(f"  - {error}")
        
        # Check final counts
        total = db.query(Student).count()
        active = db.query(Student).filter(Student.is_active == True).count()
        inactive = db.query(Student).filter(Student.is_active == False).count()
        
        print("\n" + "="*50)
        print("DATABASE STATUS")
        print("="*50)
        print(f"Total students: {total}")
        print(f"Active employees: {active}")
        print(f"Inactive employees: {inactive}")
        
        # Show sample of employees
        if total > 0:
            print("\n" + "="*50)
            print("SAMPLE EMPLOYEES (first 5)")
            print("="*50)
            sample = db.query(Student).limit(5).all()
            for s in sample:
                status = "Active" if s.is_active else "Inactive"
                print(f"  {s.employee_id} | {s.name} | {s.email} | {s.department} | {status}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing from LMS: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_sync())

