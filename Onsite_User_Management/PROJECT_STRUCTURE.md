# Project Structure Documentation

This document provides an exhaustive breakdown of the `Onsite_User_Management` project structure. It details the purpose of every folder and file, categorized by Backend and Frontend, and explains their interactions.

## Root Directory: `Onsite_User_Management`
The root directory serves as the entry point for the entire project, containing configuration files and the two main application subdirectories.

### Files
- **`API.md`**
    - **Purpose**: Documentation for the API endpoints.
    - **Why it is used**: To provide a reference for frontend developers or external consumers on how to interact with the backend API (request/response formats).
- **`README.md`**
    - **Purpose**: General project overview, setup steps, and usage guide.
    - **Why it is used**: To give new developers a starting point to understand what the project is and how to run it.
- **`SETUP_INSTRUCTIONS.md`**
    - **Purpose**: Step-by-step guide for setting up the development environment.
    - **Why it is used**: To ensure consistent environment setup across different developer machines.
- **`check_course.py`**
    - **Purpose**: A standalone script to verify the integrity or existence of course data in the database.
    - **Why it is used**: For manual debugging or verification of course data without running the full app.
- **`count_courses.py`**
    - **Purpose**: A utility script to count the total number of courses currently in the system.
    - **Why it is used**: Quick check to see if course syncing or creation is working as expected.
- **`docker-compose.yml`**
    - **Purpose**: Docker Compose configuration for running the application in a development environment.
    - **Why it is used**: To orchestrate the backend, frontend, and database containers with a single command (`docker-compose up`).
- **`docker-compose.prod.yml`**
    - **Purpose**: Docker Compose configuration optimized for production deployment.
    - **Why it is used**: To define production-specific settings like restart policies and environment variables.
- **`.env.example`**
    - **Purpose**: A template file listing all required environment variables.
    - **Why it is used**: To show developers which environment variables they need to configure in their own `.env` file without exposing secrets.
- **`.gitignore`**
    - **Purpose**: Specifies which files and directories Git should ignore.
    - **Why it is used**: To prevent committing sensitive files (like `.env`), dependencies (`node_modules`, `venv`), or build artifacts.

---

## Backend Structure (`backend/`)
The backend is a FastAPI application responsible for business logic, database management, and external system synchronization.

### Backend Root Files
- **`main.py`**
    - **Purpose**: The application entry point.
    - **Why it is used**: It initializes the FastAPI app, includes routers, configures middleware (CORS), and handles startup/shutdown events.
- **`requirements.txt`**
    - **Purpose**: Lists all Python libraries required to run the backend.
    - **Why it is used**: To allow `pip` to install all necessary dependencies for the project.
- **`Dockerfile`**
    - **Purpose**: Instructions for building the backend Docker container.
    - **Why it is used**: To containerize the backend application for consistent deployment.
- **`.env`**
    - **Purpose**: Local environment variables file.
    - **Why it is used**: To store sensitive configuration like database passwords and API keys locally.
- **`alembic.ini`**
    - **Purpose**: Configuration file for Alembic.
    - **Why it is used**: To tell Alembic where to find migration scripts and how to connect to the database.
- **`server.log`**
    - **Purpose**: A log file capturing runtime errors and information.
    - **Why it is used**: To debug issues that occur while the server is running.
- **`check_api_response.py`**
    - **Purpose**: Script to test if the API is returning expected responses.
    - **Why it is used**: For automated or manual verification of API health.
- **`check_endpoints.py`**
    - **Purpose**: Script to verify that critical API endpoints are reachable.
    - **Why it is used**: To ensure the API is up and routing is working correctly.
- **`check_app.py`**
    - **Purpose**: Script to verify that the backend application can be imported successfully.
    - **Why it is used**: To catch syntax errors or import loops in the main application before running the server.
- **`check_courses.py`**
    - **Purpose**: Script to directly query the database for courses.
    - **Why it is used**: To inspect the contents of the `courses` table using a direct DB connection, bypassing the API.
- **`check_lms_enrollment_api.py`**
    - **Purpose**: Specific check for the LMS enrollment API integration.
    - **Why it is used**: To debug issues specifically related to fetching enrollments from the LMS.
- **`clear_all_employees.py`**
    - **Purpose**: **Danger**: Script to wipe all employee data from the database.
    - **Why it is used**: For resetting the database state during development or testing.
- **`count_active_users.py`**
    - **Purpose**: Script to count users currently marked as active.
    - **Why it is used**: To verify user status logic and database content.
