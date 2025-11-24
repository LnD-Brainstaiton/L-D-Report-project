"""Service for interacting with Moodle LMS API."""
import httpx
from typing import List, Dict, Optional, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LMSService:
    """Service for fetching data from Moodle LMS API."""
    
    @staticmethod
    async def fetch_all_users() -> List[Dict[str, Any]]:
        """
        Fetch all users from Moodle LMS using core_user_get_users.
        
        Returns:
            List of user dictionaries from Moodle API
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        url = settings.LMS_BASE_URL
        
        # Use criteria to get all users (email with % wildcard)
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_user_get_users",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
            "criteria[0][key]": "email",
            "criteria[0][value]": "%"  # Match all emails
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    raise Exception(f"LMS API error: {error_msg}")
                
                # Return users list
                users = data.get("users", [])
                logger.info(f"Fetched {len(users)} users from LMS API")
                return users
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching users from LMS: {str(e)}")
            raise Exception(f"Failed to fetch users from LMS API: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching users from LMS: {str(e)}")
            raise
    
    @staticmethod
    def extract_fullname_from_real_info(user: Dict[str, Any]) -> Optional[str]:
        """
        Extract fullname from customfields (real_info) if available.
        Falls back to fullname field if not found.
        
        Args:
            user: User dictionary from LMS API
            
        Returns:
            Full name string or None
        """
        # First try to get fullname directly
        fullname = user.get("fullname")
        if fullname:
            return fullname
        
        # Try to extract from customfields
        customfields = user.get("customfields", [])
        for field in customfields:
            # Look for real_info or similar fields
            shortname = field.get("shortname", "").lower()
            name = field.get("name", "").lower()
            value = field.get("value") or field.get("displayvalue")
            
            if value and ("real" in shortname or "real" in name or "fullname" in shortname or "fullname" in name):
                return value
        
        # Fallback to firstname + lastname
        firstname = user.get("firstname", "")
        lastname = user.get("lastname", "")
        if firstname or lastname:
            return f"{firstname} {lastname}".strip()
        
        return None
    
    @staticmethod
    def map_lms_user_to_student(user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Map LMS API user data to our student/employee format.
        
        Mapping:
        - employee_id = username (e.g., "bs1981")
        - name = fullname from real_info (or fullname field)
        - email = email
        - department = department (from API, replaces sbu)
        - is_active = determined by suspended status or other indicators
        
        Args:
            user: User dictionary from LMS API
            
        Returns:
            Dictionary with mapped student data or None if required fields are missing
        """
        username = user.get("username")
        email = user.get("email")
        
        if not username or not email:
            logger.warning(f"Skipping user with missing username or email: {user.get('id')}")
            return None
        
        # Extract fullname from real_info or use fullname field
        fullname = LMSService.extract_fullname_from_real_info(user)
        if not fullname:
            logger.warning(f"Skipping user {username}: no fullname found")
            return None
        
        # Get department from API (replaces sbu)
        department = user.get("department", "").strip()
        if not department:
            department = "Other"  # Default if not specified
        
        # Determine employment status
        # suspended=1 means inactive, suspended=0 means active
        suspended = user.get("suspended", 0)
        is_active = suspended == 0
        
        # Map department to our enum values if needed
        # The department field from API might have different values
        # We'll need to normalize it or allow any string value
        
        return {
            "employee_id": username,  # id is the username (e.g., "bs1981")
            "name": fullname,
            "email": email,
            "department": department,
            "is_active": is_active,
            "designation": user.get("institution", ""),  # Could use institution or other field
            # Additional fields that might be useful
            "lms_id": user.get("id"),  # Store LMS internal ID for reference
            "lms_lastaccess": user.get("lastaccess"),
        }
    
    @staticmethod
    async def fetch_lms_courses() -> List[Dict[str, Any]]:
        """
        Fetch all courses from Moodle LMS using core_course_get_courses.
        
        Returns:
            List of course dictionaries from Moodle API
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        url = settings.LMS_BASE_URL
        
        # Fetch all courses (empty options[ids] returns all courses except front page)
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_course_get_courses",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    raise Exception(f"LMS API error: {error_msg}")
                
                # The response is a list of courses (not wrapped in a "courses" key)
                courses = data if isinstance(data, list) else []
                
                # Filter out the front page course (id=1 typically)
                courses = [c for c in courses if c.get("id", 0) != 1]
                
                logger.info(f"Fetched {len(courses)} courses from LMS API")
                return courses
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching courses from LMS: {str(e)}")
            raise Exception(f"Failed to fetch courses from LMS API: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching courses from LMS: {str(e)}")
            raise
    
    @staticmethod
    async def fetch_course_categories() -> Dict[int, str]:
        """
        Fetch course categories from Moodle LMS to map categoryid to categoryname.
        First tries core_course_get_categories, then falls back to fetching category info
        from individual courses using core_course_get_courses_by_field.
        
        Returns:
            Dictionary mapping categoryid to categoryname
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        url = settings.LMS_BASE_URL
        category_map = {}
        
        # First, try to fetch all categories at once
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_course_get_categories",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    logger.warning(f"core_course_get_categories failed: {error_msg}, trying fallback method")
                    raise Exception(f"LMS API error: {error_msg}")
                
                # Build category map
                categories = data if isinstance(data, list) else []
                category_map = {cat.get("id"): cat.get("name", "Unknown") for cat in categories}
                
                if category_map:
                    logger.info(f"Fetched {len(category_map)} categories from LMS API using core_course_get_categories")
                    return category_map
                    
        except Exception as e:
            logger.warning(f"Failed to fetch categories using core_course_get_categories: {str(e)}")
        
        # Fallback: Fetch category info from courses using core_course_get_courses_by_field
        # This requires fetching courses first to get their IDs
        try:
            courses = await LMSService.fetch_lms_courses()
            if not courses:
                logger.warning("No courses found, cannot build category map")
                return {}
            
            # Fetch category info for a sample of courses (limit to first 50 to avoid too many API calls)
            # We'll build the category map from the course responses
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Get unique category IDs from courses
                category_ids = set()
                for course in courses[:100]:  # Limit to first 100 courses
                    cat_id = course.get("categoryid")
                    if cat_id and cat_id not in category_map:
                        category_ids.add(cat_id)
                
                # Try to fetch category info using core_course_get_courses_by_field for a few courses
                # This will give us categoryname in the response
                for course in courses[:20]:  # Try first 20 courses
                    course_id = course.get("id")
                    if not course_id:
                        continue
                    
                    try:
                        params = {
                            "wstoken": settings.LMS_TOKEN,
                            "wsfunction": "core_course_get_courses_by_field",
                            "moodlewsrestformat": settings.LMS_REST_FORMAT,
                            "field": "id",
                            "value": str(course_id),
                        }
                        
                        response = await client.post(url, params=params)
                        response.raise_for_status()
                        data = response.json()
                        
                        if "exception" not in data and "courses" in data and len(data["courses"]) > 0:
                            course_data = data["courses"][0]
                            cat_id = course_data.get("categoryid")
                            cat_name = course_data.get("categoryname")
                            if cat_id and cat_name:
                                category_map[cat_id] = cat_name
                                
                    except Exception as e:
                        logger.debug(f"Failed to fetch category for course {course_id}: {str(e)}")
                        continue
                
                if category_map:
                    logger.info(f"Built category map with {len(category_map)} categories using fallback method")
                    return category_map
                    
        except Exception as e:
            logger.error(f"Error in fallback category fetching: {str(e)}")
        
        logger.warning("Could not fetch category names, returning empty map")
        return {}
    
    @staticmethod
    async def fetch_course_enrollments(course_id: int) -> List[Dict[str, Any]]:
        """
        Fetch all enrolled users for a specific course from Moodle LMS using core_enrol_get_enrolled_users.
        
        Args:
            course_id: The Moodle course ID
            
        Returns:
            List of enrolled user dictionaries from Moodle API
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        url = settings.LMS_BASE_URL
        
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_enrol_get_enrolled_users",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
            "courseid": str(course_id),
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    raise Exception(f"LMS API error: {error_msg}")
                
                # The response is a list of users (not wrapped in a key)
                users = data if isinstance(data, list) else []
                
                logger.info(f"Fetched {len(users)} enrolled users for course {course_id} from LMS API")
                return users
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching enrollments from LMS: {str(e)}")
            raise Exception(f"Failed to fetch enrollments from LMS API: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching enrollments from LMS: {str(e)}")
            raise
    
    @staticmethod
    async def fetch_user_by_username(username: str) -> Optional[Dict[str, Any]]:
        """
        Find a user in LMS by username (employee_id) using core_user_get_users_by_field.
        
        Args:
            username: The username/employee_id to search for
            
        Returns:
            User dictionary if found, None otherwise
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        url = settings.LMS_BASE_URL
        
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_user_get_users_by_field",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
            "field": "username",
            "values[0]": username,
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    logger.warning(f"LMS API error finding user: {error_msg}")
                    return None
                
                # The response is a list of users
                users = data if isinstance(data, list) else []
                if users and len(users) > 0:
                    return users[0]
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error finding user in LMS: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error finding user in LMS: {str(e)}")
            return None
    
    @staticmethod
    async def fetch_user_courses(username: str) -> List[Dict[str, Any]]:
        """
        Fetch all courses for a specific user from Moodle LMS using core_enrol_get_users_courses.
        
        Args:
            username: The username/employee_id to find and get courses for
            
        Returns:
            List of course dictionaries for the user
        """
        if not settings.LMS_TOKEN:
            raise ValueError("LMS_TOKEN is not configured. Please set it in .env file")
        
        # First, find the user by username to get their ID
        user = await LMSService.fetch_user_by_username(username)
        if not user:
            logger.warning(f"User with username {username} not found in LMS")
            return []
        
        user_id = user.get("id")
        if not user_id:
            logger.warning(f"User found but no ID for username {username}")
            return []
        
        url = settings.LMS_BASE_URL
        
        params = {
            "wstoken": settings.LMS_TOKEN,
            "wsfunction": "core_enrol_get_users_courses",
            "moodlewsrestformat": settings.LMS_REST_FORMAT,
            "userid": str(user_id),
            "returnusercount": "0",  # Don't return user count
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Handle error responses
                if "exception" in data:
                    error_msg = data.get("message", "Unknown error from LMS API")
                    raise Exception(f"LMS API error: {error_msg}")
                
                # The response is a list of courses
                courses = data if isinstance(data, list) else []
                
                logger.info(f"Fetched {len(courses)} courses for user {username} (ID: {user_id}) from LMS API")
                return courses
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching user courses from LMS: {str(e)}")
            raise Exception(f"Failed to fetch user courses from LMS API: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching user courses from LMS: {str(e)}")
            raise

