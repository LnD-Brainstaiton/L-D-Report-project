from app.db.base import SessionLocal
from sqlalchemy import text

def add_column():
    db = SessionLocal()
    try:
        print("Adding external_id column to mentors table...")
        db.execute(text("ALTER TABLE mentors ADD COLUMN IF NOT EXISTS external_id INTEGER;"))
        db.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_column()
