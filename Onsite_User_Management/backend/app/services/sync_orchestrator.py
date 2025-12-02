import logging
import asyncio
from datetime import datetime
from typing import Dict, Any
from app.db.base import SessionLocal
from app.services.lms.data import LMSDataService
from app.services.erp_service import ERPService
from app.services.erp_sync_service import ERPSyncService
from app.services.student_service import StudentService

logger = logging.getLogger(__name__)

def refresh_lms_cache():
    """Background job to refresh LMS cache."""
    db = SessionLocal()
    try:
        # Run async function in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        loop.run_until_complete(LMSDataService.sync_lms_data(db))
        logger.info("LMS cache refresh completed successfully")
    except Exception as e:
        logger.error(f"Error refreshing LMS cache: {str(e)}")
    finally:
        db.close()

def sync_all_data() -> Dict[str, Any]:
    """
    Background job to sync both LMS and ERP data.
    Returns statistics about the sync operation.
    """
    db = SessionLocal()
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
        # Run async function in sync context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        logger.info("Starting daily sync job...")
        
        # 1. Sync ERP Employees
        try:
            # Check if we have cached employees, if not fetch them
            cached_employees = loop.run_until_complete(ERPSyncService.get_cached_employees(db))
            if not cached_employees:
                logger.info("Fetching employees from ERP...")
                cached_employees = loop.run_until_complete(ERPService.fetch_all_employees())
                loop.run_until_complete(ERPSyncService.cache_employees(db, cached_employees))
            
            stats["erp_employees_synced"] = len(cached_employees)
            
            # Sync to DB
            erp_sync_stats = ERPService.sync_employees_to_db(db, cached_employees)
            stats["students_updated"] += erp_sync_stats["updated"] + erp_sync_stats["created"]
            if erp_sync_stats["errors"]:
                stats["errors"].extend(erp_sync_stats["errors"])
                
            logger.info("ERP employee sync completed")
        except Exception as e:
            error_msg = f"Error syncing ERP employees: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
        
        # 2. Sync LMS Data (Users, Courses, Enrollments)
        try:
            lms_stats = loop.run_until_complete(LMSDataService.sync_lms_data(db))
            stats["lms_users_synced"] = lms_stats.get("users_synced", 0)
            stats["lms_courses_synced"] = lms_stats.get("courses_synced", 0)
            stats["lms_enrollments_synced"] = lms_stats.get("enrollments_synced", 0)
            if lms_stats.get("errors"):
                stats["errors"].extend(lms_stats["errors"])
            logger.info("LMS data sync completed")
        except Exception as e:
            error_msg = f"Error syncing LMS data: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
        
        # 3. Sync Progress
        try:
            progress_stats = loop.run_until_complete(LMSDataService.sync_progress_data(db))
            stats["progress_updated"] = progress_stats.get("courses_updated", 0)
            if progress_stats.get("errors"):
                stats["errors"].extend(progress_stats["errors"])
            logger.info("LMS progress sync completed")
        except Exception as e:
            error_msg = f"Error syncing LMS progress: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
            
        # 4. Cleanup non-BS employees
        try:
            removed = StudentService.cleanup_non_bs_students(db)
            stats["non_bs_removed"] = removed
            logger.info(f"Cleanup completed: removed {removed} non-BS employees")
        except Exception as e:
            error_msg = f"Error cleaning up non-BS employees: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)
            
    finally:
        db.close()
        stats["completed_at"] = datetime.utcnow().isoformat()
        return stats
