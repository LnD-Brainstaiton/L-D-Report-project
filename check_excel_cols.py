import pandas as pd
import os

def check_columns():
    files = [
        '/Users/abdullahalamaan/Documents/GitHub/L-D-Report-project/Import_Enrollment.xlsx',
        '/Users/abdullahalamaan/Documents/GitHub/L-D-Report-project/Attendance_Score.xlsx'
    ]
    
    for file_path in files:
        if os.path.exists(file_path):
            try:
                df = pd.read_excel(file_path)
                print(f"\n--- Columns in {os.path.basename(file_path)} ---")
                print(df.columns.tolist())
                print("\n--- First Row Data ---")
                if not df.empty:
                    print(df.iloc[0].to_dict())
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    check_columns()