- **`debug_user.py` / `debug_user_v2.py`**
    - **Purpose**: Scripts to inspect specific user data.
    - **Why it is used**: To troubleshoot issues with specific user accounts without SQL queries.
- **`inspect_db_columns.py`**
    - **Purpose**: Utility to print out database table columns.
    - **Why it is used**: To verify that the database schema matches the SQLAlchemy models.
- **`sync_dates.py`**
    - **Purpose**: Script to manually trigger date synchronization logic.
    - **Why it is used**: To fix or update date-related data without waiting for a scheduled job.
- **`sync_mentors.py`**
    - **Purpose**: Script to manually trigger mentor data synchronization.
    - **Why it is used**: To force an update of mentor data from external sources.
- **`sync_progress.py`**
    - **Purpose**: Script to manually trigger student progress synchronization.
    - **Why it is used**: To update student course progress immediately.
- **`test_api_connections.py`**
    - **Purpose**: Tests connectivity to external APIs.
    - **Why it is used**: To ensure the backend can reach 3rd party services (LMS, ERP).
- **`test_email_direct.py`**
    - **Purpose**: Tests email sending functionality directly.
    - **Why it is used**: To verify SMTP settings and email templates.
- **`test_enrollments_api.py`**
    - **Purpose**: Tests the enrollments API endpoints.
    - **Why it is used**: To ensure enrollment creation/retrieval works via API.
- **`test_erp_cache.py`**
    - **Purpose**: Tests the caching mechanism for ERP data.
    - **Why it is used**: To verify that ERP data is being cached correctly to improve performance.
- **`test_lms_api.py`**
    - **Purpose**: Tests the LMS API integration.
    - **Why it is used**: To verify that the backend can correctly authenticate and fetch data from the LMS.
- **`test_lms_sync.py`**
    - **Purpose**: Tests the logic for synchronizing data from LMS.
    - **Why it is used**: To ensure the sync process correctly maps LMS data to local models.
- **`test_reminder.py`**
    - **Purpose**: Tests the reminder email functionality.
    - **Why it is used**: To verify that reminders are generated and sent correctly.
- **`verify_summary_reports.py`**
    - **Purpose**: Script to verify the accuracy of generated summary reports.
    - **Why it is used**: To ensure report data matches the underlying database records.
- **`view_lms_data.py`**
    - **Purpose**: Utility to view raw data fetched from the LMS.
    - **Why it is used**: To inspect the raw JSON response from LMS for debugging mapping issues.
- **`add_external_id_column.py`**
    - **Purpose**: Migration helper or script to add a specific column.
    - **Why it is used**: Likely a one-off script to patch the DB schema.

### App Directory (`backend/app/`)
Contains the core logic of the API.

#### `api/` (API Routes)
Defines the HTTP endpoints for the application.
- **`auth.py`**
    - **Purpose**: Routes for user authentication.
    - **Why it is used**: Handles login, token generation, and user session management.
- **`completions.py`**
    - **Purpose**: Routes for fetching and updating course completion status.
    - **Why it is used**: Allows the frontend to display or update how much of a course a student has finished.
- **`courses.py`**
    - **Purpose**: Routes for CRUD operations on courses.
    - **Why it is used**: Allows creating, reading, updating, and deleting courses.
- **`enrollments.py`**
    - **Purpose**: Routes for managing student enrollments.
    - **Why it is used**: Handles assigning students to courses and tracking their status.
- **`lms.py`**
    - **Purpose**: Routes for triggering LMS-related actions.
    - **Why it is used**: Exposes endpoints to manually sync with LMS or view LMS-specific data.
- **`mentors.py`**
    - **Purpose**: Routes for managing mentors.
    - **Why it is used**: Handles adding/removing mentors and assigning them to courses.
- **`students.py`**
    - **Purpose**: Routes for managing student profiles.
    - **Why it is used**: Allows retrieving student lists, details, and updating their info.
- **`cron.py`**
    - **Purpose**: Endpoints to trigger cron jobs manually.
    - **Why it is used**: Allows admins to force-run background tasks via API.
- **`imports.py`**
    - **Purpose**: Routes for handling bulk data imports.
    - **Why it is used**: Handles CSV file uploads for bulk creating students or courses.

#### `core/` (Core Configuration)
Essential application setup and utilities.
- **`config.py`**
    - **Purpose**: Loads and validates environment variables.
    - **Why it is used**: Centralizes configuration access (e.g., `settings.DATABASE_URL`).
- **`auth.py`**
    - **Purpose**: Authentication logic.
    - **Why it is used**: Implements JWT token creation, validation, and password hashing algorithms.
