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
    Get count of employees from ERP (source of truth).
    
    By default uses ERP cached data which includes all employees.
    Employees with exitDate are considered inactive (previous employees).
    """
    from app.services.erp_cache_service import ERPCacheService
    from app.services.erp_service import ERPService
    from app.core.validation import validate_department
    
    # Always use ERP as source of truth
    if use_erp:
        # Count from ERP cached data
        try:
            cached_employees = await ERPCacheService.get_cached_employees(db)
            if not cached_employees:
                # If cache is empty, fetch from API
                cached_employees = await ERPService.fetch_all_employees()
                await ERPCacheService.cache_employees(db, cached_employees)
            
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

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse.from_orm(student)

@router.get("/{student_id}/enrollments", response_model=dict)
def get_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    """Get all enrollments for a specific student with full course details and overall completion rate."""
    from app.models.enrollment import Enrollment, ApprovalStatus, CompletionStatus
    from app.schemas.enrollment import EnrollmentResponse
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).order_by(Enrollment.created_at.desc()).all()
    
    # Calculate overall completion rate (same logic as in enrollments API)
    all_student_enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).all()
    
    # Filter enrollments to only include those that count toward completion rate:
    # - COMPLETED or FAILED courses (completion_status) that are APPROVED
    # - WITHDRAWN courses (approval_status) - these should be included as they have a reason
    # Exclude: PENDING approvals, NOT_STARTED, IN_PROGRESS, REJECTED
    relevant_enrollments = [
        e for e in all_student_enrollments
        if (
            # Include withdrawn courses (they have a reason attached, count as not completed)
            (e.approval_status == ApprovalStatus.WITHDRAWN)
            # OR include completed/failed courses that are approved (not pending/rejected)
            or (
                e.approval_status == ApprovalStatus.APPROVED
                and e.completion_status in [CompletionStatus.COMPLETED, CompletionStatus.FAILED]
            )
        )
        # Exclude rejected enrollments (admin's decision, not student's fault)
        and e.approval_status != ApprovalStatus.REJECTED
    ]
    
    total_courses = len(relevant_enrollments)
    # Only COMPLETED courses count as completed (withdrawn and failed count as not completed)
    completed_courses = sum(1 for e in relevant_enrollments if e.completion_status == CompletionStatus.COMPLETED)
    
    if total_courses > 0:
        overall_completion_rate = (completed_courses / total_courses) * 100
    else:
        overall_completion_rate = 0.0
    
    result_enrollments = []
    for enrollment in enrollments:
        enrollment_dict = EnrollmentResponse.from_orm(enrollment).dict()
        enrollment_dict['student_name'] = enrollment.student.name
        enrollment_dict['student_email'] = enrollment.student.email
        enrollment_dict['student_department'] = enrollment.student.department
        enrollment_dict['student_employee_id'] = enrollment.student.employee_id
        enrollment_dict['student_designation'] = enrollment.student.designation
        enrollment_dict['student_experience_years'] = enrollment.student.experience_years
        # Use stored course info (preserved even if course is deleted)
        enrollment_dict['course_name'] = enrollment.course_name or (enrollment.course.name if enrollment.course else None)
        enrollment_dict['batch_code'] = enrollment.batch_code or (enrollment.course.batch_code if enrollment.course else None)
        enrollment_dict['attendance_percentage'] = enrollment.attendance_percentage
        enrollment_dict['total_attendance'] = enrollment.total_attendance
        enrollment_dict['present'] = enrollment.present
        enrollment_dict['attendance_status'] = enrollment.attendance_status
        enrollment_dict['course_start_date'] = enrollment.course.start_date.isoformat() if enrollment.course and enrollment.course.start_date else None
        enrollment_dict['course_end_date'] = enrollment.course.end_date.isoformat() if enrollment.course and enrollment.course.end_date else None
        enrollment_dict['completion_date'] = enrollment.completion_date.isoformat() if enrollment.completion_date else None
        result_enrollments.append(enrollment_dict)
    
    return {
        'enrollments': result_enrollments,
        'overall_completion_rate': round(overall_completion_rate, 1),
        'total_courses_assigned': total_courses,
        'completed_courses': completed_courses
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
    
    No external API calls are made - uses only locally stored data.
    """
    from app.models.enrollment import Enrollment, CompletionStatus
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
        # Get enrollments from database
        enrollments = db.query(Enrollment).options(
            joinedload(Enrollment.course)
        ).filter(
            Enrollment.student_id == student.id
        ).order_by(Enrollment.created_at.desc()).all()
        
        # Build enrollments list
        enrollment_list = []
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
        
        # Calculate totals
        total_courses = len(enrollment_list)
        completed_courses = len([e for e in enrollments if e.completion_status == CompletionStatus.COMPLETED])
        
        # Build student dict
        student_dict = {
            "id": student.id,
            "employee_id": student.employee_id,
            "name": student.name,
            "email": student.email,
            "department": student.department,
            "designation": student.designation,
            "is_active": student.is_active,
            "career_start_date": student.career_start_date.isoformat() if student.career_start_date else None,
            "bs_joining_date": student.bs_joining_date.isoformat() if student.bs_joining_date else None,
            "total_experience": student.total_experience,
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
        # Already not a mentor, return success
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

