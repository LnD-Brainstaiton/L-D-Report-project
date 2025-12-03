"""Script to trigger full LMS enrollment sync"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.db.base import SessionLocal
from app.services.lms.data import LMSDataService

async def run_enrollment_sync():
    db = SessionLocal()
    try:
        print("Starting LMS enrollment sync...")
        print("This will update enrollment records with correct enrollment times.")
        result = await LMSDataService.sync_lms_data(db)
        print(f"\nSync complete!")
        print(f"Stats: {result}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_enrollment_sync())
