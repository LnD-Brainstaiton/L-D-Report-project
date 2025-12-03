#!/usr/bin/env python3
"""
Summary of all LMS APIs used and what they do.
"""

print("""
================================================================================
ALL LMS APIs USED - SUMMARY
================================================================================

1. FETCH ALL COURSES
   ────────────────────────────────────────────────────────────────────────────
   API: core_course_get_courses_by_field
   Function: fetch_lms_courses()
   
   What it does:
   • Gets ALL courses from LMS
   • Returns course details: name, dates, custom fields (like is_mandatory)
   • Used to sync course list
   
   Returns:
   • Array of course objects with: id, fullname, startdate, enddate, 
     timecreated, is_mandatory (from customfields), etc.
   
   When used:
   • Daily sync at 12am
   • Manual sync via /lms/sync endpoint


2. FETCH ALL USERS IN A COURSE
   ────────────────────────────────────────────────────────────────────────────
   API: core_enrol_get_enrolled_users
   Function: fetch_course_enrollments(course_id)
   
   What it does:
   • Gets ALL users enrolled in a specific course
   • Returns user info and access times
   
   Returns:
   • Array of user objects with: username, email, firstaccess, lastaccess
   • ❌ Does NOT return: enrolments[].timecreated (when assigned)
   
   When used:
   • During sync to get who's enrolled in each course
   • Used to populate enrollment records


3. FETCH ALL USERS (FROM LMS)
   ────────────────────────────────────────────────────────────────────────────
   API: core_user_get_users
   Function: fetch_all_users()
   
   What it does:
   • Gets ALL users from LMS system
   • Returns user profile information
   
   Returns:
   • Array of user objects with: id, username, email, fullname, department,
     suspended status, etc.
   
   When used:
   • Daily sync at 12am
   • To sync user/employee data


4. FETCH COURSE CATEGORIES
   ────────────────────────────────────────────────────────────────────────────
   API: core_course_get_categories
   Function: fetch_course_categories()
   
   What it does:
   • Gets all course categories (like "Security", "Compliance", etc.)
   • Maps category IDs to category names
   
   Returns:
   • Dictionary: {category_id: category_name}
   
   When used:
   • During course sync
   • To display category names with courses


5. FETCH USER'S COURSES
   ────────────────────────────────────────────────────────────────────────────
   API: core_enrol_get_users_courses
   Function: fetch_user_courses(username)
   
   What it does:
   • Gets ALL courses for a specific user
   • Shows progress, completion status, last access
   
   Returns:
   • Array of course objects with: id, name, progress, completed, 
     lastaccess, startdate, enddate
   
   When used:
   • Progress sync (to update progress/completion)
   • GET /lms/users/{username}/courses endpoint


6. FETCH USER BY USERNAME
   ────────────────────────────────────────────────────────────────────────────
   API: core_user_get_users_by_field
   Function: fetch_user_by_username(username)
   
   What it does:
   • Finds a specific user by username (employee ID)
   • Gets user profile information
   
   Returns:
   • User object with profile data
   
   When used:
   • Helper function for other APIs
   • To find user ID before calling fetch_user_courses()


7. FETCH COURSE COMPLETION STATUS
   ────────────────────────────────────────────────────────────────────────────
   API: core_completion_get_course_completion_status
   Function: fetch_course_completion_status(course_id, user_id)
   
   What it does:
   • Gets detailed completion status for a user in a course
   • Shows completion criteria, completion date
   
   Returns:
   • Completion status object with: completions[].timecompleted
   • Used to get exact completion date
   
   When used:
   • Progress sync (to get completion_date)
   • To determine when course was completed


================================================================================
API FLOW SUMMARY
================================================================================

SYNC PROCESS (Daily at 12am):
  1. fetch_all_users() → Get all users
  2. fetch_lms_courses() → Get all courses
  3. fetch_course_categories() → Get categories
  4. For each course:
     a. fetch_course_enrollments(course_id) → Get enrolled users
     b. Save enrollment records

PROGRESS SYNC:
  1. For each student:
     a. fetch_user_courses(username) → Get their courses with progress
     b. For completed courses:
        fetch_course_completion_status(course_id, user_id) → Get completion date

USER COURSES API:
  1. fetch_user_by_username(username) → Find user
  2. fetch_user_courses(username) → Get their courses


================================================================================
WHAT EACH API IS MISSING
================================================================================

❌ core_enrol_get_enrolled_users:
   • Missing: enrolments[].timecreated (when user was assigned)
   • Missing: enrolments[].timestart
   • Only has: firstaccess (when first opened, not when assigned)

❌ core_enrol_get_users_courses:
   • Missing: timecreated (enrollment time)
   • Missing: timestart
   • Only has: progress, completed, lastaccess

✅ core_course_get_courses_by_field:
   • Has: timecreated (but this is when COURSE was created, not enrollment)

✅ core_completion_get_course_completion_status:
   • Has: completions[].timecompleted (when course was completed)


================================================================================
""")

