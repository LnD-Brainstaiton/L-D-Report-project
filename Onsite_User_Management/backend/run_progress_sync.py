"""Quick script to trigger progress sync for a specific user"""  
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from app.db.base import SessionLocal
from app.services.lms.data import LMSDataService

async def sync_for_user():
    db = SessionLocal()
    try:
        print("Starting progress sync...")
        result = await LMSDataService.sync_progress_data(db)
        print(f"\nSync complete!")
        print(f"Stats: {result}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(sync_for_user())