- **`file_utils.py`**
    - **Purpose**: Helper functions for file operations.
    - **Why it is used**: Handles saving uploaded files and reading them safely.
- **`lifespan.py`**
    - **Purpose**: Manages startup and shutdown events.
    - **Why it is used**: Ensures database connections are opened on startup and closed on shutdown.
- **`rate_limit.py`**
    - **Purpose**: Rate limiting logic.
    - **Why it is used**: Protects the API from being overwhelmed by too many requests.
- **`validation.py`**
    - **Purpose**: Custom validation logic.
    - **Why it is used**: Provides reusable validation functions for data inputs.

#### `db/` (Database)
- **`base.py`**
    - **Purpose**: Database connection setup.
    - **Why it is used**: Creates the SQLAlchemy engine and `SessionLocal` factory for DB access.

#### `models/` (Database Models)
SQLAlchemy classes representing database tables.
- **`course.py`**
    - **Purpose**: Represents the `courses` table.
    - **Why it is used**: Stores course details (title, description, dates).
- **`student.py`**
    - **Purpose**: Represents the `students` table.
    - **Why it is used**: Stores employee/student details.
- **`enrollment.py`**
    - **Purpose**: Represents the `enrollments` table.
    - **Why it is used**: Links students to courses and tracks their progress/status.
- **`mentor.py`**
    - **Purpose**: Represents the `mentors` table.
    - **Why it is used**: Stores mentor details.
- **`course_mentor.py`**
    - **Purpose**: Association table.
    - **Why it is used**: Handles the many-to-many relationship between courses and mentors.
- **`course_comment.py`**
    - **Purpose**: Represents comments on courses.
    - **Why it is used**: Stores user feedback or notes on courses.
- **`course_draft.py`**
    - **Purpose**: Represents draft versions of courses.
    - **Why it is used**: Allows saving course work-in-progress before publishing.
- **`class_reminder.py`**
    - **Purpose**: Stores schedules for class reminders.
    - **Why it is used**: Tracks when reminders should be sent for specific classes.
- **`lms_user.py`**
    - **Purpose**: Model for LMS users.
    - **Why it is used**: Stores user data specifically synced from the LMS for mapping.
- **`lms_cache.py`**
    - **Purpose**: Caches LMS responses.
    - **Why it is used**: Reduces API calls to the LMS by storing recent responses.
- **`erp_cache.py`**
    - **Purpose**: Caches ERP responses.
    - **Why it is used**: Reduces API calls to the ERP system.

#### `schemas/` (Pydantic Schemas)
Data validation and serialization models.
- **`course.py`**: Input/Output schemas for Course data.
- **`student.py`**: Input/Output schemas for Student data.
- **`enrollment.py`**: Input/Output schemas for Enrollment data.
- **`mentor.py`**: Input/Output schemas for Mentor data.
- **`course_comment.py`**: Schemas for comment data.
- **`course_draft.py`**: Schemas for course drafts.

#### `services/` (Business Logic)
The "brain" of the application.
- **`course_service.py`**
    - **Purpose**: Logic for course management.
    - **Why it is used**: Encapsulates rules for creating/editing courses.
- **`student_service.py`**
    - **Purpose**: Logic for student management.
    - **Why it is used**: Encapsulates rules for student data handling.
- **`enrollment_service.py`**
    - **Purpose**: Logic for enrollment management.
    - **Why it is used**: Handles complex enrollment rules (prerequisites, capacity).
- **`email_service.py`**
    - **Purpose**: Logic for sending emails.
    - **Why it is used**: Abstraction for sending emails so other services don't need to know SMTP details.
- **`erp_service.py`**
    - **Purpose**: Interface for ERP system.
    - **Why it is used**: Handles authentication and data fetching from the ERP.
- **`erp_sync_service.py`**
    - **Purpose**: Logic to sync with ERP.
    - **Why it is used**: Orchestrates the update of local data based on ERP data.
- **`scheduler_service.py`**
    - **Purpose**: Background task scheduler.
    - **Why it is used**: Configures and runs periodic jobs (like nightly syncs).
- **`sync_orchestrator.py`**
    - **Purpose**: Orchestrates synchronization.
    - **Why it is used**: Coordinates multiple sync services (LMS, ERP) to run in the correct order.
- **`completion_service.py`**
    - **Purpose**: Logic for tracking completions.
    - **Why it is used**: Calculates completion rates and updates status based on progress.
- **`eligibility_service.py`**
    - **Purpose**: Logic for determining eligibility.
    - **Why it is used**: Checks if a student meets requirements to enroll in a course.
