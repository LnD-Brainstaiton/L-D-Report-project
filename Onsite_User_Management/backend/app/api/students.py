from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import aiofiles
from datetime import datetime
import pandas as pd
import io
import logging
from app.db.base import get_db
from app.models.student import Student
from app.models.mentor import Mentor
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.mentor import MentorResponse
from app.core.file_utils import sanitize_filename, validate_file_extension, validate_file_size, get_safe_file_path
from app.services.import_service import ImportService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student."""
    existing = db.query(Student).filter(Student.employee_id == student.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this employee ID already exists")
    
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return StudentResponse.from_orm(db_student)

@router.get("/", response_model=List[StudentResponse])
def get_students(
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all students with optional filters."""
    from app.core.validation import validate_department
    
    query = db.query(Student)
    
    # Filter by active status
    query = query.filter(Student.is_active == is_active)
    
    if department:
        try:
            validated_department = validate_department(department)
            query = query.filter(Student.department == validated_department)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Sort by employee_id (ascending)
    students = query.order_by(Student.employee_id.asc()).offset(skip).limit(limit).all()
    return [StudentResponse.from_orm(student) for student in students]

@router.get("/departments")
def get_departments(
    is_active: Optional[bool] = Query(None, description="Filter by active status. If None, returns all departments"),
    db: Session = Depends(get_db)
):
    """Get list of unique departments from the database."""
    from sqlalchemy import distinct
    
    query = db.query(distinct(Student.department))
    
    if is_active is not None:
        query = query.filter(Student.is_active == is_active)
    
    departments = [dept[0] for dept in query.all() if dept[0]]  # Filter out None values
    departments.sort()  # Sort alphabetically
    
    return {"departments": departments}

@router.get("/count")
async def get_student_count(
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    department: Optional[str] = Query(None),
    use_erp: bool = Query(True, description="Use ERP cached data for count (default: True)"),
    db: Session = Depends(get_db)
):
    """
    Get count of employees from LOCAL DATABASE ONLY.
    
    Data is synced via cron job at 12am daily.
    No external API calls are made.
    """
    from app.services.erp_cache_service import ERPCacheService
    from app.core.validation import validate_department
    
    # Always use LOCAL DATABASE - no API fallback
    if use_erp:
        # Count from ERP cached data (local database)
        try:
            cached_employees = await ERPCacheService.get_cached_employees(db)
            if not cached_employees:
                # If cache is empty, return from students table
                logger.info("ERP cache empty, using students table")
                query = db.query(Student)
                if is_active is not None:
                    query = query.filter(Student.is_active == is_active)
                if department:
                    query = query.filter(Student.department == department)
                return {"count": query.count()}
            
            # Filter employees based on exitDate (previous employees have exitDate)
            # Use the exact same logic as test_erp_count.py which works correctly
            filtered_employees = []
            for emp in cached_employees:
                # Handle nested list structure - employees are wrapped in lists
                if isinstance(emp, list) and len(emp) > 0:
                    emp = emp[0]
                
                if not isinstance(emp, dict):
                    continue
                
                # Check if employee has exitDate - if yes, they are inactive
                exit_date = emp.get("exitDate")
                # exitDate is None, empty string, or False means active
                # Any other value (date string) means inactive
                emp_is_active = exit_date is None or exit_date == "" or exit_date is False
                
                # Match the requested is_active filter
                if is_active is None or emp_is_active == is_active:
                    # Filter by department if specified (and not None/empty)
                    if department and department.strip():
                        try:
                            validated_department = validate_department(department)
                            emp_dept = emp.get("department", {})
                            if isinstance(emp_dept, dict):
                                emp_dept_name = emp_dept.get("name", "")
                            else:
                                emp_dept_name = str(emp_dept)
                            
                            if emp_dept_name != validated_department:
                                continue
                        except (ValueError, AttributeError):
                            continue
                    
                    filtered_employees.append(emp)
            
            count = len(filtered_employees)
            return {
                "count": count,
                "is_active": is_active,
                "source": "erp_cache",
                "total_in_erp": len(cached_employees)
            }
        except Exception as e:
            logger.error(f"Error counting from ERP: {str(e)}, falling back to database")
            import traceback
            logger.error(traceback.format_exc())
            # Fall through to database count
    
    # Count from local database
    query = db.query(Student)
    if is_active is not None:
        query = query.filter(Student.is_active == is_active)
    
    if department:
        try:
            validated_department = validate_department(department)
            query = query.filter(Student.department == validated_department)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    count = query.count()
    return {
        "count": count,
        "is_active": is_active,
        "source": "database"
    }

