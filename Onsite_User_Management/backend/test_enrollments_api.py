#!/usr/bin/env python3
"""
Test the GET /lms/enrollments?updated_since={timestamp} API endpoint
for BS1981 and Anti-Corruption and Anti-Bribery course.
"""

import sys
import os
import json
from datetime import datetime, timedelta

sys.path.append(os.getcwd())

from app.db.base import SessionLocal
from app.models.student import Student
from app.models.lms_user import LMSUserCourse
from app.services.lms.data import LMSDataService

def test_enrollments_api():
    """Test the enrollments API for BS1981 and Anti-Corruption course."""
    db = SessionLocal()
    
    try:
        # 1. Find student BS1981
        print("=" * 80)
        print("STEP 1: Finding student BS1981")
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
        
        # 2. Find Anti-Corruption and Anti-Bribery course
        print("=" * 80)
        print("STEP 2: Finding Anti-Corruption and Anti-Bribery course")
        print("=" * 80)
        enrollment = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id,
            LMSUserCourse.course_name.ilike('%Anti-Corruption%')
        ).first()
        
        if not enrollment:
            print("❌ Anti-Corruption course not found for BS1981")
            return
        
        print(f"✅ Found enrollment:")
        print(f"   Course ID: {enrollment.lms_course_id}")
        print(f"   Course Name: {enrollment.course_name}")
        print(f"   Enrollment Time: {enrollment.enrollment_time}")
        print(f"   Updated At: {enrollment.updated_at}")
        print()
        
        # 3. Test API without updated_since (get all enrollments)
        print("=" * 80)
        print("STEP 3: Testing API without updated_since (all enrollments)")
        print("=" * 80)
        all_enrollments = LMSDataService.get_enrollments_updated_since(db, None)
        
        # Filter for BS1981 and Anti-Corruption course
        bs1981_enrollments = [
            e for e in all_enrollments 
            if e.get('username', '').upper() == 'BS1981' and 
               'anti-corruption' in e.get('course_name', '').lower()
        ]
        
        print(f"Total enrollments returned: {len(all_enrollments)}")
        print(f"BS1981 Anti-Corruption enrollments: {len(bs1981_enrollments)}")
        print()
        
        if bs1981_enrollments:
            print("✅ Found BS1981 enrollment in Anti-Corruption course:")
            for e in bs1981_enrollments:
                print(json.dumps(e, indent=2, default=str))
        else:
            print("❌ No BS1981 Anti-Corruption enrollment found in results")
        print()
        
        # 4. Test API with updated_since (1 year ago)
        print("=" * 80)
        print("STEP 4: Testing API with updated_since (1 year ago)")
        print("=" * 80)
        one_year_ago = int((datetime.now() - timedelta(days=365)).timestamp())
        print(f"Updated since timestamp: {one_year_ago}")
        print(f"Updated since date: {datetime.fromtimestamp(one_year_ago)}")
        print()
        
        recent_enrollments = LMSDataService.get_enrollments_updated_since(db, one_year_ago)
        
        # Filter for BS1981 and Anti-Corruption course
        bs1981_recent = [
            e for e in recent_enrollments 
            if e.get('username', '').upper() == 'BS1981' and 
               'anti-corruption' in e.get('course_name', '').lower()
        ]
        
        print(f"Total enrollments returned (updated since 1 year ago): {len(recent_enrollments)}")
        print(f"BS1981 Anti-Corruption enrollments: {len(bs1981_recent)}")
        print()
        
        if bs1981_recent:
            print("✅ Found BS1981 enrollment in Anti-Corruption course (updated since 1 year ago):")
            for e in bs1981_recent:
                print(json.dumps(e, indent=2, default=str))
        else:
            print("❌ No BS1981 Anti-Corruption enrollment found in recent results")
        print()
        
        # 5. Test API with updated_since (very old timestamp - should return all)
        print("=" * 80)
        print("STEP 5: Testing API with updated_since (very old - should return all)")
        print("=" * 80)
        very_old = int((datetime.now() - timedelta(days=3650)).timestamp())  # 10 years ago
        print(f"Updated since timestamp: {very_old}")
        print(f"Updated since date: {datetime.fromtimestamp(very_old)}")
        print()
        
        old_enrollments = LMSDataService.get_enrollments_updated_since(db, very_old)
        
        # Filter for BS1981 and Anti-Corruption course
        bs1981_old = [
            e for e in old_enrollments 
            if e.get('username', '').upper() == 'BS1981' and 
               'anti-corruption' in e.get('course_name', '').lower()
        ]
        
        print(f"Total enrollments returned (updated since 10 years ago): {len(old_enrollments)}")
        print(f"BS1981 Anti-Corruption enrollments: {len(bs1981_old)}")
        print()
        
        if bs1981_old:
            print("✅ Found BS1981 enrollment in Anti-Corruption course (updated since 10 years ago):")
            for e in bs1981_old:
                print(json.dumps(e, indent=2, default=str))
        else:
            print("❌ No BS1981 Anti-Corruption enrollment found in old results")
        print()
        
        # 6. Show the exact API response format
        print("=" * 80)
        print("STEP 6: API Response Format (as per specification)")
        print("=" * 80)
        if bs1981_enrollments:
            enrollment_data = bs1981_enrollments[0]
            api_response = {
                "enrollments": [{
                    "userid": enrollment_data.get("userid"),
                    "courseid": enrollment_data.get("courseid"),
                    "status": enrollment_data.get("status"),
                    "timestart": enrollment_data.get("timestart"),
                    "timeend": enrollment_data.get("timeend"),
                    "timecreated": enrollment_data.get("timecreated"),
                    "timemodified": enrollment_data.get("timemodified")
                }],
                "synced_after": None
            }
            print("API Response (formatted as per spec):")
            print(json.dumps(api_response, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_enrollments_api()
