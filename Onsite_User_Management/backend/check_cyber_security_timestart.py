#!/usr/bin/env python3
"""
Check timestart for Cyber Security and Physical Protection course for BS1981.
"""

import sys
import os
import json
from datetime import datetime

sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from app.services.lms.data import LMSDataService

def check_cyber_security_timestart():
    """Check timestart for Cyber Security course for BS1981."""
    db = SessionLocal()
    
    try:
        # 1. Find student BS1981
        print("=" * 80)
        print("Finding student BS1981")
        print("=" * 80)
        student = db.query(Student).filter(
            Student.employee_id.ilike('%BS1981%')
        ).first()
        
        if not student:
            print("❌ Student BS1981 not found")
            return
        
        print(f"✅ Found student:")
        print(f"   ID: {student.id}")
        print(f"   Employee ID: {student.employee_id}")
        print(f"   Name: {student.name}")
        print()
        
        # 2. Find Cyber Security and Physical Protection course
        print("=" * 80)
        print("Finding Cyber Security and Physical Protection course")
        print("=" * 80)
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.course_name.ilike('%Cyber Security%')
        ).first()
        
        if not enrollment:
            print("❌ Cyber Security course not found for BS1981")
            return
        
        print(f"✅ Found enrollment:")
        print(f"   Course ID: {enrollment.lms_course_id}")
        print(f"   Course Name: {enrollment.course_name}")
        print(f"   Enrollment Time: {enrollment.enrollment_time}")
        print(f"   Start Date: {enrollment.start_date}")
        print(f"   Updated At: {enrollment.updated_at}")
        print()
        
        # 3. Get enrollment data from API
        print("=" * 80)
        print("Enrollment Data from API")
        print("=" * 80)
        all_enrollments = LMSDataService.get_enrollments_updated_since(db, None)
        
        # Filter for BS1981 and Cyber Security course
        cyber_enrollments = [
            e for e in all_enrollments 
            if e.get('username', '').upper() == 'BS1981' and 
               ('cyber' in e.get('course_name', '').lower() or 'security' in e.get('course_name', '').lower())
        ]
        
        if cyber_enrollments:
            print("✅ Found BS1981 enrollment in Cyber Security course:")
            for e in cyber_enrollments:
                print(f"\nCourse: {e.get('course_name')}")
                print(f"  userid: {e.get('userid')}")
                print(f"  courseid: {e.get('courseid')}")
                print(f"  status: {e.get('status')}")
                
                timestart = e.get('timestart')
                if timestart:
                    print(f"  timestart: {timestart}")
                    print(f"  timestart (date): {datetime.fromtimestamp(timestart)}")
                else:
                    print(f"  timestart: null")
                
                timeend = e.get('timeend')
                if timeend:
                    print(f"  timeend: {timeend}")
                    print(f"  timeend (date): {datetime.fromtimestamp(timeend)}")
                else:
                    print(f"  timeend: null")
                
                timecreated = e.get('timecreated')
                if timecreated:
                    print(f"  timecreated: {timecreated}")
                    print(f"  timecreated (date): {datetime.fromtimestamp(timecreated)}")
                else:
                    print(f"  timecreated: null")
                
                timemodified = e.get('timemodified')
                if timemodified:
                    print(f"  timemodified: {timemodified}")
                    print(f"  timemodified (date): {datetime.fromtimestamp(timemodified)}")
                else:
                    print(f"  timemodified: null")
                
                print("\nFull JSON:")
                print(json.dumps(e, indent=2, default=str))
        else:
            print("❌ No BS1981 Cyber Security enrollment found in results")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_cyber_security_timestart()

