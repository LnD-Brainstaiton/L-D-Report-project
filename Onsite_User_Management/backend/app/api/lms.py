"""LMS API endpoints for fetching data from Moodle."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from app.db.base import get_db
from app.core.auth import get_current_admin
from app.services.lms_service import LMSService
from app.services.lms_cache_service import LMSCacheService
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/courses")
async def get_lms_courses(
    include_enrollment_counts: bool = Query(False, description="Include enrollment count for each course"),
    db: Session = Depends(get_db),
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Fetch all online courses from LMS API (uses cache if available).
    
    Returns courses with:
    - id: Course ID
    - fullname: Course full name
    - startdate: Start date (Unix timestamp)
    - enddate: End date (Unix timestamp)
    - categoryid: Category ID
    - categoryname: Category name (fetched separately)
    """
    try:
        # Try to get from cache first
        cached_courses = await LMSCacheService.get_cached_courses(db)
        cached_categories = await LMSCacheService.get_cached_categories(db)
        
        if cached_courses and cached_categories:
            logger.info("Using cached courses data")
            lms_courses = cached_courses
            category_map = cached_categories
        else:
            # Fetch from API if cache miss or expired
            logger.info("Cache miss or expired, fetching from LMS API")
            lms_courses_raw = await LMSService.fetch_lms_courses()
            category_map = await LMSService.fetch_course_categories()
            
            # Cache the results
            await LMSCacheService.cache_courses(db, lms_courses_raw, category_map)
            
            # Convert to dict format
            lms_courses = []
            for course in lms_courses_raw:
                lms_courses.append({
                    "id": course.get("id"),
                    "fullname": course.get("fullname", ""),
                    "shortname": course.get("shortname", ""),
                    "summary": course.get("summary", ""),
                    "startdate": course.get("startdate"),
                    "enddate": course.get("enddate"),
                    "categoryid": course.get("categoryid"),
                    "categoryname": category_map.get(course.get("categoryid"), "Unknown"),
                    "visible": course.get("visible", 1),
                })
        
        # Map courses and add categoryname (ensure it's set)
        result = []
        for course in lms_courses:
            course_data = {
                "id": course.get("id"),
                "fullname": course.get("fullname", ""),
                "startdate": course.get("startdate"),
                "enddate": course.get("enddate"),
                "categoryid": course.get("categoryid"),
                "categoryname": course.get("categoryname") or category_map.get(course.get("categoryid"), "Unknown"),
                "shortname": course.get("shortname", ""),
                "summary": course.get("summary", ""),
                "visible": course.get("visible", 1),
            }
            
            # Optionally fetch enrollment count (this will also use cache)
            if include_enrollment_counts:
                try:
                    cached_enrollments = await LMSCacheService.get_cached_course_enrollments(db, course.get("id"))
                    if cached_enrollments:
                        course_data["enrollment_count"] = len(cached_enrollments)
                    else:
                        # Fetch from API if not cached
                        enrolled_users_raw = await LMSService.fetch_course_enrollments(course.get("id"))
                        course_data["enrollment_count"] = len(enrolled_users_raw)
                        # Cache it for next time
                        await LMSCacheService.cache_course_enrollments(db, course.get("id"), enrolled_users_raw)
                except Exception as e:
                    # If enrollment fetch fails, set count to 0
                    course_data["enrollment_count"] = 0
                    logger.warning(f"Failed to fetch enrollment count for course {course.get('id')}: {str(e)}")
            
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses from LMS: {str(e)}")

