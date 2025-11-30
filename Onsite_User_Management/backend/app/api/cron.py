"""Cron job endpoints - NO AUTHENTICATION (protected by secret key).

These endpoints are called by scheduled cron jobs only.
They are the ONLY places where external API calls are made.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from datetime import datetime
from app.db.base import get_db
from app.core.config import settings
from app.models.student import Student
from app.models.lms_user import LMSUserCourse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/sync-progress")
async def sync_progress_only(
    secret_key: str = Query(..., description="Secret key to authorize cron job"),
    db: Session = Depends(get_db)
):
    """
    Sync ONLY progress data from LMS for all enrolled students.
    
    This uses core_enrol_get_users_courses which returns progress and completed status.
    Faster than full sync - only updates progress fields.
    """
    from app.services.lms_service import LMSService
    
    # Verify secret key
    expected_key = settings.CRON_SECRET_KEY
    if secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    stats = {
        "students_processed": 0,
        "courses_updated": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
    }
    
    try:
        # Get all student IDs who have LMS enrollments (avoid DISTINCT on JSON columns)
        student_ids_with_enrollments = db.query(LMSUserCourse.student_id).distinct().all()
        student_ids = [sid[0] for sid in student_ids_with_enrollments]
        
        # Get those students
        students_with_enrollments = db.query(Student).filter(Student.id.in_(student_ids)).all()
        
        logger.info(f"PROGRESS SYNC: Processing {len(students_with_enrollments)} students with enrollments")
        
        for student in students_with_enrollments:
            try:
                # Fetch user's courses with progress using core_enrol_get_users_courses
                user_courses = await LMSService.fetch_user_courses(student.employee_id, None)  # Don't pass db to avoid cache issues
                stats["students_processed"] += 1
                
                for course_data in user_courses:
                    course_id = str(course_data.get("id", ""))
                    progress = course_data.get("progress", 0) or 0
                    completed = course_data.get("completed", 0) == 1
                    last_access = course_data.get("lastaccess")
                    
                    # Update the LMSUserCourse record with progress
                    enrollment = db.query(LMSUserCourse).filter(
                        LMSUserCourse.student_id == student.id,
                        LMSUserCourse.lms_course_id == course_id
                    ).first()
                    
                    if enrollment:
                        old_progress = enrollment.progress or 0
                        enrollment.progress = progress
                        enrollment.completed = completed or (progress >= 100)
                        if last_access:
                            try:
                                enrollment.last_access = datetime.fromtimestamp(last_access)
                            except:
                                pass
                        if (completed or progress >= 100) and not enrollment.completion_date:
                            enrollment.completion_date = datetime.utcnow()
                        
                        if old_progress != progress:
                            stats["courses_updated"] += 1
                
                # Commit after each student to avoid transaction buildup
                db.commit()
                
            except Exception as e:
                db.rollback()  # Rollback on error to clear transaction
                error_msg = f"Error syncing progress for {student.employee_id}: {str(e)}"
                if len(stats["errors"]) < 10:  # Limit errors to avoid huge response
                    stats["errors"].append(error_msg)
                logger.warning(error_msg)
        stats["completed_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"PROGRESS SYNC complete: {stats['students_processed']} students, {stats['courses_updated']} courses updated")
        
        return {
            "message": "Progress sync completed",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"PROGRESS SYNC error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Progress sync failed: {str(e)}")


@router.post("/daily-sync")
async def daily_sync_cron_job(
    secret_key: str = Query(..., description="Secret key to authorize cron job"),
    db: Session = Depends(get_db)
):
    """
    CRON JOB ENDPOINT - Daily sync at 12am.
    
    This is the ONLY endpoint that makes external API calls.
    All other endpoints read from local database ONLY.
    
    This endpoint:
    1. Syncs all employees from ERP
    2. Syncs all courses from LMS
    3. Syncs all LMS enrollments
    4. Updates has_online_course flags
    5. Cleans up non-BS employees
    
    Call this from cron job at 12am daily:
    curl -X POST "http://localhost:8000/api/v1/cron/daily-sync?secret_key=YOUR_SECRET"
    """
    from app.services.erp_service import ERPService
    from app.services.erp_cache_service import ERPCacheService
    from app.services.lms_service import LMSService
    from app.services.lms_cache_service import LMSCacheService
    from app.models.lms_user import LMSUserCourse
    from app.models.lms_cache import LMSCourseCache
    
    # Verify secret key
    expected_key = settings.CRON_SECRET_KEY
    if secret_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    stats = {
        "erp_employees_synced": 0,
        "lms_users_synced": 0,
        "lms_courses_synced": 0,
        "lms_enrollments_synced": 0,
        "students_updated": 0,
        "non_bs_removed": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
    }
    
    try:
        # 1. Sync ERP Employees
        logger.info("CRON: Starting ERP employee sync...")
        try:
            erp_employees = await ERPService.fetch_all_employees()
            await ERPCacheService.cache_employees(db, erp_employees)
            stats["erp_employees_synced"] = len(erp_employees)
            
            # Update students table from ERP
            for emp in erp_employees:
                if isinstance(emp, list) and len(emp) > 0:
                    emp = emp[0]
                if not isinstance(emp, dict):
                    continue
                
                employee_id = emp.get("employeeCode", "")
                if not employee_id or not employee_id.upper().startswith("BS"):
                    continue
                
                student_data = ERPService.map_erp_employee_to_student(emp)
                existing_student = db.query(Student).filter(
                    Student.employee_id == employee_id
                ).first()
                
                if existing_student:
                    # Update existing
                    for key, value in student_data.items():
                        if hasattr(existing_student, key) and value is not None:
                            setattr(existing_student, key, value)
                else:
                    # Create new
                    new_student = Student(**student_data)
                    db.add(new_student)
            
            db.commit()
            logger.info(f"CRON: ERP sync complete - {stats['erp_employees_synced']} employees")
        except Exception as e:
            stats["errors"].append(f"ERP sync error: {str(e)}")
            logger.error(f"CRON: ERP sync error: {str(e)}")
        
        # 2. Sync LMS Users
        logger.info("CRON: Starting LMS users sync...")
        try:
            lms_users = await LMSService.fetch_all_users()
            await LMSCacheService.cache_users(db, lms_users)
            stats["lms_users_synced"] = len(lms_users)
            logger.info(f"CRON: LMS users sync complete - {stats['lms_users_synced']} users")
        except Exception as e:
            stats["errors"].append(f"LMS users sync error: {str(e)}")
            logger.error(f"CRON: LMS users sync error: {str(e)}")
        
        # 3. Sync LMS Courses
        logger.info("CRON: Starting LMS courses sync...")
        try:
            lms_courses = await LMSService.fetch_lms_courses()
            category_map = await LMSService.fetch_course_categories()
            await LMSCacheService.cache_courses(db, lms_courses, category_map)
            stats["lms_courses_synced"] = len(lms_courses)
            logger.info(f"CRON: LMS courses sync complete - {stats['lms_courses_synced']} courses")
        except Exception as e:
            stats["errors"].append(f"LMS courses sync error: {str(e)}")
            logger.error(f"CRON: LMS courses sync error: {str(e)}")
        
        # 4. Sync LMS Enrollments (from course enrollments)
        logger.info("CRON: Starting LMS enrollments sync...")
        try:
            cached_courses = db.query(LMSCourseCache).all()
            students_with_courses = set()
            
            for course in cached_courses:
                try:
                    enrolled_users = await LMSService.fetch_course_enrollments(course.id)
                    
                    for user in enrolled_users:
                        username = user.get("username", "")
                        if not username or not username.upper().startswith("BS"):
                            continue
                        
                        student = db.query(Student).filter(Student.employee_id == username).first()
                        if not student:
                            continue
                        
                        students_with_courses.add(student.id)
                        
                        # Check if enrollment exists
                        existing = db.query(LMSUserCourse).filter(
                            LMSUserCourse.student_id == student.id,
                            LMSUserCourse.lms_course_id == str(course.id)
                        ).first()
                        
                        # Get is_mandatory from cached course (store as integer: 1 or 0)
                        is_mandatory = 1 if course.is_mandatory == 1 else 0
                        
                        # Use course's timecreated as enrollment_time (when course was created = when it was assigned)
                        enrollment_timestamp = None
                        if course.timecreated:
                            enrollment_timestamp = datetime.fromtimestamp(course.timecreated)
                        # Fallback: try to get from user API response if available
                        elif 'timecreated' in user:
                            enrollment_timestamp = datetime.fromtimestamp(user['timecreated']) if user.get('timecreated') else None
                        elif 'timestart' in user:
                            enrollment_timestamp = datetime.fromtimestamp(user['timestart']) if user.get('timestart') else None
                        elif 'enrolments' in user and isinstance(user['enrolments'], list) and len(user['enrolments']) > 0:
                            first_enrol = user['enrolments'][0]
                            if 'timecreated' in first_enrol:
                                enrollment_timestamp = datetime.fromtimestamp(first_enrol['timecreated']) if first_enrol.get('timecreated') else None
                            elif 'timestart' in first_enrol:
                                enrollment_timestamp = datetime.fromtimestamp(first_enrol['timestart']) if first_enrol.get('timestart') else None
                        
                        if existing:
                            existing.course_name = course.fullname
                            existing.course_shortname = course.shortname
                            existing.category_name = course.categoryname
                            existing.is_mandatory = is_mandatory
                            existing.start_date = datetime.fromtimestamp(course.startdate) if course.startdate else None
                            existing.end_date = datetime.fromtimestamp(course.enddate) if course.enddate else None
                            # Update enrollment_time if we got it from API and it's not already set
                            if enrollment_timestamp and not existing.enrollment_time:
                                existing.enrollment_time = enrollment_timestamp
                        else:
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
                                enrollment_time=enrollment_timestamp,  # Store enrollment timestamp from LMS if available
                            )
                            db.add(new_enrollment)
                        
                        stats["lms_enrollments_synced"] += 1
                except Exception as e:
                    stats["errors"].append(f"Course {course.id} enrollment error: {str(e)}")
            
            db.commit()
            logger.info(f"CRON: LMS enrollments sync complete - {stats['lms_enrollments_synced']} enrollments")
        except Exception as e:
            stats["errors"].append(f"LMS enrollments sync error: {str(e)}")
            logger.error(f"CRON: LMS enrollments sync error: {str(e)}")
        
        # 5. Sync Progress data using core_enrol_get_users_courses (has progress field)
        logger.info("CRON: Starting progress sync for enrolled students...")
        stats["progress_updated"] = 0
        try:
            # Get all students who have LMS enrollments
            enrolled_students = db.query(Student).filter(
                Student.employee_id.in_(
                    db.query(LMSUserCourse.employee_id).distinct()
                )
            ).all()
            
            for student in enrolled_students:
                try:
                    # Fetch user's courses with progress using core_enrol_get_users_courses
                    user_courses = await LMSService.fetch_user_courses(student.employee_id, db)
                    
                    for course_data in user_courses:
                        course_id = str(course_data.get("id", ""))
                        progress = course_data.get("progress", 0) or 0
                        completed = course_data.get("completed", 0) == 1
                        last_access = course_data.get("lastaccess")
                        
                        # Update the LMSUserCourse record with progress
                        enrollment = db.query(LMSUserCourse).filter(
                            LMSUserCourse.student_id == student.id,
                            LMSUserCourse.lms_course_id == course_id
                        ).first()
                        
                        if enrollment:
                            enrollment.progress = progress
                            enrollment.completed = completed or (progress >= 100)
                            if last_access:
                                enrollment.last_access = datetime.fromtimestamp(last_access)
                            if completed or progress >= 100:
                                enrollment.completion_date = datetime.utcnow()
                            stats["progress_updated"] += 1
                    
                    # Update has_online_course flag
                    if not student.has_online_course and len(user_courses) > 0:
                        student.has_online_course = True
                        stats["students_updated"] += 1
                        
                except Exception as e:
                    # Don't fail entire sync for one user's progress
                    logger.warning(f"Progress sync error for {student.employee_id}: {str(e)}")
            
            db.commit()
            logger.info(f"CRON: Progress sync complete - {stats['progress_updated']} records updated")
        except Exception as e:
            stats["errors"].append(f"Progress sync error: {str(e)}")
            logger.error(f"CRON: Progress sync error: {str(e)}")
        
        # 6. Cleanup non-BS employees
        logger.info("CRON: Cleaning up non-BS employees...")
        try:
            non_bs_students = db.query(Student).filter(
                ~Student.employee_id.ilike('%BS%')
            ).all()
            
            for student in non_bs_students:
                db.delete(student)
                stats["non_bs_removed"] += 1
            
            db.commit()
            logger.info(f"CRON: Cleanup complete - removed {stats['non_bs_removed']} non-BS employees")
        except Exception as e:
            stats["errors"].append(f"Cleanup error: {str(e)}")
            logger.error(f"CRON: Cleanup error: {str(e)}")
        
        stats["completed_at"] = datetime.utcnow().isoformat()
        
        return {
            "message": "Daily sync completed",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"CRON: Fatal error in daily sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Daily sync failed: {str(e)}")

