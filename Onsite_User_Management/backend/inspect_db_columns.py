import sys
import os
from sqlalchemy import inspect

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.db.base import engine
from app.models.student import Student

def inspect_columns():
    inspector = inspect(engine)
    columns = inspector.get_columns('students')
    column_names = [col['name'] for col in columns]
    column_names.sort()
    
    print("Columns in 'students' table:")
    for name in column_names:
        print(name)

if __name__ == "__main__":
    inspect_columns()
