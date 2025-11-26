"""LMS API endpoints - ALL DATA FROM LOCAL DATABASE ONLY.

IMPORTANT: These endpoints ONLY read from local database cache.
They NEVER make external API calls. Data is synced via cron job at 12am daily.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from app.db.base import get_db
from app.core.auth import get_current_admin
from app.models.lms_cache import (
    LMSCourseCache,
    LMSCategoryCache,
    LMSCourseEnrollmentCache,
    LMSUserCourseCache,
    LMSUserCache
)
from app.models.lms_user import LMSUserCourse
from app.models.student import Student
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
    Get all online courses from LOCAL DATABASE ONLY.
    
    Data is synced from LMS via cron job at 12am daily.
    No external API calls are made.
    """
    try:
        # Get courses from local database cache ONLY
        cached_courses = db.query(LMSCourseCache).all()
        
        if not cached_courses:
            logger.info("No courses in local database. Run sync job to populate.")
            return {"courses": [], "message": "No courses in database. Data syncs daily at 12am."}
        
        # Build result
        result = []
        for course in cached_courses:
            course_data = {
                "id": course.id,
                "fullname": course.fullname or "",
                "startdate": course.startdate,
                "enddate": course.enddate,
                "categoryid": course.categoryid,
                "categoryname": course.categoryname or "Unknown",
                "shortname": course.shortname or "",
                "summary": course.summary or "",
                "visible": course.visible or 1,
                "is_mandatory": course.is_mandatory == 1 if course.is_mandatory is not None else False,
            }
            
            # Get enrollment count from local database if requested
            if include_enrollment_counts:
                # Get from LMSUserCourse table (our local enrollments)
                enrollment_count = db.query(LMSUserCourse).filter(
                    LMSUserCourse.lms_course_id == str(course.id)
                ).count()
                course_data["enrollment_count"] = enrollment_count
            
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        logger.error(f"Error fetching courses from local database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching courses: {str(e)}")


@router.get("/courses/{course_id}/enrollments")
async def get_lms_course_enrollments(course_id: int, db: Session = Depends(get_db)):
    """
    Get all enrolled users for a course from LOCAL DATABASE ONLY.
    
    Data is synced from LMS via cron job at 12am daily.
    No external API calls are made.
    """
    try:
        # Get enrollments from local database - using LMSUserCourse table
        enrollments = db.query(LMSUserCourse).filter(
            LMSUserCourse.lms_course_id == str(course_id)
        ).all()
        
        # Build result with student info
        result = []
        for enrollment in enrollments:
            # Get student info
            student = db.query(Student).filter(Student.id == enrollment.student_id).first()
            
            user_data = {
                "id": enrollment.id,
                "username": enrollment.employee_id,
                "employee_id": enrollment.employee_id,
                "fullname": student.name if student else "",
                "email": student.email if student else "",
                "department": student.department if student else "",
                "progress": enrollment.progress or 0,
                "completed": enrollment.completed,
                "lastaccess": enrollment.last_access.isoformat() if enrollment.last_access else None,
            }
            result.append(user_data)
        
        return {"enrollments": result}
        
    except Exception as e:
        logger.error(f"Error fetching enrollments from local database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching enrollments: {str(e)}")


@router.get("/users/{username}/courses")
async def get_lms_user_courses(username: str, db: Session = Depends(get_db)):
    """
    Get all courses for a user from LOCAL DATABASE ONLY.
    
    Data is synced from LMS via cron job at 12am daily.
    No external API calls are made.
    """
    try:
        # Get student by employee_id
        student = db.query(Student).filter(Student.employee_id == username).first()
        
        if not student:
            return {"courses": [], "message": f"User {username} not found in database"}
        
        # Get courses from local database - using LMSUserCourse table
        enrollments = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id
        ).all()
        
        # Build result
        result = []
        for enrollment in enrollments:
            course_data = {
                "id": enrollment.lms_course_id,
                "fullname": enrollment.course_name or "",
                "shortname": enrollment.course_shortname or "",
                "startdate": int(enrollment.start_date.timestamp()) if enrollment.start_date else None,
                "enddate": int(enrollment.end_date.timestamp()) if enrollment.end_date else None,
                "progress": enrollment.progress or 0,
                "completed": 1 if enrollment.completed else 0,
                "lastaccess": int(enrollment.last_access.timestamp()) if enrollment.last_access else None,
                "category": enrollment.category_name,
            }
            result.append(course_data)
        
        return {"courses": result}
        
    except Exception as e:
        logger.error(f"Error fetching user courses from local database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching user courses: {str(e)}")


