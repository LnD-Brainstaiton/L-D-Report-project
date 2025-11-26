from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import traceback
from app.core.config import settings
from app.api import api_router
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown."""
    # Startup
    global scheduler
    
    # Create scheduler (always create it, even if no jobs are added)
    scheduler = BackgroundScheduler()
    
    # Schedule reminder check if email is enabled
    if settings.SMTP_ENABLED and settings.ADMIN_EMAIL:
        try:
            from app.services.reminder_service import ReminderService
            
            # Schedule reminder check to run every minute
            scheduler.add_job(
                ReminderService.check_and_send_reminders,
                trigger=IntervalTrigger(minutes=1),
                id='class_reminder_check',
                name='Check and send class reminders',
                replace_existing=True
            )
            logger.info("Scheduled class reminder check - will run every minute")
        except Exception as e:
            logger.error(f"Failed to schedule reminder check: {str(e)}")
    else:
        logger.info("Class reminder check not scheduled - email service not enabled or ADMIN_EMAIL not configured")
    
    # Schedule LMS and ERP cache refresh to run daily at 12 AM Bangladesh time
    try:
        from app.services.lms_cache_service import LMSCacheService
        from app.db.base import SessionLocal
        
        def refresh_lms_cache():
            """Background job to refresh LMS cache."""
            db = SessionLocal()
            try:
                import asyncio
                # Run async function in sync context
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                loop.run_until_complete(LMSCacheService.refresh_all_caches(db))
                logger.info("LMS cache refresh completed successfully")
            except Exception as e:
                logger.error(f"Error refreshing LMS cache: {str(e)}")
            finally:
                db.close()
        
        def sync_all_data():
            """Background job to sync both LMS and ERP data."""
            db = SessionLocal()
            try:
                import asyncio
                from app.services.erp_service import ERPService
                from app.services.erp_cache_service import ERPCacheService
                from app.core.validation import validate_department
                from app.models.student import Student
                from datetime import datetime
                
                # Run async function in sync context
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                # Refresh LMS cache
                try:
                    loop.run_until_complete(LMSCacheService.refresh_all_caches(db))
                    logger.info("LMS cache refresh completed successfully")
                except Exception as e:
                    logger.error(f"Error refreshing LMS cache: {str(e)}")
                
                # Refresh ERP cache
                try:
                    loop.run_until_complete(ERPCacheService.refresh_cache(db))
                    logger.info("ERP cache refresh completed successfully")
                except Exception as e:
                    logger.error(f"Error refreshing ERP cache: {str(e)}")
                
                # Sync employees from ERP to database (using the sync endpoint logic)
                try:
                    # Get cached ERP employees
                    cached_employees = loop.run_until_complete(ERPCacheService.get_cached_employees(db))
                    if not cached_employees:
                        logger.warning("No cached ERP employees found, fetching from API")
                        cached_employees = loop.run_until_complete(ERPService.fetch_all_employees())
                        loop.run_until_complete(ERPCacheService.cache_employees(db, cached_employees))
                    
                    stats = {"created": 0, "updated": 0, "skipped": 0, "errors": []}
                    
                    # Use the same logic as sync_employees_from_erp endpoint
                    for employee in cached_employees:
                        try:
                            # Handle nested list structure if present
                            if isinstance(employee, list) and len(employee) > 0:
                                employee = employee[0]
                            
                            # Map ERP employee to student format
                            student_data = ERPService.map_erp_employee_to_student(employee)
                            
                            if not student_data:
                                stats["skipped"] += 1
                                continue
                            
                            employee_id = student_data["employee_id"]
                            email = student_data["email"]
                            
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
                            # - Otherwise use the active field from ERP
                            is_active = student_data.get("is_active", True)
                            if exit_date is not None:
                                is_active = False  # Has exit date means they left
                            
                            # Calculate BS experience from joiningDate (bs_joining_date)
                            bs_experience = None
                            if bs_joining_date:
                                try:
                                    from datetime import date
                                    today = date.today()
                                    delta = today - bs_joining_date
                                    bs_experience = round(delta.days / 365.25, 2)  # Years with decimal precision
                                except Exception:
                                    pass
                            
                            # Extract all ERP fields (same as sync endpoint)
                            erp_id = employee.get("id")
                            work_email = employee.get("workEmail")
                            active = employee.get("active", True)
                            is_onsite = employee.get("isOnsite", False)
                            total_experience = employee.get("totalExperience")
                            date_of_birth_str = employee.get("dateOfBirth")
                            resignation_date_str = employee.get("resignationDate")
                            
                            # Parse additional dates
                            date_of_birth = None
                            resignation_date = None
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
                            
                            # Extract nested objects
                            dept_obj = employee.get("department", {})
                            job_pos_obj = employee.get("jobPosition", {})
                            job_type_obj = employee.get("jobType", {})
                            job_role_obj = employee.get("jobRole", {})
                            sbu_obj = employee.get("sbu", {})
                            user_obj = employee.get("user", {})
                            
                            # Check if student exists by employee_id or email
                            existing_student = db.query(Student).filter(
                                (Student.employee_id == employee_id) | (Student.email == email)
                            ).first()
                            
                            if existing_student:
                                # Update existing student with all ERP data
                                existing_student.name = student_data["name"]
                                existing_student.email = email
                                existing_student.department = department
                                existing_student.is_active = is_active
                                if student_data.get("designation"):
                                    existing_student.designation = student_data["designation"]
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
                                
                                stats["updated"] += 1
                            else:
                                # Create new student with all ERP data
                                new_student = Student(
                                    employee_id=employee_id,
                                    name=student_data["name"],
                                    email=email,
                                    department=department,
                                    designation=student_data.get("designation"),
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
                    logger.info(f"Employee sync from ERP to database completed: {stats}")
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error syncing employees from ERP: {str(e)}")
                    import traceback
                    logger.error(traceback.format_exc())
                    
            finally:
                db.close()
        
        # Schedule combined sync job to run daily at 12 AM Bangladesh time (18:00 UTC previous day)
        scheduler.add_job(
            sync_all_data,
            trigger=CronTrigger(hour=18, minute=0),  # Run daily at 12 AM Bangladesh time (UTC+6 = 18:00 UTC previous day)
            id='sync_all_data',
            name='Sync all data from LMS and ERP daily at 12 AM Bangladesh time',
            replace_existing=True
        )
        logger.info("Scheduled combined LMS and ERP sync - will run daily at 12 AM Bangladesh time (18:00 UTC)")
    except Exception as e:
        logger.error(f"Failed to schedule data sync: {str(e)}")
    
    # Start scheduler if any jobs were added
    if scheduler.get_jobs():
        scheduler.start()
        logger.info("Scheduler started")
    else:
        logger.info("Scheduler not started - no jobs scheduled")
    
    yield
    
    # Shutdown
    if scheduler and scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")

app = FastAPI(
    title="Physical Course Enrollment Management System",
    description="Automated enrollment management with eligibility checks and instructor approvals",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - restrict to specific origins and methods
# Ensure CORS_ORIGINS is a list
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["http://localhost:3000", "http://localhost:5173"]

# Add CORS middleware - must be added before other middleware
# For development, allow all methods and headers to avoid CORS issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all exceptions and ensure CORS headers are present."""
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in cors_origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
        }
    
    # Log the error for debugging
    logger.error(f"Unhandled error: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc) if settings.DEBUG else "An error occurred"},
        headers=headers
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions and ensure CORS headers."""
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in cors_origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
        }
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Physical Course Enrollment Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

