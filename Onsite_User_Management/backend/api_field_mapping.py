#!/usr/bin/env python3
"""
Show the exact mapping between LMS API response fields and database fields.
This shows which API fields are used to populate which database columns.
"""

print("""
================================================================================
API RESPONSE FIELD → DATABASE FIELD MAPPING
================================================================================

This document shows which fields from the LMS API responses are used to populate
the database time fields, and which fields are returned in our API responses.

================================================================================
1. COURSE DATA (from core_course_get_courses API)
================================================================================

LMS API Response Fields → LMSCourseCache Table:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Database Column           │ Notes               │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ startdate               │ startdate                 │ Unix timestamp      │
│ enddate                 │ enddate                   │ Unix timestamp      │
│ timecreated             │ timecreated                │ Unix timestamp      │
│ (auto-generated)        │ cached_at                 │ When synced         │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

Our API Returns (GET /lms/courses):
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Source                   │ Format              │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ startdate               │ LMSCourseCache.startdate │ Unix timestamp      │
│ enddate                 │ LMSCourseCache.enddate   │ Unix timestamp      │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

================================================================================
2. ENROLLMENT DATA (from core_enrol_get_enrolled_users API)
================================================================================

LMS API Response Fields → LMSUserCourse Table:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Database Column           │ Priority/Notes      │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ enrolments[0].timecreated│ enrollment_time         │ Priority 1          │
│ enrolments[0].timestart  │ enrollment_time         │ Priority 1 (fallback)│
│ timecreated              │ enrollment_time         │ Priority 2           │
│ timestart                │ enrollment_time         │ Priority 2 (fallback)│
│ firstaccess              │ enrollment_time         │ Priority 3 (fallback)│
│                         │                          │                     │
│ (from course)            │ start_date               │ From course.startdate│
│ course.startdate         │ start_date               │ Converted to DateTime│
│ course.enddate           │ end_date                 │ Converted to DateTime│
│                         │                          │                     │
│ (from progress sync)     │ last_access              │ From progress API   │
│ lastaccess               │ last_access              │ Converted to DateTime│
│                         │                          │                     │
│ (from completion API)    │ completion_date          │ From completion API │
│ timecompleted            │ completion_date          │ Max of all completions│
│                         │                          │                     │
│ (auto-generated)        │ created_at               │ When record created │
│ (auto-generated)        │ updated_at               │ When record updated │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

Priority for enrollment_time:
  1. enrolments[0].timecreated (most accurate - actual enrollment time)
  2. enrolments[0].timestart (enrollment start time)
  3. user.timecreated (user-level enrollment time)
  4. user.timestart (user-level enrollment start)
  5. user.firstaccess (first time user accessed course - fallback)

================================================================================
3. USER COURSES (from core_enrol_get_users_courses API)
================================================================================

LMS API Response Fields → Used in Progress Sync:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Database Column           │ Notes               │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ progress                │ progress                 │ 0-100 percentage    │
│ completed               │ completed                │ Boolean             │
│ lastaccess              │ last_access              │ Converted to DateTime│
└─────────────────────────┴──────────────────────────┴─────────────────────┘

================================================================================
4. COMPLETION DATA (from core_completion_get_course_completion_status API)
================================================================================

LMS API Response Fields → LMSUserCourse Table:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Database Column           │ Notes               │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ completions[].timecompleted│ completion_date       │ Max of all times    │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

================================================================================
5. OUR API RESPONSES - What We Return
================================================================================

GET /lms/courses/{course_id}/enrollments returns:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Source Database Field     │ Format              │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ firstaccess              │ enrollment.start_date     │ Unix timestamp      │
│ lastaccess               │ enrollment.last_access    │ Unix timestamp      │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

GET /lms/users/{username}/courses returns:
┌─────────────────────────┬──────────────────────────┬─────────────────────┐
│ API Response Field      │ Source Database Field     │ Format              │
├─────────────────────────┼──────────────────────────┼─────────────────────┤
│ startdate                │ enrollment.start_date     │ Unix timestamp      │
│ enddate                  │ enrollment.end_date       │ Unix timestamp      │
│ lastaccess               │ enrollment.last_access    │ Unix timestamp      │
└─────────────────────────┴──────────────────────────┴─────────────────────┘

================================================================================
6. EXAMPLE: Cyber Security Course (Course ID 492) for BS1981
================================================================================

Database Values:
  • enrollment_time:     2025-09-19 11:38:07
     └─ Source: enrolments[0].timecreated from core_enrol_get_enrolled_users
  
  • start_date:          2024-08-01 05:00:00
     └─ Source: course.startdate from core_course_get_courses
  
  • end_date:            None
     └─ Source: course.enddate from core_course_get_courses (was 0, treated as None)
  
  • last_access:         2025-10-16 12:32:14
     └─ Source: lastaccess from core_enrol_get_users_courses (progress sync)
  
  • completion_date:     2025-10-16 12:28:06
     └─ Source: completions[].timecompleted from core_completion_get_course_completion_status

API Response (GET /lms/courses/492/enrollments):
  • firstaccess: 1722466800 (Unix timestamp)
     └─ Converted from: enrollment.start_date
  
  • lastaccess: 1760596334 (Unix timestamp)
     └─ Converted from: enrollment.last_access

API Response (GET /lms/users/BS1981/courses):
  • startdate: 1722466800 (Unix timestamp)
     └─ Converted from: enrollment.start_date
  
  • lastaccess: 1760596334 (Unix timestamp)
     └─ Converted from: enrollment.last_access

================================================================================
7. CODE LOCATIONS
================================================================================

Sync Enrollment Data:
  File: app/services/lms/data.py
  Function: sync_lms_data()
  Lines: 200-250
  - Maps enrolments[].timecreated → enrollment_time
  - Maps course.startdate → start_date
  - Maps course.enddate → end_date

Sync Progress Data:
  File: app/services/lms/data.py
  Function: sync_progress_data()
  Lines: 329-350
  - Maps lastaccess → last_access
  - Maps completions[].timecompleted → completion_date

Return Enrollment Data:
  File: app/services/lms/data.py
  Function: get_course_enrollments()
  Lines: 93-94
  - Converts start_date → firstaccess (Unix timestamp)
  - Converts last_access → lastaccess (Unix timestamp)

Return User Courses:
  File: app/services/lms/data.py
  Function: get_user_courses()
  Lines: 126-130
  - Converts start_date → startdate (Unix timestamp)
  - Converts end_date → enddate (Unix timestamp)
  - Converts last_access → lastaccess (Unix timestamp)

================================================================================
""")

