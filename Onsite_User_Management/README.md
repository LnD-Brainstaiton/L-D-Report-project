# Onsite User Management System

Comprehensive learning and development management system for managing both onsite and online course enrollments with automated eligibility checks, approvals, completion tracking, and LMS (Moodle) integration.

## Features

- **Unified Course Management**: Manage both onsite and online courses in one place
- **LMS Integration**: Automatic synchronization with Moodle LMS for employee data and online courses
- **Automated Enrollment Intake**: Manual Excel/CSV upload with automatic eligibility checks
- **Eligibility Engine**: Three-tier validation (Prerequisites, Duplicates, Annual Limit)
- **Integrated Approval Workflow**: View and approve enrollments directly within course view
- **Enrollment Sections**: Organized by status (Approved/Enrolled, Eligible Pending, Not Eligible, Withdrawn)
- **Attendance & Completion Tracking**: Excel/CSV upload for attendance and scores with automatic completion status (80% threshold)
- **Online Course Tracking**: Real-time progress tracking for LMS courses with completion status
- **User Management**: Complete employee profiles with course history (onsite, online, external) and overall completion rates
- **Smart Caching**: Automatic daily cache refresh for LMS data to ensure fast access
- **Dashboard Analytics**: Comprehensive dashboard with filters for course types (onsite, online, external) and time periods
- **Admin Authentication**: Secure login with email/password authentication

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React with Material UI
- **Database**: PostgreSQL
- **Authentication**: JWT-based admin authentication
- **File Processing**: pandas, openpyxl
- **LMS Integration**: Moodle Web Services API
- **Caching**: PostgreSQL-based cache with APScheduler for daily refresh
- **Task Scheduling**: APScheduler for automated cache refresh

## Project Structure

```
Onsite_User_Management/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core config, security
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── db/             # Database setup
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   └── utils/          # Utilities
│   └── package.json
└── README.md
```

## Docker Setup (Recommended)

**The easiest way to run the entire application is using Docker:**

1. Create `.env` file from `.env.example`
2. Run: `docker compose up --build`
3. Access frontend at http://localhost:3000 and backend at http://localhost:8000

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker instructions.

## MVP Setup Instructions (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 16+
- PostgreSQL 15+ (or use SQLite for quick testing - see below)

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up database:**

   **Option A: PostgreSQL (Recommended)**
   ```bash
   # Create database
   createdb enrollment_db
   # Or using psql:
   # psql -U postgres
   # CREATE DATABASE enrollment_db;
   ```

   **Option B: SQLite (Quick Testing)**
   - Change `DATABASE_URL` in `.env` to: `sqlite:///./enrollment.db`
   - Note: Some features may have limitations with SQLite

4. **Create `.env` file:**
```bash
cp .env.example .env
# Edit .env and set at minimum:
# DATABASE_URL=postgresql://username:password@localhost:5432/enrollment_db
# SECRET_KEY=your-secret-key-here
```

5. **Run database migrations:**
```bash
alembic upgrade head
```

6. **Start the backend:**
```bash
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Create `.env` file (optional):**
```bash
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env
```

3. **Start the frontend:**
```bash
npm start
```

Frontend will be available at: `http://localhost:3000`

### Quick Test

1. Visit `http://localhost:3000`
2. Login with admin credentials
3. **Dashboard**: View course statistics and filter by type/status/time period
4. **Courses**:
   - For **onsite courses**: Create a test course, upload enrollment Excel/CSV, view enrollments organized by status, approve enrollments and manage attendance/scores
   - For **online courses**: View courses synced from LMS, see student progress and completion status
5. **Users**: 
   - View employees synced from LMS
   - Filter by department or "Never Taken Course"
   - Click Employee ID to view complete user details with course history (onsite, online, external)
   - View overall completion rates for each course type
6. **Sync Employees**: Use the sync button to fetch latest employee data from LMS

## Environment Variables

### Backend (.env) - MVP Minimum

Create `backend/.env` with these **required** variables:

```env
# REQUIRED: Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/enrollment_db

# REQUIRED: Secret key for JWT tokens (generate a random string)
SECRET_KEY=your-secret-key-change-this-to-random-string

# REQUIRED: Admin authentication credentials
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-password

# REQUIRED: LMS (Moodle) API credentials
LMS_URL=https://lms.elearning23.com/webservice/rest/server.php
LMS_TOKEN=your-moodle-api-token

# Optional: CORS origins (defaults work for localhost)
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

**Optional (for future Azure integration):**
```env
# Azure AD (for Microsoft Forms - not needed for MVP)
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=