@router.get("/test-connections")
async def test_api_connections(
    db: Session = Depends(get_db),
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Test connections to both LMS and ERP APIs.
    This is ONLY for testing - actual data sync happens via cron job.
    """
    from app.services.erp_service import ERPService
    from app.services.lms_service import LMSService
    from app.core.config import settings
    
    results = {
        "lms": {},
        "erp": {}
    }
    
    # Test LMS connection
    try:
        if not settings.LMS_TOKEN or not settings.LMS_BASE_URL:
            results["lms"] = {
                "connected": False,
                "configured": False,
                "error": "LMS_TOKEN or LMS_BASE_URL is not configured"
            }
        else:
            try:
                users = await LMSService.fetch_all_users()
                results["lms"] = {
                    "connected": True,
                    "configured": True,
                    "url": settings.LMS_BASE_URL,
                    "users_count": len(users),
                    "message": "Successfully connected to LMS API"
                }
            except Exception as e:
                results["lms"] = {
                    "connected": False,
                    "configured": True,
                    "url": settings.LMS_BASE_URL,
                    "error": str(e)
                }
    except Exception as e:
        results["lms"] = {
            "connected": False,
            "configured": False,
            "error": str(e)
        }
    
    # Test ERP connection
    try:
        erp_result = await ERPService.test_connection()
        results["erp"] = erp_result
    except Exception as e:
        results["erp"] = {
            "connected": False,
            "configured": False,
            "error": str(e)
        }
    
    return results


@router.post("/sync")
async def sync_lms_data(
    db: Session = Depends(get_db),
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Manually trigger LMS data sync.
    
    This is the ONLY place where external LMS API calls are made.
    Normally this runs via cron job at 12am daily.
    """
    from app.services.lms_service import LMSService
    from app.services.lms_cache_service import LMSCacheService
    
    stats = {
        "courses_synced": 0,
        "categories_synced": 0,
        "users_synced": 0,
        "enrollments_synced": 0,
        "errors": []
    }
    
    try:
        # 1. Sync all users
        logger.info("Syncing LMS users...")
        try:
            users = await LMSService.fetch_all_users()
            await LMSCacheService.cache_users(db, users)
            stats["users_synced"] = len(users)
        except Exception as e:
            stats["errors"].append(f"Users sync error: {str(e)}")
        
        # 2. Sync courses and categories
        logger.info("Syncing LMS courses and categories...")
        try:
            courses = await LMSService.fetch_lms_courses()
            category_map = await LMSService.fetch_course_categories()
            await LMSCacheService.cache_courses(db, courses, category_map)
            stats["courses_synced"] = len(courses)
            stats["categories_synced"] = len(category_map)
        except Exception as e:
            stats["errors"].append(f"Courses sync error: {str(e)}")
        
        # 3. Sync enrollments for each course
        logger.info("Syncing LMS enrollments...")
        cached_courses = db.query(LMSCourseCache).all()
        for course in cached_courses:
            try:
                enrolled_users = await LMSService.fetch_course_enrollments(course.id)
                
                # Save enrollments to LMSUserCourse table
                for user in enrolled_users:
                    username = user.get("username", "")
                    if not username or not username.upper().startswith("BS"):
                        continue
                    
                    # Find student
                    student = db.query(Student).filter(Student.employee_id == username).first()
                    if not student:
                        continue
                    
                    # Check if enrollment exists
                    existing = db.query(LMSUserCourse).filter(
                        LMSUserCourse.student_id == student.id,
                        LMSUserCourse.lms_course_id == str(course.id)
                    ).first()
                    
                    # Get is_mandatory from cached course
                    is_mandatory = course.is_mandatory == 1 if course.is_mandatory is not None else False
                    
                    if existing:
                        # Update
                        existing.course_name = course.fullname
                        existing.course_shortname = course.shortname
                        existing.category_name = course.categoryname
                        existing.is_mandatory = is_mandatory
                        existing.start_date = datetime.fromtimestamp(course.startdate) if course.startdate else None
                        existing.end_date = datetime.fromtimestamp(course.enddate) if course.enddate else None
                    else:
                        # Create
                        new_enrollment = LMSUserCourse(
                            student_id=student.id,
                            employee_id=username,
                            lms_course_id=str(course.id),
                            course_name=course.fullname,
                            course_shortname=course.shortname,
                            category_name=course.categoryname,
                            is_mandatory=is_mandatory,
                            start_date=datetime.fromtimestamp(course.startdate) if course.startdate else None,
                            end_date=datetime.fromtimestamp(course.enddate) if course.enddate else None,
                        )
                        db.add(new_enrollment)
                    
                    # Update student has_online_course flag
                    if not student.has_online_course:
                        student.has_online_course = True
                    
                    stats["enrollments_synced"] += 1
                
                db.commit()
            except Exception as e:
                stats["errors"].append(f"Enrollment sync error for course {course.id}: {str(e)}")
                db.rollback()
        
        return {
            "message": "LMS sync completed",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"LMS sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LMS sync failed: {str(e)}")
