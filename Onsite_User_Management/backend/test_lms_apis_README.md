# LMS API Testing Script

This script tests all available LMS API endpoints and displays their responses in a readable format.

## Usage

### Basic Usage

```bash
cd Onsite_User_Management/backend
python test_lms_apis.py
```

### Configuration

The script uses environment variables and settings from `app.core.config`:

- **BASE_URL**: API base URL (default: `http://localhost:8000`)
  - Set via environment variable: `export API_BASE_URL=http://localhost:8000`
- **ADMIN_EMAIL**: Admin email from settings
- **ADMIN_PASSWORD**: Admin password from settings

### What It Tests

The script tests the following LMS API endpoints:

1. **GET /api/v1/lms/courses** - Get all courses (without enrollment counts)
2. **GET /api/v1/lms/courses?include_enrollment_counts=true** - Get all courses with enrollment counts
3. **GET /api/v1/lms/courses/{course_id}/enrollments** - Get enrollments for a specific course
4. **GET /api/v1/lms/users/{username}/courses** - Get courses for a specific user
5. **GET /api/v1/lms/test-connections** - Test LMS and ERP API connections
6. **GET /api/v1/lms/courses/{course_id}/check-mandatory** - Check if a course is mandatory
7. **PUT /api/v1/lms/courses/{course_id}/mandatory** - Update mandatory status (commented out by default)
8. **GET /api/v1/lms/courses/{course_id}/report** - Generate Excel report for a course
9. **GET /api/v1/lms/report/overall** - Generate overall LMS report
10. **GET /api/v1/lms/courses/{course_id}/report/summary** - Generate summary report for a course

### Customization

To test with different course IDs or usernames, modify the script:

```python
# Change the course ID
test_get_course_enrollments(token, course_id=YOUR_COURSE_ID)

# Change the username
test_get_user_courses(token, username="BS1234")

# Enable update mandatory test (currently commented out)
test_update_mandatory(token, course_id=YOUR_COURSE_ID, is_mandatory=True)
```

### Output

The script provides:
- Color-coded output for easy reading
- JSON responses formatted nicely
- Success/error indicators
- File downloads for report endpoints (saved to current directory)

### Example Output

```
================================================================================
                        LMS API Testing Script
================================================================================

▶ Authentication
--------------------------------------------------------------------------------
POST http://localhost:8000/api/v1/auth/login
✓ Authentication successful

▶ GET /lms/courses (include_enrollment_counts=False)
--------------------------------------------------------------------------------
GET /lms/courses
Status Code: 200
✓ Retrieved 150 courses
...
```

### Notes

- The script requires the backend server to be running
- Authentication is required for all LMS endpoints
- Report files are saved to the current directory
- The update mandatory endpoint is commented out by default to avoid changing data

