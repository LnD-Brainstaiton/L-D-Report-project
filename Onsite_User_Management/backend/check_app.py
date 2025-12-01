import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from app.main import app
    print("Backend app imported successfully.")
except Exception as e:
    print(f"Failed to import app: {e}")
    import traceback
    traceback.print_exc()
