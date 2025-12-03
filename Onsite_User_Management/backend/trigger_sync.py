import asyncio
import logging
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.services.lms.data import LMSDataService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def trigger_sync():
    db: Session = SessionLocal()
    try:
        logger.info("Starting manual progress sync...")
        stats = await LMSDataService.sync_progress_data(db)
        logger.info(f"Sync completed. Stats: {stats}")
    except Exception as e:
        logger.error(f"Sync failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(trigger_sync())