@router.get("/courses/{course_id}/enrollments")
async def get_lms_course_enrollments(course_id: int, db: Session = Depends(get_db)):
    """
    Fetch all enrolled users for a specific online course from LMS API (uses cache if available).
    
    Returns list of enrolled users with their details:
    - id: User ID
    - username: Username (employee_id)
    - fullname: Full name
    - email: Email address
    - department: Department
    - lastaccess: Last access timestamp
    - firstaccess: First access timestamp
    """
    try:
        # Try to get from cache first
        cached_enrollments = await LMSCacheService.get_cached_course_enrollments(db, course_id)
        
        if cached_enrollments:
            logger.info(f"Using cached enrollments for course {course_id}")
            enrolled_users = cached_enrollments
        else:
            # Fetch from API if cache miss or expired
            logger.info(f"Cache miss or expired for course {course_id}, fetching from LMS API")
            enrolled_users_raw = await LMSService.fetch_course_enrollments(course_id)
            
            # Map to cleaner format
            enrolled_users = []
            for user in enrolled_users_raw:
                user_data = {
                    "id": user.get("id"),
                    "username": user.get("username", ""),
                    "employee_id": user.get("username", ""),
                    "fullname": user.get("fullname", ""),
                    "firstname": user.get("firstname", ""),
                    "lastname": user.get("lastname", ""),
                    "email": user.get("email", ""),
                    "department": user.get("department", ""),
                    "lastaccess": user.get("lastaccess"),
                    "firstaccess": user.get("firstaccess"),
                    "lastcourseaccess": user.get("lastcourseaccess"),
                    "profileimageurl": user.get("profileimageurl"),
                    "profileimageurlsmall": user.get("profileimageurlsmall"),
                }
                enrolled_users.append(user_data)
            
            # Cache the results
            await LMSCacheService.cache_course_enrollments(db, course_id, enrolled_users)
        
        # Map to a cleaner format (if not already done)
        result = []
        for user in enrolled_users:
            user_data = {
                "id": user.get("id"),
                "username": user.get("username", ""),
                "employee_id": user.get("username", ""),  # username is the employee_id
                "fullname": user.get("fullname", ""),
                "firstname": user.get("firstname", ""),
                "lastname": user.get("lastname", ""),
                "email": user.get("email", ""),
                "department": user.get("department", ""),
                "lastaccess": user.get("lastaccess"),
                "firstaccess": user.get("firstaccess"),
                "lastcourseaccess": user.get("lastcourseaccess"),
                "profileimageurl": user.get("profileimageurl"),
                "profileimageurlsmall": user.get("profileimageurlsmall"),
            }
            result.append(user_data)
        
        return {"enrollments": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch enrollments from LMS: {str(e)}")

@router.get("/users/{username}/courses")
async def get_lms_user_courses(username: str, db: Session = Depends(get_db)):
    """
    Fetch all courses for a specific user from LMS API by username (employee_id) (uses cache if available).
    
    Returns list of courses the user is enrolled in:
    - id: Course ID
    - fullname: Course full name
    - shortname: Course shortname
    - startdate: Start date (Unix timestamp)
    - enddate: End date (Unix timestamp)
    - progress: Progress percentage
    - completed: Completion status
    - lastaccess: Last access timestamp
    """
    try:
        # Try to get from cache first
        cached_courses = await LMSCacheService.get_cached_user_courses(db, username)
        
        if cached_courses:
            logger.info(f"Using cached courses for user {username}")
            courses = cached_courses
        else:
            # Fetch from API if cache miss or expired
            logger.info(f"Cache miss or expired for user {username}, fetching from LMS API")
            courses_raw = await LMSService.fetch_user_courses(username, db)
            
            # Map to cleaner format
            courses = []
            for course in courses_raw:
                course_data = {
                    "id": course.get("id"),
                    "fullname": course.get("fullname", ""),
                    "shortname": course.get("shortname", ""),
                    "startdate": course.get("startdate"),
                    "enddate": course.get("enddate"),
                    "progress": course.get("progress", 0),
                    "completed": course.get("completed", 0),
                    "lastaccess": course.get("lastaccess"),
                    "category": course.get("category"),
                }
                courses.append(course_data)
            
            # Cache the results
            await LMSCacheService.cache_user_courses(db, username, courses)
        
        # Map to a cleaner format (if not already done)
        result = []
        for course in courses:
            course_data = {
                "id": course.get("id"),
                "fullname": course.get("fullname", ""),
                "shortname": course.get("shortname", ""),
                "startdate": course.get("startdate"),
                "enddate": course.get("enddate"),
                "progress": course.get("progress", 0),
                "completed": course.get("completed", 0),
                "lastaccess": course.get("lastaccess"),
                "category": course.get("category"),
            }
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user courses from LMS: {str(e)}")