- **`reminder_service.py`**
    - **Purpose**: Logic for sending reminders.
    - **Why it is used**: Checks schedules and triggers emails for upcoming classes.
- **`lms/`**:
    - **`client.py`**: Low-level HTTP client for LMS API.
    - **`data.py`**: Data processing for LMS responses.
    - **`sync.py`**: Logic to sync LMS data to local DB.
- **`reporting/`**:
    - **`course_reports.py`**: Generates reports related to courses.
    - **`student_reports.py`**: Generates reports related to students.
    - **`lms_reports.py`**: Generates reports based on LMS data.
- **`imports/`**:
    - **`students.py`**: Logic for importing students from files.
    - **`courses.py`**: Logic for importing courses from files.
    - **`enrollments.py`**: Logic for importing enrollments from files.

### Tests Directory (`backend/tests/`)
- **`run_all_tests.py`**: Script to discover and run all tests.
- **`test_api_endpoints.py`**: Integration tests for general API endpoints.
- **`test_authentication.py`**: Tests for login and auth flows.
- **`test_courses.py`**: Tests for course management logic.
- **`test_enrollments.py`**: Tests for enrollment logic.
- **`test_enrollment_api_endpoints.py`**: Specific tests for enrollment APIs.
- **`test_import_service.py`**: Tests for the bulk import functionality.
- **`test_manual_enrollment.py`**: Tests for manually enrolling students.
- **`test_completion_rate.py`**: Tests for completion rate calculations.
- **`test_eligibility_service.py`**: Tests for eligibility rules.
- **`test_file_upload_security.py`**: Security tests for file uploads.
- **`test_input_validation.py`**: Tests for input validation rules.
- **`test_attendance_upload.py`**: Tests for attendance file uploads.

### Alembic Directory (`backend/alembic/`)
- **`env.py`**: Python script that runs during migrations to configure the context.
- **`versions/`**: Directory containing individual migration scripts.
- **`script.py.mako`**: Template file for generating new migration scripts.

---

## Frontend Structure (`frontend/`)
The frontend is a Single Page Application (SPA) built with React.

### Frontend Root Files
- **`src/`**: Source code directory.
- **`public/`**: Static assets served directly (index.html, robots.txt).
- **`package.json`**: Defines project dependencies and scripts.
- **`package-lock.json`**: Locks dependency versions for consistency.
- **`tsconfig.json`**: TypeScript compiler configuration.
- **`Dockerfile`**: Instructions for building the frontend for production.
- **`.dockerignore`**: Files to exclude from the Docker build context.

### Source Directory (`frontend/src/`)
- **`index.tsx`**
    - **Purpose**: The entry point.
    - **Why it is used**: Mounts the React app to the DOM.
- **`App.tsx`**
    - **Purpose**: The root component.
    - **Why it is used**: Sets up routing and the main theme provider.
- **`index.css`**
    - **Purpose**: Global CSS styles.
    - **Why it is used**: Applies base styles and resets.
- **`react-app-env.d.ts`**
    - **Purpose**: TypeScript declarations.
    - **Why it is used**: Ensures TypeScript understands React App specific types (like image imports).

#### `components/` (Shared Components)
- **`Layout.tsx`**
    - **Purpose**: The main page structure.
    - **Why it is used**: Provides the persistent Sidebar and Header across pages.
- **`PrivateRoute.tsx`**
    - **Purpose**: Route wrapper.
    - **Why it is used**: Redirects unauthenticated users to the Login page.
- **`DateRangeSelector.tsx`**
    - **Purpose**: Date picker component.
    - **Why it is used**: Allows users to select a start and end date range.
- **`common/`**:
    - **`AlertMessage.tsx`**: Snackbar/toast component.
        - **Why it is used**: To show temporary success/error messages to the user.
    - **`StatusChip.tsx`**: Status indicator.
        - **Why it is used**: To visually represent status (Active, Completed) with consistent colors.
    - **`GradientCard.tsx`**: Stylistic card.
        - **Why it is used**: To provide a visually appealing container for content.
    - **`TimePeriodFilter.tsx`**: Time range dropdown.
        - **Why it is used**: To filter data views by time (e.g., "Last 7 days").
    - **`index.ts`**: Export file.
        - **Why it is used**: Simplifies imports from this directory.