@router.get("/sbu-head/{department}")
def get_sbu_head(department: str, employee_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Get the SBU head for a given department.
    
    Searches for employees with designation containing 'SBU Head' or 'Head of {department}'.
    Returns the first matching active employee.
    
    Returns null if:
    - Department is CXO (they're at the top of hierarchy)
    - The requesting employee is themselves an SBU Head
    """
    from sqlalchemy import or_
    
    if not department:
        return None
    
    # CXO department has no SBU head - they're at the top
    if department.upper() == 'CXO':
        return None
    
    # Check if the requesting employee is an SBU head themselves
    if employee_id:
        requesting_employee = db.query(Student).filter(
            Student.employee_id.ilike(employee_id)
        ).first()
        if requesting_employee and requesting_employee.designation:
            designation_lower = requesting_employee.designation.lower()
            if 'sbu head' in designation_lower or 'head of' in designation_lower or 'ceo' in designation_lower or 'cto' in designation_lower or 'coo' in designation_lower or 'director' in designation_lower:
                return None
    
    # Search for SBU Head or Head of {department} in the same department
    head = db.query(Student).filter(
        Student.is_active == True,
        Student.department == department,
        or_(
            Student.designation.ilike('%sbu head%'),
            Student.designation.ilike(f'%head of {department}%'),
            Student.designation.ilike(f'%head of%'),
            Student.designation.ilike('%director%'),
        )
    ).first()
    
    # If no head found in same department, try to find SBU Head with same department
    if not head:
        head = db.query(Student).filter(
            Student.is_active == True,
            Student.designation.ilike('%sbu head%')
        ).first()
    
    if head:
        return {
            "id": head.id,
            "employee_id": head.employee_id,
            "name": head.name,
            "email": head.email,
            "department": head.department,
            "designation": head.designation
        }
    
    return None


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse.from_orm(student)

@router.get("/{student_id}/enrollments", response_model=dict)
def get_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    """Get all enrollments for a specific student with full course details and overall completion rate.
    
    Includes both onsite enrollments and online (LMS) courses from the local database.
    """
    from app.models.enrollment import Enrollment, ApprovalStatus, CompletionStatus
    from app.models.lms_user import LMSUserCourse
    from app.schemas.enrollment import EnrollmentResponse
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get onsite enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).order_by(Enrollment.created_at.desc()).all()
    
    # Get online (LMS) courses from local database
    lms_courses = db.query(LMSUserCourse).filter(LMSUserCourse.student_id == student_id).order_by(LMSUserCourse.created_at.desc()).all()
    
    # Calculate overall completion rate for onsite courses
    all_student_enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).all()
    
    relevant_enrollments = [
        e for e in all_student_enrollments
        if (
            (e.approval_status == ApprovalStatus.WITHDRAWN)
            or (
                e.approval_status == ApprovalStatus.APPROVED
                and e.completion_status in [CompletionStatus.COMPLETED, CompletionStatus.FAILED]
            )
        )
        and e.approval_status != ApprovalStatus.REJECTED
    ]
    
    onsite_total = len(relevant_enrollments)
    onsite_completed = sum(1 for e in relevant_enrollments if e.completion_status == CompletionStatus.COMPLETED)
    
    # Calculate online completion stats
    online_total = len(lms_courses)
    online_completed = sum(1 for c in lms_courses if c.completed)
    
    # Combined completion rate
    total_courses = onsite_total + online_total
    completed_courses = onsite_completed + online_completed
    
    if total_courses > 0:
        overall_completion_rate = (completed_courses / total_courses) * 100
    else:
        overall_completion_rate = 0.0
    
    # Build onsite enrollments list
    result_enrollments = []
    for enrollment in enrollments:
        enrollment_dict = EnrollmentResponse.from_orm(enrollment).dict()
        enrollment_dict['student_name'] = enrollment.student.name
        enrollment_dict['student_email'] = enrollment.student.email
        enrollment_dict['student_department'] = enrollment.student.department
        enrollment_dict['student_employee_id'] = enrollment.student.employee_id
        enrollment_dict['student_designation'] = enrollment.student.designation
        enrollment_dict['student_experience_years'] = enrollment.student.experience_years
        enrollment_dict['course_name'] = enrollment.course_name or (enrollment.course.name if enrollment.course else None)
        enrollment_dict['batch_code'] = enrollment.batch_code or (enrollment.course.batch_code if enrollment.course else None)
        enrollment_dict['attendance_percentage'] = enrollment.attendance_percentage
        enrollment_dict['total_attendance'] = enrollment.total_attendance
        enrollment_dict['present'] = enrollment.present
        enrollment_dict['attendance_status'] = enrollment.attendance_status
        enrollment_dict['course_start_date'] = enrollment.course.start_date.isoformat() if enrollment.course and enrollment.course.start_date else None
        enrollment_dict['course_end_date'] = enrollment.course.end_date.isoformat() if enrollment.course and enrollment.course.end_date else None
        enrollment_dict['completion_date'] = enrollment.completion_date.isoformat() if enrollment.completion_date else None
        enrollment_dict['course_type'] = 'onsite'
        enrollment_dict['is_lms_course'] = False
        result_enrollments.append(enrollment_dict)
    
    # Build online courses list
    online_enrollments = []
    for lms_course in lms_courses:
        completion_status = "Completed" if lms_course.completed else ("In Progress" if lms_course.progress and lms_course.progress > 0 else "Not Started")
        
        online_dict = {
            'id': f"lms_{lms_course.id}",
            'course_id': lms_course.lms_course_id,
            'course_name': lms_course.course_name,
            'batch_code': lms_course.course_shortname or '',
            'course_type': 'online',
            'approval_status': 'Approved',
            'completion_status': completion_status,
            'progress': lms_course.progress or 0,
            'course_start_date': lms_course.start_date.isoformat() if lms_course.start_date else None,
            'course_end_date': lms_course.end_date.isoformat() if lms_course.end_date else None,
            'lastaccess': lms_course.last_access.isoformat() if lms_course.last_access else None,
            'is_lms_course': True,
            'is_mandatory': lms_course.is_mandatory == 1 if hasattr(lms_course, 'is_mandatory') and lms_course.is_mandatory is not None else False,
            'student_name': student.name,
            'student_email': student.email,
            'student_department': student.department,
            'student_employee_id': student.employee_id,
        }
        online_enrollments.append(online_dict)
    
    return {
        'enrollments': result_enrollments,
        'online_courses': online_enrollments,
        'overall_completion_rate': round(overall_completion_rate, 1),
        'total_courses_assigned': total_courses,
        'completed_courses': completed_courses,
        'onsite_stats': {
            'total': onsite_total,
            'completed': onsite_completed,
            'rate': round((onsite_completed / onsite_total * 100) if onsite_total > 0 else 0, 1)
        },
        'online_stats': {
            'total': online_total,
            'completed': online_completed,
            'rate': round((online_completed / online_total * 100) if online_total > 0 else 0, 1)
        }
    }

@router.get("/all/with-courses", response_model=List[dict])
def get_all_students_with_courses(
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000),
    db: Session = Depends(get_db)
):
    """
    Get all students with their complete course history and attendance data.
    
    Queries directly from the local database (synced from ERP).
    - is_active=True: Active employees (All Employees page)
    - is_active=False: Previous employees (Previous Employees page)
    
    Includes both onsite courses (from enrollments) and online courses (from LMS sync).
    No external API calls are made - uses only locally stored data.
    """
    from app.models.enrollment import Enrollment, CompletionStatus
    from app.models.lms_user import LMSUserCourse
    from app.core.validation import validate_department
    from sqlalchemy.orm import joinedload
    
    result = []
    
    # Query students directly from database
    query = db.query(Student)
    
    # Filter by is_active field
    if is_active is not None:
        query = query.filter(Student.is_active == is_active)
    
    # Filter by department if specified
    if department and department.strip():
        try:
            validated_department = validate_department(department)
            query = query.filter(Student.department == validated_department)
        except (ValueError, AttributeError):
            pass
    
    # Get students with pagination, sorted by employee_id
    students = query.order_by(Student.employee_id.asc()).offset(skip).limit(limit).all()
    
    # Build result for each student
    for student in students:
        # Get onsite enrollments from database
        enrollments = db.query(Enrollment).options(
            joinedload(Enrollment.course)
        ).filter(
            Enrollment.student_id == student.id
        ).order_by(Enrollment.created_at.desc()).all()
        
        # Get online (LMS) courses from database
        lms_courses = db.query(LMSUserCourse).filter(
            LMSUserCourse.student_id == student.id
        ).order_by(LMSUserCourse.created_at.desc()).all()
        
        # Build enrollments list - combine onsite and online
        enrollment_list = []
        
        # Add onsite enrollments
        for enrollment in enrollments:
            course_name = enrollment.course_name or (enrollment.course.name if enrollment.course else None)
            batch_code = enrollment.batch_code or (enrollment.course.batch_code if enrollment.course else None)
            
            enrollment_dict = {
                'id': enrollment.id,
                'course_name': course_name,
                'batch_code': batch_code,
                'course_type': 'onsite',
                'approval_status': enrollment.approval_status.value if enrollment.approval_status else None,
                'completion_status': enrollment.completion_status.value if enrollment.completion_status else None,
                'eligibility_status': enrollment.eligibility_status.value if enrollment.eligibility_status else None,
                'score': enrollment.score,
                'attendance_percentage': enrollment.attendance_percentage,
                'total_attendance': enrollment.total_attendance,
                'present': enrollment.present,
                'attendance_status': enrollment.attendance_status,
                'course_start_date': enrollment.course.start_date.isoformat() if enrollment.course and enrollment.course.start_date else None,
                'course_end_date': enrollment.course.end_date.isoformat() if enrollment.course and enrollment.course.end_date else None,
                'created_at': enrollment.created_at.isoformat() if enrollment.created_at else None,
            }
            enrollment_list.append(enrollment_dict)
        
        # Add online (LMS) courses
        for lms_course in lms_courses:
            completion_status = "COMPLETED" if lms_course.completed else ("IN_PROGRESS" if lms_course.progress and lms_course.progress > 0 else "NOT_STARTED")
            
            enrollment_dict = {
                'id': f"lms_{lms_course.id}",
                'course_name': lms_course.course_name,
                'batch_code': lms_course.course_shortname,
                'course_type': 'online',
                'approval_status': 'APPROVED',  # LMS courses are auto-approved
                'completion_status': completion_status,
                'progress': lms_course.progress,
                'score': None,
                'attendance_percentage': None,
                'total_attendance': None,
                'present': None,
                'attendance_status': None,
                'course_start_date': lms_course.start_date.isoformat() if lms_course.start_date else None,
                'course_end_date': lms_course.end_date.isoformat() if lms_course.end_date else None,
                'created_at': lms_course.created_at.isoformat() if lms_course.created_at else None,
            }
            enrollment_list.append(enrollment_dict)
        
        # Calculate totals
        total_courses = len(enrollment_list)
        completed_onsite = len([e for e in enrollments if e.completion_status == CompletionStatus.COMPLETED])
        completed_online = len([c for c in lms_courses if c.completed])
        completed_courses = completed_onsite + completed_online
        
        # Build student dict
        student_dict = {
            "id": student.id,
            "employee_id": student.employee_id,
            "name": student.name,
            "email": student.email,
            "department": student.department,
            "designation": student.designation,
            "is_active": student.is_active,
            "is_mentor": student.is_mentor,
            "exit_date": student.exit_date.isoformat() if student.exit_date else None,
            "exit_reason": student.exit_reason,
            "career_start_date": student.career_start_date.isoformat() if student.career_start_date else None,
            "bs_joining_date": student.bs_joining_date.isoformat() if student.bs_joining_date else None,
            "total_experience": student.total_experience,
            # SBU Head and Reporting Manager from ERP
            "sbu_head_employee_id": student.sbu_head_employee_id,
            "sbu_head_name": student.sbu_head_name,
            "reporting_manager_employee_id": student.reporting_manager_employee_id,
            "reporting_manager_name": student.reporting_manager_name,
            "enrollments": enrollment_list,
            "total_courses": total_courses,
            "completed_courses": completed_courses,
            "never_taken_course": total_courses == 0,
        }
        
        result.append(student_dict)
    
    return result

@router.post("/import/excel")
async def import_employees_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process Excel file with employee data."""
    # Validate and sanitize filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    validate_file_extension(file.filename)
    safe_filename = sanitize_filename(file.filename)
    
    # Read file content to check size
    content = await file.read()
    validate_file_size(len(content))
    
    # Reset file pointer
    await file.seek(0)
    
    # Save uploaded file temporarily with safe path
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    timestamped_filename = f"{timestamp}_{safe_filename}"
    file_path = get_safe_file_path(timestamped_filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    try:
        # Parse and process
        records = ImportService.parse_employee_excel(file_path)
        results = ImportService.process_employee_imports(db, records)
        
        return {
            "message": "File processed successfully",
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        # Don't expose internal error details
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up local file
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/import/csv")
async def import_employees_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process CSV file with employee data."""
    # Validate and sanitize filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    validate_file_extension(file.filename)
    safe_filename = sanitize_filename(file.filename)
    
    # Read file content to check size
    content = await file.read()
    validate_file_size(len(content))
    
    # Reset file pointer
    await file.seek(0)
    
    # Save uploaded file temporarily with safe path
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    timestamped_filename = f"{timestamp}_{safe_filename}"
    file_path = get_safe_file_path(timestamped_filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    try:
        records = ImportService.parse_employee_csv(file_path)
        results = ImportService.process_employee_imports(db, records)
        
        return {
            "message": "File processed successfully",
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        # Don't expose internal error details
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up local file
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/{student_id}/remove")
def remove_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Remove a student (mark as inactive). Preserves all course history and enrollments."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if not student.is_active:
        raise HTTPException(status_code=400, detail="Student is already removed")
    
    # Mark as inactive instead of deleting
    student.is_active = False
    db.commit()
    db.refresh(student)
    
    return {
        "message": "Student removed successfully",
        "student_id": student.id,
        "employee_id": student.employee_id,
        "name": student.name
    }

@router.post("/{student_id}/restore")
def restore_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Restore a previously removed student (mark as active again)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.is_active:
        raise HTTPException(status_code=400, detail="Student is already active")
    
    # Mark as active again
    student.is_active = True
    db.commit()
    db.refresh(student)
    
    return {
        "message": "Student restored successfully",
        "student_id": student.id,
        "employee_id": student.employee_id,
        "name": student.name
    }

@router.get("/report/overall")
def generate_overall_report(db: Session = Depends(get_db)):
    """Generate an Excel report with all employee enrollment history (active employees only)."""
    try:
        from app.models.enrollment import Enrollment, ApprovalStatus, CompletionStatus, EligibilityStatus
        from app.models.course import Course
        from app.services.eligibility_service import EligibilityService
        
        # Get all active students
        active_students = db.query(Student).filter(Student.is_active == True).all()
        
        # Prepare data for Excel - one row per enrollment
        report_data = []
        
        for student in active_students:
            # Get all enrollments for this student
            enrollments = db.query(Enrollment).filter(
                Enrollment.student_id == student.id
            ).all()
            
            # If student has no enrollments, add one row with "No courses taken yet"
            if not enrollments:
                report_data.append({
                    'bsid': student.employee_id or '',
                    'name': student.name or '',
                    'email': student.email or '',
                    'department': student.department or '',
                    'designation': student.designation or '',
                    'course_name': 'No courses taken yet',
                    'batch_code': 'N/A',
                    'attendance': 'N/A',
                    'score': 'N/A',
                    'completion_status': 'N/A',
                    'approval_date': 'N/A',
                    'completion_date': 'N/A',
                    'withdrawn': 'N/A',
                })
                continue
            
            for enrollment in enrollments:
                # Get course name and batch code (use denormalized values if available)
                course_name = enrollment.course_name or (enrollment.course.name if enrollment.course else '')
                batch_code = enrollment.batch_code or (enrollment.course.batch_code if enrollment.course else '')
                
                # Get attendance as percentage (present/total_attendance * 100)
                attendance = ''
                if enrollment.total_attendance and enrollment.total_attendance > 0 and enrollment.present is not None:
                    attendance_percentage = (enrollment.present / enrollment.total_attendance * 100)
                    attendance = f"{attendance_percentage:.1f}%"
                elif enrollment.attendance_percentage is not None:
                    attendance = f"{enrollment.attendance_percentage:.1f}%"
                elif enrollment.attendance_status:
                    attendance = enrollment.attendance_status
                else:
                    attendance = ''
                
                # Get score as percentage
                score = ''
                if enrollment.score is not None:
                    score = f"{enrollment.score}%"
                else:
                    score = ''
                
                # Get completion status (map to required values: COMPLETED, FAILED, WITHDRAWN, PENDING, INELIGIBLE)
                if enrollment.approval_status == ApprovalStatus.WITHDRAWN:
                    completion_status = 'WITHDRAWN'
                elif enrollment.eligibility_status in [EligibilityStatus.INELIGIBLE_PREREQUISITE, EligibilityStatus.INELIGIBLE_DUPLICATE, EligibilityStatus.INELIGIBLE_ANNUAL_LIMIT]:
                    completion_status = 'INELIGIBLE'
                elif enrollment.approval_status == ApprovalStatus.PENDING:
                    completion_status = 'PENDING'
                elif enrollment.completion_status == CompletionStatus.COMPLETED:
                    completion_status = 'COMPLETED'
                elif enrollment.completion_status == CompletionStatus.FAILED:
                    completion_status = 'FAILED'
                else:
                    completion_status = 'PENDING'  # Default for NOT_STARTED, IN_PROGRESS, etc.
                
                # Get approval date (format as YYYY-MM-DD)
                approval_date = ''
                if enrollment.approved_at:
                    approval_date = enrollment.approved_at.strftime('%Y-%m-%d')
                
                # Get completion date (format as YYYY-MM-DD)
                completion_date = ''
                if enrollment.completion_date:
                    completion_date = enrollment.completion_date.strftime('%Y-%m-%d')
                
                # Check if withdrawn
                withdrawn = enrollment.approval_status == ApprovalStatus.WITHDRAWN
                
                report_data.append({
                    'bsid': student.employee_id or '',
                    'name': student.name or '',
                    'email': student.email or '',
                    'department': student.department or '',
                    'designation': student.designation or '',
                    'course_name': course_name,
                    'batch_code': batch_code,
                    'attendance': attendance,
                    'score': score,
                    'completion_status': completion_status,
                    'approval_date': approval_date,
                    'completion_date': completion_date,
                    'withdrawn': 'TRUE' if withdrawn else 'FALSE',
                })
        
        # Create DataFrame
        df = pd.DataFrame(report_data)
        
        # If no enrollments, create empty DataFrame with columns
        if df.empty:
            df = pd.DataFrame(columns=[
                'bsid', 'name', 'email', 'department', 'designation',
                'course_name', 'batch_code', 'attendance', 'score',
                'completion_status', 'approval_date', 'completion_date',
                'withdrawn'
            ])
        else:
            # Sort by bsid ascending, then approval_date descending
            # Convert approval_date to datetime for proper sorting, handling empty strings
            df['approval_date_sort'] = pd.to_datetime(df['approval_date'], errors='coerce')
            df = df.sort_values(
                by=['bsid', 'approval_date_sort'],
                ascending=[True, False],
                na_position='last'
            )
            # Drop the temporary sort column
            df = df.drop(columns=['approval_date_sort'])
            # Reset index
            df = df.reset_index(drop=True)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Training History', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Training History']
            from openpyxl.utils import get_column_letter
            for idx, col in enumerate(df.columns):
                max_length = max(
                    df[col].astype(str).map(len).max() if not df.empty else 0,
                    len(str(col))
                )
                column_letter = get_column_letter(idx + 1)
                worksheet.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        output.seek(0)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"training_history_report_{timestamp}.xlsx"
        
        # Read the content
        file_content = output.read()
        output.close()
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Error generating overall report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.post("/{student_id}/mentor-tag", response_model=MentorResponse, status_code=201)
def tag_student_as_mentor(student_id: int, db: Session = Depends(get_db)):
    """Tag a student as a mentor (creates internal mentor record if it doesn't exist)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if mentor already exists for this student
    existing_mentor = db.query(Mentor).filter(Mentor.student_id == student_id).first()
    if existing_mentor:
        # Make sure student.is_mentor is set
        if not student.is_mentor:
            student.is_mentor = True
            db.commit()
        return MentorResponse.from_orm(existing_mentor)
    
    # Create mentor record with student data
    db_mentor = Mentor(
        is_internal=True,
        student_id=student_id,
        name=student.name,
        email=student.email,
        department=student.department,
        designation=student.designation
    )
    db.add(db_mentor)
    
    # Update student.is_mentor flag
    student.is_mentor = True
    
    db.commit()
    db.refresh(db_mentor)
    return MentorResponse.from_orm(db_mentor)

@router.delete("/{student_id}/mentor-tag", status_code=204)
def remove_mentor_tag(student_id: int, db: Session = Depends(get_db)):
    """Remove mentor tag from a student (deletes internal mentor record if no course assignments exist)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    mentor = db.query(Mentor).filter(Mentor.student_id == student_id).first()
    if not mentor:
        # Already not a mentor, update flag and return success
        if student.is_mentor:
            student.is_mentor = False
            db.commit()
        return None
    
    if not mentor.is_internal:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove tag from external mentor. Use mentors API to delete external mentors."
        )
    
    # Check if mentor has course assignments
    from app.models.course_mentor import CourseMentor
    assignments = db.query(CourseMentor).filter(CourseMentor.mentor_id == mentor.id).count()
    if assignments > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove mentor tag: mentor has existing course assignments. Remove assignments first."
        )
    
    db.delete(mentor)
    
    # Update student.is_mentor flag
    student.is_mentor = False
    
    db.commit()
    return None

@router.post("/sync-from-erp")
async def sync_employees_from_erp(db: Session = Depends(get_db)):
    """
    Sync employees from ERP GraphQL API to local database.
    
    Fetches all employees from ERP (uses cache if available) and updates/creates student records.
    This is the primary source for employee data. Employee details come from ERP.
    Mapping:
    - employee_id = employeeId from ERP (e.g., "BS1981")
    - name = name from ERP
    - email = workEmail from ERP
    - department = department.name from ERP
    - is_active = active from ERP
    - career_start_date = careerStartDate from ERP
    - bs_joining_date = joiningDate from ERP
    """
    from app.services.erp_service import ERPService
    from app.services.erp_cache_service import ERPCacheService
    from app.core.validation import validate_department
    from datetime import datetime
    
    try:
        # Try to get from cache first
        cached_employees = await ERPCacheService.get_cached_employees(db)
        
        if cached_employees:
            logger.info("Using cached ERP employees data for sync")
            erp_employees = cached_employees
        else:
            # Fetch from API if cache miss or expired
            logger.info("Cache miss or expired, fetching employees from ERP API")
            erp_employees = await ERPService.fetch_all_employees()
            # Cache the results
            await ERPCacheService.cache_employees(db, erp_employees)
        
        stats = {
            "total_fetched": len(erp_employees),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }
        
        for employee in erp_employees:
            try:
                # Handle nested list structure if present
                if isinstance(employee, list) and len(employee) > 0:
                    employee = employee[0]
                
                # Extract data directly from ERP (not from mapped student_data)
                employee_id = employee.get("employeeId")
                name = employee.get("name")
                work_email = employee.get("workEmail")
                
                if not employee_id or not name or not work_email:
                    stats["skipped"] += 1
                    continue
                
                email = work_email
                
                # Extract department from ERP
                dept_obj = employee.get("department", {})
                department_name = dept_obj.get("name", "") if dept_obj else ""
                if not department_name:
                    department_name = "Other"
                
                # Validate department
                try:
                    department = validate_department(department_name)
                except ValueError:
                    department = "Other"
                
                # Extract dates directly from ERP
                joining_date_str = employee.get("joiningDate")  # This is bs_joining_date
                career_start_date_str = employee.get("careerStartDate")
                exit_date_str = employee.get("exitDate")  # Direct from ERP - determines is_active
                date_of_birth_str = employee.get("dateOfBirth")
                resignation_date_str = employee.get("resignationDate")
                
                # Parse dates
                bs_joining_date = None
                career_start_date = None
                exit_date = None
                date_of_birth = None
                resignation_date = None
                
                if joining_date_str:
                    try:
                        bs_joining_date = datetime.strptime(joining_date_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if career_start_date_str:
                    try:
                        career_start_date = datetime.strptime(career_start_date_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if exit_date_str:  # Direct from ERP
                    try:
                        exit_date = datetime.strptime(exit_date_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if date_of_birth_str:
                    try:
                        date_of_birth = datetime.strptime(date_of_birth_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if resignation_date_str:
                    try:
                        resignation_date = datetime.strptime(resignation_date_str, "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                
                # Determine is_active based on exitDate from ERP:
                # - If exitDate exists, employee is inactive (previous employee)
                # - Otherwise, employee is active
                is_active = exit_date is None
                
                # Calculate BS experience from joiningDate (direct from ERP)
                bs_experience = None
                if bs_joining_date:
                    try:
                        from datetime import date
                        today = date.today()
                        delta = today - bs_joining_date
                        bs_experience = round(delta.days / 365.25, 2)  # Years with decimal precision
                    except Exception:
                        pass
                
                # Extract job position/designation
                job_pos_obj = employee.get("jobPosition", {})
                designation = job_pos_obj.get("name", "") if job_pos_obj else ""
                
                # Check if student exists by employee_id or email
                existing_student = db.query(Student).filter(
                    (Student.employee_id == employee_id.upper()) | (Student.email == email)
                ).first()
                
                # Extract all other ERP fields
                erp_id = employee.get("id")
                active = employee.get("active", True)
                is_onsite = employee.get("isOnsite", False)
                total_experience = employee.get("totalExperience")
                
                # Extract nested objects
                job_type_obj = employee.get("jobType", {})
                job_role_obj = employee.get("jobRole", {})
                sbu_obj = employee.get("sbu", {})
                user_obj = employee.get("user", {})
                
                # Extract nested objects
                dept_obj = employee.get("department", {})
                job_pos_obj = employee.get("jobPosition", {})
                job_type_obj = employee.get("jobType", {})
                job_role_obj = employee.get("jobRole", {})
                sbu_obj = employee.get("sbu", {})
                user_obj = employee.get("user", {})
                sbu_head_obj = employee.get("sbuHead", {})
                parent_obj = employee.get("parent", {})
                
                if existing_student:
                    # Update existing student with all ERP data
                    existing_student.name = name
                    existing_student.email = email
                    existing_student.department = department
                    existing_student.is_active = is_active  # Based on exitDate from ERP
                    if designation:
                        existing_student.designation = designation
                    if career_start_date:
                        existing_student.career_start_date = career_start_date
                    if bs_joining_date:
                        existing_student.bs_joining_date = bs_joining_date
                    
                    # Update all ERP fields
                    if erp_id:
                        existing_student.erp_id = str(erp_id)
                    if work_email:
                        existing_student.work_email = work_email
                    existing_student.active = active
                    existing_student.is_onsite = is_onsite
                    if total_experience is not None:
                        existing_student.total_experience = float(total_experience)
                    if date_of_birth:
                        existing_student.date_of_birth = date_of_birth
                    if resignation_date:
                        existing_student.resignation_date = resignation_date
                    if exit_date:
                        existing_student.exit_date = exit_date
                    
                    # Update nested object fields
                    if dept_obj:
                        existing_student.department_id = str(dept_obj.get("id", "")) if dept_obj.get("id") else None
                    if job_pos_obj:
                        existing_student.job_position_id = str(job_pos_obj.get("id", "")) if job_pos_obj.get("id") else None
                        existing_student.job_position_name = job_pos_obj.get("name")
                    if job_type_obj:
                        existing_student.job_type_id = str(job_type_obj.get("id", "")) if job_type_obj.get("id") else None
                        existing_student.job_type_name = job_type_obj.get("name")
                    if job_role_obj:
                        existing_student.job_role_id = str(job_role_obj.get("id", "")) if job_role_obj.get("id") else None
                    if sbu_obj:
                        existing_student.sbu_name = sbu_obj.get("name")
                    if user_obj:
                        existing_student.user_id = str(user_obj.get("id", "")) if user_obj.get("id") else None
                        existing_student.user_name = user_obj.get("name")
                        existing_student.user_email = user_obj.get("email")
                    
                    # Update SBU Head from ERP
                    if sbu_head_obj:
                        existing_student.sbu_head_employee_id = sbu_head_obj.get("employeeId")
                        existing_student.sbu_head_name = sbu_head_obj.get("name")
                    else:
                        existing_student.sbu_head_employee_id = None
                        existing_student.sbu_head_name = None
                    
                    # Update Reporting Manager (parent) from ERP
                    if parent_obj:
                        existing_student.reporting_manager_employee_id = parent_obj.get("employeeId")
                        existing_student.reporting_manager_name = parent_obj.get("name")
                    else:
                        existing_student.reporting_manager_employee_id = None
                        existing_student.reporting_manager_name = None
                    
                    # Store full ERP data as JSON
                    existing_student.erp_data = employee
                    
                    # Update computed fields
                    existing_student.is_active = is_active  # Based on exitDate
                    if bs_experience is not None:
                        existing_student.bs_experience = bs_experience
                    
                    # Update employee_id if it changed (shouldn't happen, but handle it)
                    if existing_student.employee_id != employee_id:
                        # Check if new employee_id already exists
                        conflict = db.query(Student).filter(
                            Student.employee_id == employee_id,
                            Student.id != existing_student.id
                        ).first()
                        if not conflict:
                            existing_student.employee_id = employee_id
                    
                    stats["updated"] += 1
                else:
                    # Create new student with all ERP data
                    new_student = Student(
                        employee_id=employee_id,
                        name=name,
                        email=email,
                        department=department,
                        designation=designation,
                        career_start_date=career_start_date,
                        bs_joining_date=bs_joining_date,
                        # ERP fields
                        erp_id=str(erp_id) if erp_id else None,
                        work_email=work_email,
                        active=active,
                        is_onsite=is_onsite,
                        total_experience=float(total_experience) if total_experience is not None else None,
                        date_of_birth=date_of_birth,
                        resignation_date=resignation_date,
                        exit_date=exit_date,
                        department_id=str(dept_obj.get("id", "")) if dept_obj and dept_obj.get("id") else None,
                        job_position_id=str(job_pos_obj.get("id", "")) if job_pos_obj and job_pos_obj.get("id") else None,
                        job_position_name=job_pos_obj.get("name") if job_pos_obj else None,
                        job_type_id=str(job_type_obj.get("id", "")) if job_type_obj and job_type_obj.get("id") else None,
                        job_type_name=job_type_obj.get("name") if job_type_obj else None,
                        job_role_id=str(job_role_obj.get("id", "")) if job_role_obj and job_role_obj.get("id") else None,
                        sbu_name=sbu_obj.get("name") if sbu_obj else None,
                        user_id=str(user_obj.get("id", "")) if user_obj and user_obj.get("id") else None,
                        user_name=user_obj.get("name") if user_obj else None,
                        user_email=user_obj.get("email") if user_obj else None,
                        # SBU Head and Reporting Manager from ERP
                        sbu_head_employee_id=sbu_head_obj.get("employeeId") if sbu_head_obj else None,
                        sbu_head_name=sbu_head_obj.get("name") if sbu_head_obj else None,
                        reporting_manager_employee_id=parent_obj.get("employeeId") if parent_obj else None,
                        reporting_manager_name=parent_obj.get("name") if parent_obj else None,
                        erp_data=employee,  # Store full ERP data
                        # Computed fields
                        is_active=is_active,  # Based on exitDate: if exitDate exists, is_active = False
                        bs_experience=bs_experience,  # Calculated from joiningDate
                        has_online_course=False,  # Will be updated by LMS matching
                    )
                    db.add(new_student)
                    stats["created"] += 1
                
            except Exception as e:
                # Handle nested list structure for error message
                emp_id = "unknown"
                if isinstance(employee, dict):
                    emp_id = employee.get('employeeId', employee.get('id', 'unknown'))
                elif isinstance(employee, list) and len(employee) > 0 and isinstance(employee[0], dict):
                    emp_id = employee[0].get('employeeId', employee[0].get('id', 'unknown'))
                error_msg = f"Error processing employee {emp_id}: {str(e)}"
                stats["errors"].append(error_msg)
                logger.error(error_msg)
                continue
        
        # Commit all changes
        db.commit()
        
        # Update has_online_course by matching with LMS
        try:
            logger.info("Updating has_online_course field by matching with LMS...")
            from app.services.lms_cache_service import LMSCacheService
            from app.services.lms_service import LMSService
            
            # Get all LMS users
            cached_lms_users = await LMSCacheService.get_cached_users(db)
            if not cached_lms_users:
                cached_lms_users = await LMSService.fetch_all_users()
                await LMSCacheService.cache_users(db, cached_lms_users)
            
            # Create map of LMS username (employeeId) -> LMS user
            lms_user_map = {}
            for lms_user in cached_lms_users:
                username = lms_user.get("username", "").upper()
                if username:
                    lms_user_map[username] = lms_user
            
            # Update has_online_course for all students
            all_students = db.query(Student).all()
            updated_count = 0
            for student in all_students:
                employee_id = student.employee_id.upper()
                has_online = False
                
                # Check if employee exists in LMS
                if employee_id in lms_user_map:
                    try:
                        # Check if they have courses in LMS cache
                        cached_courses = await LMSCacheService.get_cached_user_courses(db, employee_id)
                        if cached_courses and len(cached_courses) > 0:
                            has_online = True
                        else:
                            # Try fetching from API
                            courses = await LMSService.fetch_user_courses(employee_id, db)
                            if courses and len(courses) > 0:
                                has_online = True
                                # Cache the courses
                                await LMSCacheService.cache_user_courses(db, employee_id, courses)
                    except Exception as e:
                        logger.warning(f"Error checking LMS courses for {employee_id}: {str(e)}")
                
                # Update has_online_course if changed
                if student.has_online_course != has_online:
                    student.has_online_course = has_online
                    updated_count += 1
            
            db.commit()
            logger.info(f"Updated has_online_course for {updated_count} students")
        except Exception as e:
            logger.error(f"Error updating has_online_course: {str(e)}")
            # Don't fail the whole sync if LMS matching fails
        
        return {
            "message": "Sync from ERP completed",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing from ERP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing from ERP: {str(e)}")

@router.post("/sync-from-lms")
async def sync_employees_from_lms(db: Session = Depends(get_db)):
    """
    Sync employees from LMS API to local database.
    
    NOTE: This endpoint is kept for backward compatibility and course matching.
    Employee data should primarily come from ERP via /sync-from-erp.
    LMS is used to match employees and track course enrollments.
    """
    from app.services.lms_service import LMSService
    from app.services.lms_cache_service import LMSCacheService
    from app.services.erp_service import ERPService
    from app.services.erp_cache_service import ERPCacheService
    from app.core.validation import validate_department
    
    try:
        # Fetch ERP employees to match against
        cached_erp_employees = await ERPCacheService.get_cached_employees(db)
        if not cached_erp_employees:
            logger.info("ERP cache miss, fetching employees from ERP API")
            cached_erp_employees = await ERPService.fetch_all_employees()
            await ERPCacheService.cache_employees(db, cached_erp_employees)
        
        # Create a map of employeeId -> ERP employee for matching
        erp_employee_map = {}
        for emp in cached_erp_employees:
            emp_id = emp.get("employeeId")
            if emp_id:
                erp_employee_map[emp_id.upper()] = emp
        
        # Try to get LMS users from cache first
        cached_users = await LMSCacheService.get_cached_users(db)
        
        if cached_users:
            logger.info("Using cached LMS users data for sync")
            lms_users = cached_users
        else:
            # Fetch from API if cache miss or expired
            logger.info("Cache miss or expired, fetching users from LMS API")
            lms_users = await LMSService.fetch_all_users()
            # Cache the results
            await LMSCacheService.cache_users(db, lms_users)
        
        stats = {
            "total_fetched": len(lms_users),
            "matched_with_erp": 0,
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
                
                # Try to match with ERP employee by employeeId
                erp_employee = erp_employee_map.get(employee_id.upper())
                
                # If matched with ERP, use ERP data; otherwise use LMS data
                if erp_employee:
                    # Use ERP data as source of truth
                    erp_student_data = ERPService.map_erp_employee_to_student(erp_employee)
                    if erp_student_data:
                        student_data = erp_student_data
                        stats["matched_with_erp"] += 1
                
                # Validate department
                try:
                    department = validate_department(student_data.get("department", "Other"))
                except ValueError:
                    department = "Other"  # Default if validation fails
                
                # Parse dates if provided
                career_start_date = None
                bs_joining_date = None
                exit_date = None
                if student_data.get("career_start_date"):
                    try:
                        career_start_date = datetime.strptime(student_data["career_start_date"], "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if student_data.get("bs_joining_date"):
                    try:
                        bs_joining_date = datetime.strptime(student_data["bs_joining_date"], "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                if student_data.get("exit_date"):
                    try:
                        exit_date = datetime.strptime(student_data["exit_date"], "%Y-%m-%d").date()
                    except (ValueError, TypeError):
                        pass
                
                # Determine if employee is active:
                # - If exitDate is present, they are a previous employee (is_active = False)
                # - Otherwise use the active field from ERP or LMS
                is_active = student_data.get("is_active", True)
                if exit_date is not None:
                    is_active = False  # Has exit date means they left
                
                # Check if student exists by employee_id or email
                existing_student = db.query(Student).filter(
                    (Student.employee_id == employee_id) | (Student.email == email)
                ).first()
                
                if existing_student:
                    # Update existing student
                    existing_student.name = student_data["name"]
                    existing_student.email = email
                    existing_student.department = department
                    existing_student.is_active = is_active  # Use calculated is_active
                    if student_data.get("designation"):
                        existing_student.designation = student_data["designation"]
                    if career_start_date:
                        existing_student.career_start_date = career_start_date
                    if bs_joining_date:
                        existing_student.bs_joining_date = bs_joining_date
                    
                    stats["updated"] += 1
                else:
                    # Create new student
                    new_student = Student(
                        employee_id=employee_id,
                        name=student_data["name"],
                        email=email,
                        department=department,
                        is_active=is_active,  # Use calculated is_active
                        designation=student_data.get("designation"),
                        career_start_date=career_start_date,
                        bs_joining_date=bs_joining_date,
                    )
                    db.add(new_student)
                    stats["created"] += 1
                
            except Exception as e:
                error_msg = f"Error processing user {user.get('username', user.get('id', 'unknown'))}: {str(e)}"
                stats["errors"].append(error_msg)
                logger.error(error_msg)
                continue
        
        # Commit all changes
        db.commit()
        
        return {
            "message": "Sync from LMS completed (matched with ERP where available)",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing from LMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing from LMS: {str(e)}")


@router.post("/sync-lms-enrollments")
async def sync_lms_course_enrollments(db: Session = Depends(get_db)):
    """
    Sync LMS course enrollments to update users' online course history.
    
    This endpoint:
    1. Fetches all courses from LMS
    2. For each course, fetches enrolled users
    3. Updates students' online course history based on enrollments
    4. Only processes users with 'BS' in their username (employee_id)
    """
    from app.services.lms_service import LMSService
    from app.models.lms_user import LMSUserCourse
    
    stats = {
        "courses_fetched": 0,
        "enrollments_processed": 0,
        "students_updated": 0,
        "skipped_non_bs": 0,
        "errors": []
    }
    
    try:
        # Fetch all courses from LMS
        logger.info("Fetching all courses from LMS...")
        courses = await LMSService.fetch_lms_courses()
        stats["courses_fetched"] = len(courses)
        logger.info(f"Found {len(courses)} courses in LMS")
        
        # Get all students from database with BS in employee_id for quick lookup
        bs_students = db.query(Student).filter(
            Student.employee_id.ilike('BS%')
        ).all()
        student_map = {s.employee_id.upper(): s for s in bs_students}
        logger.info(f"Found {len(student_map)} BS students in database")
        
        # Track which students have been updated with courses
        students_with_courses = set()
        
        # Process each course
        for course in courses:
            course_id = course.get("id")
            course_name = course.get("fullname") or course.get("displayname") or course.get("shortname", "Unknown")
            course_shortname = course.get("shortname", "")
            
            if not course_id:
                continue
            
            try:
                # Fetch enrolled users for this course
                enrolled_users = await LMSService.fetch_course_enrollments(course_id)
                
                for user in enrolled_users:
                    username = user.get("username", "").upper()
                    
                    # Only process BS users
                    if not username.startswith("BS"):
                        stats["skipped_non_bs"] += 1
                        continue
                    
                    stats["enrollments_processed"] += 1
                    
                    # Check if this user exists in our database
                    student = student_map.get(username)
                    if student:
                        students_with_courses.add(student.id)
                        
                        # Check if this course enrollment already exists
                        existing_enrollment = db.query(LMSUserCourse).filter(
                            LMSUserCourse.student_id == student.id,
                            LMSUserCourse.lms_course_id == str(course_id)
                        ).first()
                        
                        if not existing_enrollment:
                            # Create new LMS course enrollment record
                            lms_enrollment = LMSUserCourse(
                                student_id=student.id,
                                employee_id=username,
                                lms_course_id=str(course_id),
                                course_name=course_name,
                                course_shortname=course_shortname,
                                lms_user_id=str(user.get("id", "")),
                                progress=0,  # Will be updated separately if needed
                                completed=False
                            )
                            db.add(lms_enrollment)
                        
            except Exception as e:
                error_msg = f"Error processing course {course_id} ({course_name}): {str(e)}"
                stats["errors"].append(error_msg)
                logger.warning(error_msg)
                continue
        
        # Update has_online_course flag for students
        for student_id in students_with_courses:
            student = db.query(Student).filter(Student.id == student_id).first()
            if student and not student.has_online_course:
                student.has_online_course = True
                stats["students_updated"] += 1
        
        db.commit()
        
        return {
            "message": "LMS course enrollments synced successfully",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing LMS enrollments: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error syncing LMS enrollments: {str(e)}")


@router.delete("/cleanup-non-bs")
async def cleanup_non_bs_employees(db: Session = Depends(get_db)):
    """
    Remove all employees that don't have 'BS' in their employee_id.
    
    This removes staff accounts, numeric IDs, and other non-employee records
    from both active and previous employees.
    """
    stats = {
        "total_before": 0,
        "deleted": 0,
        "remaining": 0,
        "deleted_ids": []
    }
    
    try:
        # Count total students before cleanup
        stats["total_before"] = db.query(Student).count()
        
        # Find all students WITHOUT 'BS' in their employee_id (case-insensitive)
        non_bs_students = db.query(Student).filter(
            ~Student.employee_id.ilike('%BS%')
        ).all()
        
        # Delete non-BS students
        for student in non_bs_students:
            stats["deleted_ids"].append({
                "id": student.id,
                "employee_id": student.employee_id,
                "name": student.name
            })
            db.delete(student)
            stats["deleted"] += 1
        
        db.commit()
        
        # Count remaining students
        stats["remaining"] = db.query(Student).count()
        
        # Limit deleted_ids in response to first 50
        if len(stats["deleted_ids"]) > 50:
            stats["deleted_ids"] = stats["deleted_ids"][:50]
            stats["deleted_ids_truncated"] = True
        
        return {
            "message": f"Cleanup completed. Removed {stats['deleted']} non-BS employees.",
            "stats": stats
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up non-BS employees: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error cleaning up non-BS employees: {str(e)}")


@router.post("/cron/daily-sync")
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
    curl -X POST "http://localhost:8000/api/v1/students/cron/daily-sync?secret_key=YOUR_SECRET"
    """
    from app.core.config import settings
    from app.services.erp_service import ERPService
    from app.services.erp_cache_service import ERPCacheService
    from app.services.lms_service import LMSService
    from app.services.lms_cache_service import LMSCacheService
    from app.models.lms_user import LMSUserCourse
    from app.models.lms_cache import LMSCourseCache
    
    # Verify secret key (simple security for cron job)
    expected_key = getattr(settings, 'CRON_SECRET_KEY', 'bs23-cron-2025')
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
        
        # 4. Sync LMS Enrollments
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
                        
                        if existing:
                            existing.course_name = course.fullname
                            existing.course_shortname = course.shortname
                            existing.category_name = course.categoryname
                            existing.start_date = datetime.fromtimestamp(course.startdate) if course.startdate else None
                            existing.end_date = datetime.fromtimestamp(course.enddate) if course.enddate else None
                        else:
                            new_enrollment = LMSUserCourse(
                                student_id=student.id,
                                employee_id=username,
                                lms_course_id=str(course.id),
                                course_name=course.fullname,
                                course_shortname=course.shortname,
                                category_name=course.categoryname,
                                start_date=datetime.fromtimestamp(course.startdate) if course.startdate else None,
                                end_date=datetime.fromtimestamp(course.enddate) if course.enddate else None,
                            )
                            db.add(new_enrollment)
                        
                        stats["lms_enrollments_synced"] += 1
                except Exception as e:
                    stats["errors"].append(f"Course {course.id} enrollment error: {str(e)}")
            
            # Update has_online_course flag
            for student_id in students_with_courses:
                student = db.query(Student).filter(Student.id == student_id).first()
                if student and not student.has_online_course:
                    student.has_online_course = True
                    stats["students_updated"] += 1
            
            db.commit()
            logger.info(f"CRON: LMS enrollments sync complete - {stats['lms_enrollments_synced']} enrollments")
        except Exception as e:
            stats["errors"].append(f"LMS enrollments sync error: {str(e)}")
            logger.error(f"CRON: LMS enrollments sync error: {str(e)}")
        
        # 5. Cleanup non-BS employees
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