# Azure Blob Storage (files stored locally if not set)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=enrollment-uploads
```

### Frontend (.env) - Optional

Create `frontend/.env` (optional, defaults work for localhost):

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

**Note:** 
- All API endpoints (except `/auth/login` and `/health`) require admin authentication
- Admin credentials are stored in `.env` file (already in `.gitignore`)
- Files are stored locally in `backend/uploads/` if Azure Blob Storage is not configured

## Database Schema

- `students`: Personal and role details (synced from LMS)
- `courses`: Course metadata and batches (onsite courses)
- `incoming_enrollments`: Staging table for form submissions
- `enrollments`: Main enrollment records with eligibility and approval status
- `lms_course_cache`: Cached LMS course data
- `lms_category_cache`: Cached LMS category data
- `lms_course_enrollment_cache`: Cached course enrollment data
- `lms_user_course_cache`: Cached user course history
- `lms_user_cache`: Cached LMS user data

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Key Features Implemented

✅ **Unified Course Management**
- All course and enrollment management in one place
- Support for both onsite and online (LMS) courses
- Course creation with prerequisites, seat limits, and total classes offered
- Course archiving and permanent deletion
- Course details card with prerequisite information
- Separate views for onsite and online courses

✅ **LMS (Moodle) Integration**
- Automatic employee data synchronization from LMS
- Real-time online course fetching from LMS
- Course enrollment tracking for online courses
- User course history from LMS
- Progress tracking (Completed, In Progress, Not Started)
- Smart caching system with daily automatic refresh at 12 AM Bangladesh time
- Cache-first approach for improved performance (~99% faster response times)

✅ **Enrollment Management (Within Courses)**
- **Onsite Courses**:
  - **Approved/Enrolled Students**: All approved students with score, attendance, and completion status
  - **Eligible Enrollments (Pending)**: Pending eligible students ready for approval
  - **Not Eligible Enrollments**: All non-approved ineligible students (pending and rejected) with eligibility reasons
  - **Withdrawn Students**: All withdrawn students with reinstatement option
  - Manual enrollment with search functionality
  - Approve/Reject/Withdraw/Reapprove actions
  - Admin can approve ineligible students (override flexibility)
- **Online Courses**:
  - Students organized by completion status (Completed, In Progress, Not Started)
  - Real-time progress tracking from LMS
  - Date assigned and last access information
  - Color-coded tables for easy status identification

✅ **Enrollment Intake & Validation**
- Excel/CSV upload directly from course view
- Automated eligibility checks (Prerequisites, Duplicates, Annual Limit)
- All enrollments start as PENDING (even if ineligible)
- Eligibility reasons displayed for admin review

✅ **Attendance & Completion Tracking**
- Excel/CSV upload for attendance and scores (single file) - for onsite courses
- Automatic completion status calculation (80% attendance threshold)
- Manual attendance/score update for individual students
- Overall completion rate per student (separate for onsite, online, external)
- Color-coded completion rates (Green ≥75%, Orange 60-75%, Red <60%)

✅ **User Management**
- Complete employee profiles with course history (onsite, online, external)
- Automatic sync from LMS for employee data
- Department-based filtering (replaced SBU)
- Filter by "Never Taken Course" or "Has Taken Courses"
- Overall completion rate display (separate for each course type)
- Course history with attendance and completion status
- Clickable employee IDs to view full details (everywhere in the application)

✅ **Dashboard Analytics**
- Comprehensive dashboard with course statistics
- Filter by course type (onsite, online, external)
- Time period filters (month, quarter, year)
- Status-based filtering (Planning, Upcoming, Ongoing, Completed)
- Calendar view for onsite courses
- Load more functionality for course lists

✅ **Data Preservation**
- Course history preserved when course is deleted
- Denormalized course_name and batch_code in enrollments
- Enrollment history remains visible even after course deletion
- Cached LMS data persists between refreshes

## Application Structure

### Navigation Tabs

1. **Dashboard** - Overview and analytics
   - Course statistics by type (onsite, online, external)
   - Status-based filtering (Planning, Upcoming, Ongoing, Completed)
   - Time period filters (month, quarter, year)
   - Calendar view for onsite courses
   - Load more functionality for course lists

2. **Courses** - Main page for all course and enrollment management
   - Course list with type filter (onsite, online, external)
   - Active/Archived toggle for onsite courses
   - Create/Edit/Delete courses (onsite only)
   - Expand course to view enrollments organized by status
   - Import enrollments (Excel/CSV) - onsite courses only
   - Upload attendance & scores (Excel/CSV) - onsite courses only
   - Manual student enrollment - onsite courses only
   - Course details card
   - Online course details from LMS API

3. **Users** - Employee management and course history
   - All employees list (sorted by employee ID, synced from LMS)
   - Active and Previous employees tabs
   - Course history per employee (onsite, online, external)
   - Filter by department
   - Filter by "Never Taken Course"
   - Overall completion rate display (separate for each course type)
   - Click employee ID to view full details

### Enrollment Sections (Within Courses)

**For Onsite Courses**, when a course is expanded, enrollments are organized into:

1. **Approved/Enrolled Students** - All approved students
   - Shows: Completion Status, Score, Attendance, Overall Completion
   - Actions: Edit Attendance & Score, Withdraw
   - Clickable Employee ID to view user details

2. **Eligible Enrollments (Pending)** - Pending eligible students
   - Actions: Approve, Reject
   - Clickable Employee ID to view user details

3. **Not Eligible Enrollments** - All non-approved ineligible students
   - Shows: Eligibility Reason, Approval Status (Pending/Rejected)
   - Actions: Approve (Admin Override), Reject
   - Clickable Employee ID to view user details

4. **Rejected Enrollments** - Rejected enrollments
   - Actions: Reapprove
   - Clickable Employee ID to view user details

5. **Withdrawn Students** - All withdrawn students
   - Shows: Withdrawal Reason
   - Actions: Reinstate (Reapprove)
   - Clickable Employee ID to view user details

**For Online Courses**, students are organized by completion status:

1. **Completed** - Students with 100% progress
   - Shows: Employee ID, Name, Date Assigned, Last Access, Progress
   - Green color-coded table
   - Clickable Employee ID to view user details

2. **In Progress** - Students with progress > 0% and < 100%
   - Shows: Employee ID, Name, Date Assigned, Last Access, Progress
   - Orange color-coded table
   - Clickable Employee ID to view user details

3. **Not Started** - Students with 0% progress
   - Shows: Employee ID, Name, Date Assigned, Last Access, Progress
   - Neutral color-coded table
   - Clickable Employee ID to view user details

## LMS Integration Details

The system integrates with Moodle LMS using the Moodle Web Services API:

- **Employee Sync**: Automatically fetches employee data from LMS using `core_user_get_users`
- **Online Courses**: Fetches courses from LMS using `core_course_get_courses`
- **Course Enrollments**: Retrieves enrolled students using `core_enrol_get_enrolled_users`
- **User Course History**: Fetches user's enrolled courses using `core_enrol_get_users_courses`
- **Caching**: All LMS data is cached in PostgreSQL with 24-hour expiry
- **Auto Refresh**: Daily cache refresh scheduled at 12 AM Bangladesh time (18:00 UTC)

See [API.md](API.md) for detailed LMS API documentation.

## Important Notes

- **Department vs SBU**: The system now uses "Department" instead of "SBU" throughout
- **Employee Data**: Employee data is synced from LMS; manual updates should be done in LMS
- **Online Courses**: Online courses are read-only from LMS; they cannot be edited in this system
- **Cache Refresh**: LMS cache refreshes daily automatically; manual refresh available via API
- **Performance**: Caching reduces API response times by ~99% compared to direct LMS API calls

## Documentation

- [Project Overview](PROJECT_OVERVIEW.md) - Detailed project structure and database schema
- [Architecture Overview](ARCHITECTURE.md) - System architecture
- [Deployment Guide](DEPLOYMENT.md) - Deployment instructions
- [Excel Format Guide](EXCEL_FORMAT.md) - Excel file format requirements
- [Security Audit](SECURITY_AUDIT.md) - Security audit report
- [API.md](API.md) - LMS API integration documentation

## License

Proprietary - Internal Use Only