- **`dialogs/`**:
    - **`AddExternalMentorDialog.tsx`**: Modal form.
        - **Why it is used**: To input details for a new external mentor.
    - **`CourseFormDialog.tsx`**: Modal form.
        - **Why it is used**: To create or edit course details.
    - **`UserDetailsDialog.tsx`**: Modal view.
        - **Why it is used**: To display comprehensive details about a user.
    - **`AssignInternalMentorDialog.tsx`**: Modal form.
        - **Why it is used**: To select an existing employee to be a mentor.
    - **`CourseDetailsDialog.tsx`**: Modal view.
        - **Why it is used**: To show a quick summary of a course.
    - **`MentorDetailsDialog.tsx`**: Modal view.
        - **Why it is used**: To show details of a mentor.
    - **`UserDetails/`**: Folder containing sub-components for the UserDetails dialog.

#### `pages/` (Views)
- **`Dashboard/`**:
    - **`index.tsx`**: Main dashboard view.
    - **`components/`**:
        - **`AlertMessage.tsx`**: Dashboard-specific alerts.
        - **`ClassScheduleForm.tsx`**: Form to schedule classes.
        - **`GradientCard.tsx`**: Dashboard-specific stats cards.
        - **`StatusChip.tsx`**: Status indicators for dashboard items.
        - **`TimePeriodFilter.tsx`**: Filter for dashboard charts.
    - **`utils/`**:
        - **`api.ts`**: Dashboard-specific API calls.
- **`Courses/`**:
    - **`index.tsx`**: Course Management page.
    - **`components/`**:
        - **`CreateCourseDialog.tsx`**: Dialog to create a course.
        - **`EditCourseDialog.tsx`**: Dialog to edit a course.
    - **`hooks/`**:
        - **`useCoursesData.ts`**: Hook to fetch courses.
        - **`usePrerequisiteCourses.ts`**: Hook to fetch prerequisites.
    - **`utils/`**:
        - **`courseFilters.ts`**: Logic for filtering the course list.
        - **`courseHandlers.ts`**: Event handlers for course actions.
        - **`courseFormHandlers.ts`**: Form submission logic.
        - **`mentorHandlers.ts`**: Logic for handling mentor assignment.
- **`CourseDetail/`**:
    - **`index.tsx`**: Course Detail page.
    - **`components/`**: Contains tabs and sections for the course detail view.
- **`Mentors/`**:
    - **`index.tsx`**: Mentor Management page.
    - **`components/`**:
        - **`MentorsTable.tsx`**: Data grid displaying mentors.
        - **`MentorStatsDialog.tsx`**: Dialog showing mentor stats.
    - **`hooks/`**:
        - **`useMentorsData.ts`**: Hook to fetch mentors.
- **`Users/`**:
    - **`index.tsx`**: User Management page.
    - **`components/`**:
        - **`CourseHistoryCard.tsx`**: Component showing a user's past courses.
        - **`CreateStudentDialog.tsx`**: Dialog to manually add a student.
        - **`ImportDialog.tsx`**: Dialog to import users from CSV.
    - **`hooks/`**:
        - **`useUsersData.ts`**: Hook to fetch users.
- **`PreviousEmployees/`**:
    - **`index.tsx`**: Archived Employees page.
    - **`components/`**:
        - **`EmployeeTable.tsx`**: Table for previous employees.
- **`Reports/`**:
    - **`index.tsx`**: Reports page.
    - **`components/`**: Components for selecting report types.
- **`Login.tsx`**: Login page.

#### `services/` (API Layer)
- **`api.ts`**
    - **Purpose**: Centralized API client.
    - **Why it is used**: Configures Axios with base URL and interceptors, and defines methods for all API calls.

#### `hooks/` (Global Hooks)
- **`useMentorStats.ts`**
    - **Purpose**: Hook to fetch mentor statistics.
    - **Why it is used**: Reusable logic to get mentor performance data.
- **`useStudentDetails.ts`**
    - **Purpose**: Hook to fetch student details.
    - **Why it is used**: Reusable logic to get full details of a student.

#### `utils/` (Global Utilities)
- **`dateUtils.ts`**
    - **Purpose**: Date manipulation functions.
    - **Why it is used**: Consistent formatting and calculation of dates across the app.
- **`courseUtils.ts`**
    - **Purpose**: Course helper functions.
    - **Why it is used**: Common logic for processing course data objects.
- **`sanitize.ts`**
    - **Purpose**: Input sanitization.
    - **Why it is used**: Cleans user input to prevent security vulnerabilities (XSS).
- **`experienceUtils.ts`**
    - **Purpose**: Experience calculation.
    - **Why it is used**: Calculates employee tenure based on joining date.
- **`dateRangeUtils.ts`**
    - **Purpose**: Date range helpers.
    - **Why it is used**: Logic for handling start/end date selections.
