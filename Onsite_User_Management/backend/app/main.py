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
    
    # Schedule LMS cache refresh to run daily at 2 AM
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
        
        scheduler.add_job(
            refresh_lms_cache,
            trigger=CronTrigger(hour=18, minute=0),  # Run daily at 12 AM Bangladesh time (UTC+6 = 18:00 UTC previous day)
            id='lms_cache_refresh',
            name='Refresh LMS cache daily at 12 AM Bangladesh time',
            replace_existing=True
        )
        logger.info("Scheduled LMS cache refresh - will run daily at 12 AM Bangladesh time (18:00 UTC)")
    except Exception as e:
        logger.error(f"Failed to schedule LMS cache refresh: {str(e)}")
    
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

